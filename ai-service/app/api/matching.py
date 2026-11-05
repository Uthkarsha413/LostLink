
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.matching_pipeline import run_matching_pipeline
from app.services.hybrid_matcher import calculate_hybrid_match
from app.services.report_indexer import index_active_reports


router = APIRouter(
    prefix="/matching",
    tags=["Hybrid Matching"],
)


class ItemDetails(BaseModel):
    description: str = Field(min_length=3, max_length=2000)
    category: str | None = None
    brand: str | None = None
    colour: str | None = None
    location: str | None = None
    event_datetime: str | None = None


class MatchRequest(BaseModel):
    lost_item: ItemDetails
    found_item: ItemDetails


# ==========================================
# POST: Compare LOST and FOUND item details
# ==========================================

@router.post("/compare")
def compare_lost_and_found_items(request: MatchRequest):
    try:
        result = calculate_hybrid_match(
            request.lost_item.model_dump(),
            request.found_item.model_dump(),
        )

        return {
            "success": True,
            "result": result,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        print(f"Comparison error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred during item matching.",
        )


# ==========================================
# GET: Find potential matches for a LOST report
# ==========================================

@router.get("/report/{lost_report_id}")
def match_lost_report(lost_report_id: int):
    try:
        if lost_report_id <= 0:
            raise HTTPException(
                status_code=400,
                detail="Invalid report ID.",
            )

        # 1. Refresh active report text vectors in Qdrant
        indexing_result = index_active_reports()

        # 2. Run the hybrid matching pipeline
        result = run_matching_pipeline(lost_report_id)

        # 3. Return indexing and matching results
        return {
            "success": True,
            "message": "Hybrid matching completed successfully.",
            "indexing": {
                "total_reports": indexing_result["total_reports"],
                "indexed_count": indexing_result["indexed_count"],
                "skipped_count": indexing_result["skipped_count"],
                "skipped": indexing_result["skipped"],
            },
            "result": result,
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    except Exception as error:
        print(f"Matching error: {error}")

        raise HTTPException(
            status_code=500,
            detail="An error occurred during matching.",
        )
