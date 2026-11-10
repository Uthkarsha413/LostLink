
from pathlib import Path

from app.services.report_repository import (
    get_active_reports,
    get_active_report_images,
)

from app.services.vector_store import search_similar_text

from app.services.hybrid_matcher import calculate_hybrid_match

from app.services.clip_search import search_similar_report_images

from app.services.clip_indexer import IMAGE_STORAGE_DIR


def run_matching_pipeline(lost_report_id: int) -> dict:
    """
    Multimodal LOST-to-FOUND matching pipeline.

    1. Retrieve active LOST report.
    2. Retrieve text-similar FOUND candidates.
    3. Retrieve accepted LOST images.
    4. Search visually similar FOUND images using CLIP.
    5. Combine text and image candidates.
    6. Calculate hybrid scores using semantic, CLIP and metadata signals.
    7. Return ranked recommendations.

    CLIP candidate images must already be indexed in Qdrant.
    """

    # --------------------------------------------------
    # 1. Retrieve active LOST report
    # --------------------------------------------------

    lost_reports = get_active_reports("LOST")

    lost_item = next(
        (
            report
            for report in lost_reports
            if report["report_id"] == lost_report_id
        ),
        None,
    )

    if not lost_item:
        raise ValueError("Active LOST report not found.")

    # --------------------------------------------------
    # 2. Build semantic search query
    # --------------------------------------------------

    query = " ".join(
        str(value).strip()
        for value in [
            lost_item.get("title"),
            lost_item.get("description"),
            lost_item.get("category_name"),
            lost_item.get("color"),
            lost_item.get("brand"),
        ]
        if value and str(value).strip()
    )

    # --------------------------------------------------
    # 3. Retrieve text-similar FOUND candidates
    # --------------------------------------------------

    text_candidates = search_similar_text(
        query,
        report_type="FOUND",
        limit=10,
    )

    text_scores = {}

    for candidate in text_candidates:
        payload = candidate.get("payload") or {}
        found_id = payload.get("report_id")

        if found_id is None:
            continue

        score = float(candidate["score"])

        text_scores[found_id] = max(
            text_scores.get(found_id, 0.0),
            score,
        )

    # --------------------------------------------------
    # 4. Retrieve accepted images of the LOST report
    # --------------------------------------------------

    lost_images = get_active_report_images(lost_report_id)

    # --------------------------------------------------
    # 5. Search FOUND images using CLIP
    # --------------------------------------------------

    clip_scores = {}

    image_searches = 0
    image_search_errors = []

    for lost_image in lost_images:

        image_path = (
            IMAGE_STORAGE_DIR / lost_image["storage_key"]
        )

        if not image_path.is_file():
            image_search_errors.append({
                "image_id": lost_image["image_id"],
                "error": "Source image file not found.",
            })
            continue

        try:
            visual_candidates = search_similar_report_images(
                image_path=str(image_path),
                target_report_type="FOUND",
                limit=50,
                exclude_report_id=lost_report_id,
            )

            image_searches += 1

            for candidate in visual_candidates:

                found_id = candidate.get("report_id")

                if found_id is None:
                    continue

                score = float(
                    candidate["similarity_score"]
                )

                # Keep the strongest visual similarity
                # across all accepted source images.
                clip_scores[found_id] = max(
                    clip_scores.get(found_id, 0.0),
                    score,
                )

        except Exception as error:
            image_search_errors.append({
                "image_id": lost_image["image_id"],
                "error": str(error),
            })

    # --------------------------------------------------
    # 6. Combine text and CLIP candidate report IDs
    # --------------------------------------------------

    candidate_ids = set(text_scores.keys())

    candidate_ids.update(clip_scores.keys())

    # Retrieve active FOUND reports from MySQL.
    found_reports = get_active_reports("FOUND")

    found_report_map = {
        report["report_id"]: report
        for report in found_reports
    }

    results = []

    # --------------------------------------------------
    # 7. Calculate multimodal hybrid matching scores
    # --------------------------------------------------

    for found_id in candidate_ids:

        found_item = found_report_map.get(found_id)

        if not found_item:
            continue

        clip_score = clip_scores.get(found_id)

        text_score = text_scores.get(found_id)

        match_result = calculate_hybrid_match(
            {
                "description": lost_item.get("description"),
                "category": lost_item.get("category_name"),
                "brand": lost_item.get("brand"),
                "colour": lost_item.get("color"),
                "location": lost_item.get("location_name"),
                "event_datetime": lost_item.get(
                    "event_datetime"
                ),
            },
            {
                "description": found_item.get("description"),
                "category": found_item.get("category_name"),
                "brand": found_item.get("brand"),
                "colour": found_item.get("color"),
                "location": found_item.get("location_name"),
                "event_datetime": found_item.get(
                    "event_datetime"
                ),
            },
            clip_image_score=clip_score,
        )

        # --------------------------------------------------
        # 8. Store matching results
        # --------------------------------------------------

        results.append(
            {
                "lost_report_id": lost_report_id,

                "found_report_id": found_id,

                "lost_item": {
                    "title": lost_item.get("title"),
                    "description": lost_item.get("description"),
                    "category": lost_item.get("category_name"),
                    "brand": lost_item.get("brand"),
                    "colour": lost_item.get("color"),
                    "location": lost_item.get("location_name"),
                },

                "found_item": {
                    "title": found_item.get("title"),
                    "description": found_item.get("description"),
                    "category": found_item.get("category_name"),
                    "brand": found_item.get("brand"),
                    "colour": found_item.get("color"),
                    "location": found_item.get("location_name"),
                },

                "qdrant_similarity": (
                    round(text_score, 4)
                    if text_score is not None
                    else None
                ),

                "clip_image_similarity": (
                    round(clip_score, 4)
                    if clip_score is not None
                    else None
                ),

                **match_result,
            }
        )

    # --------------------------------------------------
    # 9. Sort by final hybrid score
    # --------------------------------------------------

    results.sort(
        key=lambda item: item["final_score"],
        reverse=True,
    )

    # --------------------------------------------------
    # 10. Return multimodal matching response
    # --------------------------------------------------

    return {
        "lost_report_id": lost_report_id,

        "matching_type": "MULTIMODAL_HYBRID",

        "text_candidates_found": len(text_scores),

        "clip_candidates_found": len(clip_scores),

        "accepted_source_images": len(lost_images),

        "successful_image_searches": image_searches,

        "image_search_errors": image_search_errors,

        "candidates_checked": len(results),

        "matches": results,
    }
