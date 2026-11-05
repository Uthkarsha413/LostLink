
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from qdrant_client.models import PointStruct

from app.services.clip_embedder import encode_image
from app.services.qdrant_client import client, CLIP_COLLECTION
from app.services.report_repository import get_active_reports_with_images


# Load environment variables from ai-service/.env
AI_SERVICE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=AI_SERVICE_DIR / ".env")

IMAGE_STORAGE_DIR = Path(
    os.getenv(
        "IMAGE_STORAGE_DIR",
        "../frontend/private_uploads/reports",
    )
)

if not IMAGE_STORAGE_DIR.is_absolute():
    IMAGE_STORAGE_DIR = (AI_SERVICE_DIR / IMAGE_STORAGE_DIR).resolve()


def index_active_report_images() -> dict:
    """
    Generate CLIP image embeddings for active LostLink reports
    and store them in the Qdrant CLIP collection.

    PENDING images are included for development testing only.
    Their moderation status is preserved in the Qdrant payload.
    """

    reports = get_active_reports_with_images()

    indexed_count = 0
    skipped_count = 0
    errors = []

    points = []

    for report in reports:
        image_path = IMAGE_STORAGE_DIR / report["storage_key"]

        if not image_path.is_file():
            skipped_count += 1
            errors.append({
                "report_id": report["report_id"],
                "error": "Image file not found",
            })
            continue

        try:
            embedding = encode_image(image_path)

            # Stable ID prevents duplicate points on repeated indexing.
            point_id = str(
                uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"lostlink:report:{report['report_id']}:image:{report['image_id']}",
                )
            )

            payload = {
                "report_id": report["report_id"],
                "image_id": report["image_id"],
                "report_type": report["report_type"],
                "title": report["title"],
                "description": report["description"],
                "brand": report["brand"],
                "color": report["color"],
                "category": report["category_name"],
                "location": report["location_name"],
                "report_status": report["report_status"],
                "image_quality_status": report["image_quality_status"],
                "mime_type": report["mime_type"],
                "vector_type": "image",
                "model": "clip-ViT-B-32",
                "embedding_dimensions": 512,
            }

            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload,
                )
            )

        except Exception as error:
            skipped_count += 1
            errors.append({
                "report_id": report["report_id"],
                "error": str(error),
            })

    if points:
        client.upsert(
            collection_name=CLIP_COLLECTION,
            points=points,
            wait=True,
        )
        indexed_count = len(points)

    return {
        "total_reports": len(reports),
        "indexed_count": indexed_count,
        "skipped_count": skipped_count,
        "collection": CLIP_COLLECTION,
        "image_storage_directory": str(IMAGE_STORAGE_DIR),
        "errors": errors,
    }

def index_report_images(report_id: int) -> dict:
    """
    Generate CLIP embeddings for every image belonging
    to one active report and store them in Qdrant.
    """

    from app.services.report_repository import get_active_report_images

    reports = get_active_report_images(report_id)

    if not reports:
        return {
            "report_id": report_id,
            "indexed": False,
            "message": "No active report images were found.",
        }

    points = []
    errors = []

    for report in reports:
        image_path = IMAGE_STORAGE_DIR / report["storage_key"]

        if not image_path.is_file():
            errors.append({
                "image_id": report["image_id"],
                "error": "Image file not found.",
            })
            continue

        try:
            embedding = encode_image(image_path)

            point_id = str(
                uuid.uuid5(
                    uuid.NAMESPACE_URL,
                    f"lostlink:report:{report['report_id']}:image:{report['image_id']}",
                )
            )

            payload = {
                "report_id": report["report_id"],
                "image_id": report["image_id"],
                "report_type": report["report_type"],
                "title": report["title"],
                "description": report["description"],
                "brand": report["brand"],
                "color": report["color"],
                "category": report["category_name"],
                "location": report["location_name"],
                "report_status": report["report_status"],
                "image_quality_status": report["image_quality_status"],
                "mime_type": report["mime_type"],
                "is_primary": bool(report["is_primary"]),
                "vector_type": "image",
                "model": "clip-ViT-B-32",
                "embedding_dimensions": 512,
            }

            points.append(
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload,
                )
            )

        except Exception as error:
            errors.append({
                "image_id": report["image_id"],
                "error": str(error),
            })

    if points:
        client.upsert(
            collection_name=CLIP_COLLECTION,
            points=points,
            wait=True,
        )

    return {
        "report_id": report_id,
        "total_images": len(reports),
        "indexed_count": len(points),
        "skipped_count": len(errors),
        "indexed": len(points) > 0,
        "collection": CLIP_COLLECTION,
        "errors": errors,
    }


    from app.services.report_repository import get_active_report_with_image

    report = get_active_report_with_image(report_id)

    if not report:
        return {
            "report_id": report_id,
            "indexed": False,
            "message": "No active report with a primary image was found.",
        }

    image_path = IMAGE_STORAGE_DIR / report["storage_key"]

    if not image_path.is_file():
        return {
            "report_id": report_id,
            "indexed": False,
            "error": "Image file not found.",
        }

    try:
        embedding = encode_image(image_path)

        point_id = str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"lostlink:report:{report['report_id']}:image:{report['image_id']}",
            )
        )

        payload = {
            "report_id": report["report_id"],
            "image_id": report["image_id"],
            "report_type": report["report_type"],
            "title": report["title"],
            "description": report["description"],
            "brand": report["brand"],
            "color": report["color"],
            "category": report["category_name"],
            "location": report["location_name"],
            "report_status": report["report_status"],
            "image_quality_status": report["image_quality_status"],
            "mime_type": report["mime_type"],
            "vector_type": "image",
            "model": "clip-ViT-B-32",
            "embedding_dimensions": 512,
        }

        client.upsert(
            collection_name=CLIP_COLLECTION,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload,
                )
            ],
            wait=True,
        )

        return {
            "report_id": report_id,
            "image_id": report["image_id"],
            "indexed": True,
            "collection": CLIP_COLLECTION,
        }

    except Exception as error:
        return {
            "report_id": report_id,
            "indexed": False,
            "error": str(error),
        }