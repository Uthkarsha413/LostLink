
from app.services.clip_embedder import encode_text
from app.services.qdrant_client import client, CLIP_COLLECTION
from qdrant_client.models import FieldCondition, Filter, MatchValue


def search_images_by_text(
    query_text: str,
    target_report_type: str = "FOUND",
    limit: int = 5,
    exclude_report_id: int | None = None,
) -> list[dict]:
    """
    Search approved report images using a natural-language description.

    CLIP converts the text into a 512-dimensional vector
    and searches approved image embeddings stored in Qdrant.
    """

    if not query_text or not query_text.strip():
        raise ValueError("Search description cannot be empty.")

    if target_report_type not in ("LOST", "FOUND"):
        raise ValueError("Target report type must be LOST or FOUND.")

    if limit < 1 or limit > 50:
        raise ValueError("Limit must be between 1 and 50.")

    query_vector = encode_text(query_text.strip())

    search_filter = Filter(
        must=[
            FieldCondition(
                key="vector_type",
                match=MatchValue(value="image"),
            ),
            FieldCondition(
                key="report_type",
                match=MatchValue(value=target_report_type),
            ),
            FieldCondition(
                key="report_status",
                match=MatchValue(value="ACTIVE"),
            ),
            FieldCondition(
                key="image_quality_status",
                match=MatchValue(value="ACCEPTED"),
            ),
        ],
        must_not=(
            [
                FieldCondition(
                    key="report_id",
                    match=MatchValue(value=exclude_report_id),
                )
            ]
            if exclude_report_id is not None
            else []
        ),
    )

    results = client.query_points(
        collection_name=CLIP_COLLECTION,
        query=query_vector,
        query_filter=search_filter,
        limit=limit,
        with_payload=True,
        with_vectors=False,
    ).points

    candidates = []

    for result in results:
        payload = result.payload or {}

        candidates.append({
            "report_id": payload.get("report_id"),
            "image_id": payload.get("image_id"),
            "report_type": payload.get("report_type"),
            "title": payload.get("title"),
            "category": payload.get("category"),
            "brand": payload.get("brand"),
            "color": payload.get("color"),
            "location": payload.get("location"),
            "image_quality_status": payload.get(
                "image_quality_status"
            ),
            "similarity_score": round(float(result.score), 4),
            "similarity_percentage": round(
                float(result.score) * 100, 2
            ),
        })

    return candidates

