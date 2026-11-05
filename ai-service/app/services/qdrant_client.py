
from qdrant_client import QdrantClient, models

# QDRANT CONFIGURATION

QDRANT_URL = "http://localhost:6333"

# Existing MiniLM collections
TEXT_COLLECTION = "report_text_vectors"
IMAGE_COLLECTION = "report_image_vectors"

TEXT_VECTOR_SIZE = 384
IMAGE_VECTOR_SIZE = 384

# New shared CLIP collection
CLIP_COLLECTION = "report_clip_vectors"
CLIP_VECTOR_SIZE = 512

DISTANCE_METRIC = models.Distance.COSINE


# QDRANT CLIENT

client = QdrantClient(
    url=QDRANT_URL,
    timeout=10,
)


# CONNECTION CHECK

def check_qdrant_connection() -> dict:
    try:
        collections = client.get_collections()

        return {
            "connected": True,
            "qdrant_url": QDRANT_URL,
            "collections": [
                collection.name
                for collection in collections.collections
            ],
        }

    except Exception as error:
        return {
            "connected": False,
            "qdrant_url": QDRANT_URL,
            "error": str(error),
        }


# CREATE COLLECTION

def create_collection(
    collection_name: str,
    vector_size: int,
) -> str:

    if not collection_name:
        raise ValueError("Collection name cannot be empty.")

    if vector_size <= 0:
        raise ValueError("Vector size must be positive.")

    if client.collection_exists(collection_name):
        return f"{collection_name} already exists."

    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=vector_size,
            distance=DISTANCE_METRIC,
        ),
    )

    return f"{collection_name} created successfully."


# CREATE ALL COLLECTIONS

def create_lostlink_collections() -> dict:
    return {
        "text_collection": create_collection(
            TEXT_COLLECTION,
            TEXT_VECTOR_SIZE,
        ),
        "image_collection": create_collection(
            IMAGE_COLLECTION,
            IMAGE_VECTOR_SIZE,
        ),
        "clip_collection": create_collection(
            CLIP_COLLECTION,
            CLIP_VECTOR_SIZE,
        ),
    }


# GET COLLECTION INFORMATION

def get_collection_information() -> dict:

    information = {}

    collection_names = [
        TEXT_COLLECTION,
        IMAGE_COLLECTION,
        CLIP_COLLECTION,
    ]

    for collection_name in collection_names:

        try:
            details = client.get_collection(
                collection_name=collection_name
            )

            information[collection_name] = {
                "exists": True,
                "points_count": details.points_count,
                "status": str(details.status),
                "configuration": str(
                    details.config.params.vectors
                ),
            }

        except Exception as error:
            information[collection_name] = {
                "exists": False,
                "error": str(error),
            }

    return information
