
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.image_processor import analyze_image

router = APIRouter(
    prefix="/analyze",
    tags=["Image Analysis"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


@router.post("/image")
async def analyze_uploaded_image(
    image: UploadFile = File(...)
):
    """
    Analyse an uploaded image using the LostLink
    computer vision preprocessing module.
    """

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

        result = analyze_image(image_bytes)

        return {
            "success": True,
            "message": "Image analysed successfully.",
            "filename": image.filename,
            "analysis": result,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    finally:
        await image.close()
