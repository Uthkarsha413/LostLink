
from app.services.report_repository import get_active_reports
from app.services.vector_store import store_text_vector


PLACEHOLDER_VALUES = {
    "abc",
    "test",
    "testing",
    "ttt",
    "xyz",
    "na",
    "n/a",
    "none",
}


def is_valid_report(report: dict) -> bool:
    description = (report.get("description") or "").strip()

    if len(description) < 10:
        return False

    if description.lower() in PLACEHOLDER_VALUES:
        return False

    return True


def index_active_reports(report_type: str | None = None) -> dict:
    reports = get_active_reports(report_type)

    indexed = []
    skipped = []

    for report in reports:

        if not is_valid_report(report):
            skipped.append({
                "report_id": report["report_id"],
                "reason": "Description is incomplete or a placeholder.",
            })
            continue

        description_parts = [
            report.get("title"),
            report.get("description"),
            report.get("brand"),
            report.get("color"),
            report.get("category_name"),
            report.get("location_name"),
        ]

        combined_description = " ".join(
            str(part).strip()
            for part in description_parts
            if part and str(part).strip()
        )

        result = store_text_vector(
            report_id=report["report_id"],
            report_type=report["report_type"],
            description=combined_description,
            category=report.get("category_name"),
            location=report.get("location_name"),
        )

        indexed.append(result)

    return {
        "total_reports": len(reports),
        "indexed_count": len(indexed),
        "skipped_count": len(skipped),
        "indexed": indexed,
        "skipped": skipped,
    }

