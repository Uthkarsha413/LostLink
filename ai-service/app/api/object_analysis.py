
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.object_detector import detect_objects
from app.services.item_classifier import classify_detected_items


router = APIRouter(
    prefix="/analyze",
    tags=["Object Detection"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post("/objects")
async def analyze_objects(
    image: UploadFile = File(...)
):
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Only JPEG, PNG and WebP images are supported.",
        )

    try:
        image_bytes = await image.read(MAX_FILE_SIZE + 1)

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image exceeds the 5 MB limit.",
            )

        detection_result = detect_objects(image_bytes)

        classification_result = classify_detected_items(
            detection_result["detections"]
        )

        return {
            "success": True,
            "message": "Object detection and classification completed.",
            "filename": image.filename,
            "detection": detection_result,
            "classification": classification_result,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    finally:
        await image.close()
