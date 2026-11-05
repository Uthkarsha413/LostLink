
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.image_processor import analyze_image
from app.services.object_detector import detect_objects
from app.services.item_classifier import classify_detected_items


router = APIRouter(
    prefix="/analyze",
    tags=["Complete AI Analysis"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post("/complete")
async def complete_image_analysis(
    image: UploadFile = File(...),
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
                detail="Image is empty.",
            )

        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="Image exceeds the 5 MB limit.",
            )

        # Step 1: Analyse image quality and visual attributes
        image_result = analyze_image(image_bytes)

        # Step 2: Detect objects using YOLO11n
        detection_result = detect_objects(image_bytes)

        # Step 3: Classify detected objects
        classification_result = classify_detected_items(
            detection_result["detections"]
        )

        return {
            "success": True,
            "message": "Complete AI image analysis successful.",
            "filename": image.filename,
            "image_analysis": image_result,
            "object_detection": detection_result,
            "item_classification": classification_result,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    finally:
        await image.close()

