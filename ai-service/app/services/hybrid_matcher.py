
from datetime import datetime

from app.services.similarity_engine import compare_item_descriptions


WEIGHTS = {
    "semantic": 0.45,
    "category": 0.15,
    "brand": 0.10,
    "colour": 0.10,
    "location": 0.10,
    "time": 0.10,
}


def compare_text(value_a, value_b):
    """Compare two text values using case-insensitive exact matching."""
    if not value_a or not value_b:
        return None

    return (
        1.0
        if value_a.strip().lower() == value_b.strip().lower()
        else 0.0
    )


def compare_time(date_a, date_b):
    """Calculate a time-proximity score between two item reports."""
    if not date_a or not date_b:
        return None

    if isinstance(date_a, str):
        date_a = datetime.fromisoformat(date_a)

    if isinstance(date_b, str):
        date_b = datetime.fromisoformat(date_b)

    difference_hours = abs(
        (date_a - date_b).total_seconds()
    ) / 3600

    if difference_hours <= 24:
        return 1.0
    if difference_hours <= 72:
        return 0.75
    if difference_hours <= 168:
        return 0.50
    if difference_hours <= 720:
        return 0.25

    return 0.0


def get_match_recommendation(score: float) -> str:
    """Convert the final similarity score into a recommendation level."""
    if score >= 0.85:
        return "STRONG_CANDIDATE"
    elif score >= 0.70:
        return "POSSIBLE_CANDIDATE"
    elif score >= 0.50:
        return "WEAK_CANDIDATE"
    else:
        return "LOW_SIMILARITY"


def calculate_hybrid_match(
    lost_item: dict,
    found_item: dict
) -> dict:
    """Calculate a weighted similarity score between LOST and FOUND items."""

    semantic_result = compare_item_descriptions(
        lost_item["description"],
        found_item["description"],
    )

    scores = {
        "semantic": semantic_result["similarity_score"],

        "category": compare_text(
            lost_item.get("category"),
            found_item.get("category"),
        ),

        "brand": compare_text(
            lost_item.get("brand"),
            found_item.get("brand"),
        ),

        "colour": compare_text(
            lost_item.get("colour"),
            found_item.get("colour"),
        ),

        "location": compare_text(
            lost_item.get("location"),
            found_item.get("location"),
        ),

        "time": compare_time(
            lost_item.get("event_datetime"),
            found_item.get("event_datetime"),
        ),
    }

    # Exclude unavailable signals and redistribute their weights.
    available_weight = sum(
        WEIGHTS[key]
        for key, score in scores.items()
        if score is not None
    )

    if available_weight == 0:
        raise ValueError(
            "No matching information is available."
        )

    weighted_score = sum(
        WEIGHTS[key] * score
        for key, score in scores.items()
        if score is not None
    )

    final_score = weighted_score / available_weight

    return {
        "matching_model": "LostLink Hybrid Matching v1",
        "final_score": round(final_score, 4),
        "match_percentage": round(final_score * 100, 2),
        "recommendation": get_match_recommendation(final_score),
        "component_scores": scores,
        "available_signals": sum(
            score is not None
            for score in scores.values()
        ),
        "note": (
            "AI similarity is a recommendation, "
            "not proof of ownership."
        ),
    }
