
CATEGORY_MAPPING = {
    "Electronics": [
        "cell phone",
        "laptop",
        "remote",
        "mouse",
        "keyboard",
    ],
    "Bags": [
        "backpack",
        "handbag",
        "suitcase",
    ],
    "Accessories": [
        "umbrella",
        "watch",
        "sunglasses",
        "tie",
    ],
    "Clothing": [
        "coat",
        "jacket",
        "shirt",
        "shoe",
        "hat",
    ],
    "Documents": [
        "book",
        "paper",
    ],
    "Sports Equipment": [
        "sports ball",
        "baseball bat",
        "tennis racket",
        "skateboard",
    ],
    "Other": [
        "bottle",
        "cup",
        "scissors",
        "toothbrush",
        "vase",
    ],
}


def classify_detected_items(detections: list) -> dict:
    """
    Map YOLO detections to LostLink categories.
    """

    classified_items = []

    for detection in detections:
        object_name = detection["object"]

        matched_category = "Unclassified"

        for category, objects in CATEGORY_MAPPING.items():
            if object_name in objects:
                matched_category = category
                break

        classified_items.append({
            "object": object_name,
            "category": matched_category,
            "confidence": detection["confidence"],
            "bounding_box": detection["bounding_box"],
        })

    return {
        "items_found": len(classified_items),
        "items": classified_items,
    }
