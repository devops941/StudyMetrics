import logging
from typing import Optional
from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logger = logging.getLogger("studymetrics.mongodb")

_client: Optional[AsyncMongoClient] = None

def get_client() -> AsyncMongoClient:
    global _client
    if _client is None:
        _client = AsyncMongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=4000
        )
    return _client

async def get_database():
    client = get_client()
    return client[settings.MONGODB_DATABASE]

async def ping_database() -> bool:
    try:
        client = get_client()
        await client.admin.command("ping")
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"MongoDB ping failed: {e}")
        return False

async def close_database():
    global _client
    if _client is not None:
        await _client.close()
        _client = None
        logger.info("MongoDB client connection closed.")

async def init_indexes():
    """Initializes recommended indexes on the StudyMetrics collection."""
    try:
        db = await get_database()
        coll = db[settings.MONGODB_COLLECTION]
        await coll.create_index([("doc_type", 1), ("created_at", -1)])
        await coll.create_index([("doc_type", 1), ("dataset_id", 1), ("version_no", 1)])
        await coll.create_index([("doc_type", 1), ("session_id", 1)])
        logger.info(f"MongoDB indexes verified on collection '{settings.MONGODB_COLLECTION}'.")
    except Exception as e:
        logger.warning(f"Skipping index creation on MongoDB: {e}")
