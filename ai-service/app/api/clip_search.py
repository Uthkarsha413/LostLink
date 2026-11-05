
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.clip_text_search import search_images_by_text
from app.services.clip_search import search_similar_report_images
from app.services.clip_indexer import index_report_images

router = APIRouter(prefix="/clip", tags=["CLIP Search"])


class TextSearchRequest(BaseModel):
    query_text: str = Field(min_length=2, max_length=500)
    target_report_type: str = Field(default="FOUND")
    limit: int = Field(default=5, ge=1, le=50)
    exclude_report_id: int | None = None


class ImageSearchRequest(BaseModel):
    image_path: str
    target_report_type: str = "FOUND"
    limit: int = Field(default=5, ge=1, le=50)
    exclude_report_id: int | None = None


@router.post("/text")
def clip_text_search(request: TextSearchRequest):
    try:
        results = search_images_by_text(
            query_text=request.query_text,
            target_report_type=request.target_report_type,
            limit=request.limit,
            exclude_report_id=request.exclude_report_id,
        )

        return {
            "success": True,
            "search_type": "text_to_image",
            "query": request.query_text,
            "total_candidates": len(results),
            "results": results,
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail="CLIP text search failed.")


@router.post("/image")
def clip_image_search(request: ImageSearchRequest):
    try:
        results = search_similar_report_images(
            image_path=request.image_path,
            target_report_type=request.target_report_type,
            limit=request.limit,
            exclude_report_id=request.exclude_report_id,
        )

        return {
            "success": True,
            "search_type": "image_to_image",
            "total_candidates": len(results),
            "results": results,
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail="CLIP image search failed.")

@router.post("/index/report/{report_id}")
def index_single_report(report_id: int):
    if report_id < 1:
        raise HTTPException(
            status_code=400,
            detail="Invalid report ID.",
        )

    try:
        result = index_report_images(report_id)

        if not result.get("indexed"):
            raise HTTPException(
                status_code=404,
                detail=result.get("error") or result.get("message"),
            )

        return {
            "success": True,
            "message": "Report image indexed successfully.",
            "result": result,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="CLIP indexing failed.",
        )