
from uuid import uuid5, NAMESPACE_DNS

from qdrant_client import models

from app.services.qdrant_client import (
    client,
    TEXT_COLLECTION,
    CLIP_COLLECTION,
)

from app.services.text_embedder import generate_embedding


def store_text_vector(
    report_id: int,
    report_type: str,
    description: str,
    category: str | None = None,
    location: str | None = None,
) -> dict:

    if report_type not in ("LOST", "FOUND"):
        raise ValueError("Report type must be LOST or FOUND.")

    if report_id <= 0:
        raise ValueError("Report ID must be positive.")

    embedding = generate_embedding(description)

    client.upsert(
        collection_name=TEXT_COLLECTION,
        points=[
            models.PointStruct(
                id=str(
                    uuid5(
                        NAMESPACE_DNS,
                        f"lostlink:{report_type}:{report_id}",
                    )
                ),
                vector=embedding,
                payload={
                    "report_id": report_id,
                    "report_type": report_type,
                    "description": description,
                    "category": category,
                    "location": location,
                },
            )
        ],
        wait=True,
    )

    return {
        "success": True,
        "report_id": report_id,
        "collection": TEXT_COLLECTION,
        "vector_dimensions": len(embedding),
    }


def search_similar_text(
    description: str,
    report_type: str | None = None,
    limit: int = 5,
) -> list[dict]:

    if report_type not in (None, "LOST", "FOUND"):
        raise ValueError("Invalid report type.")

    if not 1 <= limit <= 20:
        raise ValueError("Limit must be between 1 and 20.")

    embedding = generate_embedding(description)

    query_filter = None

    if report_type:
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="report_type",
                    match=models.MatchValue(value=report_type),
                )
            ]
        )

    results = client.query_points(
        collection_name=TEXT_COLLECTION,
        query=embedding,
        query_filter=query_filter,
        limit=limit,
        with_payload=True,
    )

    return [
        {
            "score": round(point.score, 4),
            "payload": point.payload,
        }
        for point in results.points
    ]


def delete_report_vectors(report_id: int) -> dict:
    """
    Delete all text and CLIP image vectors belonging to a report.

    Deletes only points whose payload contains the specified report_id.
    """

    if (
        not isinstance(report_id, int)
        or isinstance(report_id, bool)
        or report_id <= 0
    ):
        raise ValueError("Report ID must be a positive integer.")

    deleted_collections = []

    for collection_name in (
        TEXT_COLLECTION,
        CLIP_COLLECTION,
    ):

        client.delete(
            collection_name=collection_name,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="report_id",
                            match=models.MatchValue(value=report_id),
                        )
                    ]
                )
            ),
            wait=True,
        )

        deleted_collections.append(collection_name)

    return {
        "success": True,
        "report_id": report_id,
        "deleted_collections": deleted_collections,
        "message": "Report vectors deleted successfully.",
    }
