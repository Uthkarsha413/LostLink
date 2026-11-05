
import numpy as np

from app.services.text_embedder import generate_embedding


def calculate_cosine_similarity(
    embedding_a: list[float],
    embedding_b: list[float],
) -> float:
    """Calculate cosine similarity between two embeddings."""

    vector_a = np.asarray(embedding_a, dtype=np.float32)
    vector_b = np.asarray(embedding_b, dtype=np.float32)

    if vector_a.shape != vector_b.shape:
        raise ValueError("Embedding dimensions must match.")

    if vector_a.ndim != 1 or vector_a.size == 0:
        raise ValueError("Embeddings must be non-empty one-dimensional vectors.")

    if not np.isfinite(vector_a).all() or not np.isfinite(vector_b).all():
        raise ValueError("Embeddings must contain finite values.")

    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)

    if norm_a == 0 or norm_b == 0:
        raise ValueError("Cannot compare zero-length embeddings.")

    similarity = np.dot(vector_a, vector_b) / (norm_a * norm_b)

    return round(float(np.clip(similarity, -1.0, 1.0)), 4)


def compare_item_descriptions(
    lost_description: str,
    found_description: str,
) -> dict:
    """Compare LOST and FOUND descriptions semantically."""

    lost_embedding = generate_embedding(lost_description)
    found_embedding = generate_embedding(found_description)

    similarity = calculate_cosine_similarity(
        lost_embedding,
        found_embedding,
    )

    return {
        "model": "all-MiniLM-L6-v2",
        "embedding_dimensions": len(lost_embedding),
        "similarity_score": similarity,
        "similarity_percentage": round(similarity * 100, 2),
    }
