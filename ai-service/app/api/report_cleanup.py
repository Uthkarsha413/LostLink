
import os
import secrets

from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.services.vector_store import delete_report_vectors


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_FILE)

router = APIRouter(
    prefix="/reports",
    tags=["Report Cleanup"],
)


class ReportCleanupRequest(BaseModel):
    report_id: int = Field(gt=0)


@router.post("/cleanup")
async def cleanup_report_vectors(
    request: ReportCleanupRequest,
    authorization: str | None = Header(default=None),
):
    expected_token = os.getenv("LOSTLINK_INTERNAL_TOKEN")

    if not expected_token:
        raise HTTPException(
            status_code=500,
            detail="Internal authentication is not configured.",
        )

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization token.",
        )

    scheme, separator, supplied_token = authorization.partition(" ")

    if (
        scheme.lower() != "bearer"
        or not separator
        or not secrets.compare_digest(
            supplied_token,
            expected_token,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization token.",
        )

    try:
        result = delete_report_vectors(request.report_id)

        return {
            "success": True,
            "message": "Report vectors cleaned up successfully.",
            "result": result,
        }

    except Exception as error:
        print(
            f"Report vector cleanup failed for report "
            f"{request.report_id}: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete report vectors.",
        )
