
from sentence_transformers import SentenceTransformer
import torch


MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

print(f"Loading text embedding model on: {DEVICE}")

model = SentenceTransformer(
    MODEL_NAME,
    device=DEVICE,
)


def generate_embedding(text: str) -> list[float]:
    """Generate a normalized semantic embedding for item text."""

    if not isinstance(text, str) or not text.strip():
        raise ValueError("Text cannot be empty.")

    embedding = model.encode(
        text.strip(),
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    return embedding.tolist()


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple item descriptions."""

    if not texts:
        return []

    if any(not isinstance(text, str) or not text.strip() for text in texts):
        raise ValueError("All texts must be non-empty strings.")

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=32,
    )

    return embeddings.tolist()
