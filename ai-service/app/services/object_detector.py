
from pathlib import Path
from io import BytesIO

import torch
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO


MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "yolo11n.pt"

MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

# Load pretrained YOLO model
model = YOLO("yolo11n.pt")

# Use Apple GPU when available
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"


def detect_objects(image_bytes: bytes) -> dict:
    """
    Detect common objects in an uploaded image.
    """

    if not image_bytes:
        raise ValueError("Image is empty.")

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("Invalid image.") from error

    results = model.predict(
        source=image,
        device=DEVICE,
        conf=0.25,
        verbose=False,
    )

    detections = []

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())

            coordinates = box.xyxy[0].tolist()

            detections.append({
                "object": model.names[class_id],
                "confidence": round(confidence, 4),
                "bounding_box": {
                    "x1": round(coordinates[0], 2),
                    "y1": round(coordinates[1], 2),
                    "x2": round(coordinates[2], 2),
                    "y2": round(coordinates[3], 2),
                },
            })

    return {
        "model": "YOLO11n",
        "device": DEVICE,
        "objects_detected": len(detections),
        "detections": detections,
    }

