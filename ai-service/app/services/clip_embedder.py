
from functools import lru_cache
from pathlib import Path
from typing import Union

import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/clip-ViT-B-32"
EMBEDDING_DIMENSION = 512


@lru_cache(maxsize=1)
def get_clip_model():
    """Load CLIP once and reuse it."""
    import torch

    device = "mps" if torch.backends.mps.is_available() else "cpu"

    return SentenceTransformer(
        MODEL_NAME,
        device=device
    )


def encode_text(text: str) -> list[float]:
    """Generate a normalized CLIP embedding for text."""
    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")

    model = get_clip_model()

    vector = model.encode(
        text.strip(),
        normalize_embeddings=True,
        convert_to_numpy=True
    )

    if vector.shape != (EMBEDDING_DIMENSION,):
        raise ValueError(
            f"Unexpected text embedding dimensions: {vector.shape}"
        )

    return vector.astype(np.float32).tolist()


def encode_image(
    image: Union[str, Path, Image.Image]
) -> list[float]:
    """Generate a normalized CLIP embedding for an image."""
    model = get_clip_model()

    if isinstance(image, (str, Path)):
        with Image.open(image) as opened_image:
            processed_image = opened_image.convert("RGB")
    elif isinstance(image, Image.Image):
        processed_image = image.convert("RGB")
    else:
        raise TypeError("Image must be a file path or PIL Image.")

    vector = model.encode(
        processed_image,
        normalize_embeddings=True,
        convert_to_numpy=True
    )

    if vector.shape != (EMBEDDING_DIMENSION,):
        raise ValueError(
            f"Unexpected image embedding dimensions: {vector.shape}"
        )

    return vector.astype(np.float32).tolist()


def cosine_similarity(
    first_vector: list[float],
    second_vector: list[float]
) -> float:
    """Compare normalized CLIP vectors."""
    if len(first_vector) != EMBEDDING_DIMENSION:
        raise ValueError("First vector must have 512 dimensions.")

    if len(second_vector) != EMBEDDING_DIMENSION:
        raise ValueError("Second vector must have 512 dimensions.")

    first = np.asarray(first_vector, dtype=np.float32)
    second = np.asarray(second_vector, dtype=np.float32)

    return float(np.dot(first, second))
