
from app.services.report_repository import get_active_reports
from app.services.vector_store import search_similar_text
from app.services.hybrid_matcher import calculate_hybrid_match


def run_matching_pipeline(lost_report_id: int) -> dict:
    """
    Find potential FOUND reports matching a LOST report.

    Qdrant performs semantic candidate retrieval.
    The hybrid matcher evaluates candidates using multiple signals.
    AI scores are recommendations, not proof of ownership.
    """

    # 1. Retrieve active LOST reports
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

    # 2. Build semantic search query
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

    # 3. Retrieve similar FOUND reports from Qdrant
    candidates = search_similar_text(
        query,
        report_type="FOUND",
        limit=10,
    )

    # 4. Retrieve active FOUND report details from MySQL
    found_reports = get_active_reports("FOUND")

    results = []

    # 5. Evaluate each candidate
    for candidate in candidates:
        found_id = candidate["payload"]["report_id"]

        found_item = next(
            (
                report
                for report in found_reports
                if report["report_id"] == found_id
            ),
            None,
        )

        if not found_item:
            continue

        # 6. Calculate hybrid similarity
        match_result = calculate_hybrid_match(
            {
                "description": lost_item.get("description"),
                "category": lost_item.get("category_name"),
                "brand": lost_item.get("brand"),
                "colour": lost_item.get("color"),
                "location": lost_item.get("location_name"),
                "event_datetime": lost_item.get("event_datetime"),
            },
            {
                "description": found_item.get("description"),
                "category": found_item.get("category_name"),
                "brand": found_item.get("brand"),
                "colour": found_item.get("color"),
                "location": found_item.get("location_name"),
                "event_datetime": found_item.get("event_datetime"),
            },
        )

        # 7. Store item details and matching results
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

                "qdrant_similarity": round(
                    candidate["score"],
                    4,
                ),

                **match_result,
            }
        )

    # 8. Sort candidates by final matching score
    results.sort(
        key=lambda item: item["final_score"],
        reverse=True,
    )

    # 9. Return matching response
    return {
        "lost_report_id": lost_report_id,
        "candidates_checked": len(results),
        "matches": results,
    }

