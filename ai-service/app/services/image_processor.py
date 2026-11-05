
from collections import Counter
from io import BytesIO

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError


ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def get_colour_name(rgb):
    """Estimate a human-readable colour name."""

    r, g, b = rgb

    if max(r, g, b) < 45:
        return "Black"

    if min(r, g, b) > 215:
        return "White"

    if max(r, g, b) - min(r, g, b) < 25:
        if sum(rgb) / 3 < 130:
            return "Dark Grey"
        return "Grey"

    if r > 160 and g > 100 and b < 100:
        return "Orange"

    if r > 150 and g < 100 and b < 100:
        return "Red"

    if r > 150 and g > 120 and b > 80:
        return "Yellow"

    if g > r * 1.2 and g > b * 1.1:
        return "Green"

    if b > r * 1.2 and b > g * 1.1:
        return "Blue"

    if r > 110 and b > 110 and g < 110:
        return "Purple"

    if r > 130 and g > 80 and b > 80:
        return "Brown"

    return "Mixed"


def extract_dominant_colours(rgb_array):
    """Extract the three most common quantised colours."""

    pixels = rgb_array.reshape(-1, 3)

    sample_size = min(15000, len(pixels))
    rng = np.random.default_rng(42)

    indices = rng.choice(
        len(pixels),
        size=sample_size,
        replace=False,
    )

    sampled_pixels = pixels[indices]
    quantized = (sampled_pixels // 32) * 32

    colour_counts = Counter(
        map(tuple, quantized.tolist())
    )

    colours = []

    for colour, count in colour_counts.most_common(3):
        rgb = [int(value) for value in colour]

        colours.append({
            "name": get_colour_name(rgb),
            "hex": "#{:02X}{:02X}{:02X}".format(*rgb),
            "rgb": rgb,
            "percentage": round(
                count / sample_size * 100, 2
            ),
        })

    return colours


def analyze_image(image_bytes: bytes) -> dict:
    """Validate and extract visual attributes from an image."""

    if not image_bytes:
        raise ValueError("Image is empty.")

    if len(image_bytes) > MAX_FILE_SIZE:
        raise ValueError("Image exceeds the 5 MB limit.")

    try:
        image = Image.open(BytesIO(image_bytes))
        image.verify()

        image = Image.open(BytesIO(image_bytes))
        image_format = image.format

        if image_format not in ALLOWED_FORMATS:
            raise ValueError("Unsupported image format.")

        image = image.convert("RGB")

    except (UnidentifiedImageError, OSError):
        raise ValueError("Invalid or corrupted image.")

    width, height = image.size

    if width < 64 or height < 64:
        raise ValueError("Image resolution is too small.")

    if width * height > 40_000_000:
        raise ValueError("Image dimensions are too large.")

    rgb_array = np.array(image)
    bgr_array = cv2.cvtColor(
        rgb_array,
        cv2.COLOR_RGB2BGR,
    )

    gray = cv2.cvtColor(
        bgr_array,
        cv2.COLOR_BGR2GRAY,
    )

    brightness = float(np.mean(gray))

    sharpness = float(
        cv2.Laplacian(gray, cv2.CV_64F).var()
    )

    dominant_colours = extract_dominant_colours(
        rgb_array
    )

    aspect_ratio = round(width / height, 3)

    if aspect_ratio > 1.05:
        orientation = "LANDSCAPE"
    elif aspect_ratio < 0.95:
        orientation = "PORTRAIT"
    else:
        orientation = "SQUARE"

    warnings = []

    if brightness < 45:
        warnings.append("Image may be too dark.")
    elif brightness > 220:
        warnings.append("Image may be overexposed.")

    if sharpness < 30:
        warnings.append("Image may be blurry.")

    quality_status = (
        "NEEDS_REVIEW" if warnings else "ACCEPTABLE"
    )

    return {
        "valid": True,
        "image_format": image_format,
        "width": width,
        "height": height,
        "file_size_bytes": len(image_bytes),
        "aspect_ratio": aspect_ratio,
        "orientation": orientation,
        "dominant_colour": (
            dominant_colours[0]
            if dominant_colours else None
        ),
        "colour_palette": dominant_colours,
        "brightness": round(brightness, 2),
        "sharpness": round(sharpness, 2),
        "quality_status": quality_status,
        "warnings": warnings,
    }
