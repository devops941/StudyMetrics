from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from app.core.mongodb import get_database
from app.core.config import settings

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return doc
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc["_id"])
        doc["_id"] = str(doc["_id"])
    return doc

class DatasetRepository:
    @staticmethod
    async def get_collection():
        db = await get_database()
        return db[settings.MONGODB_COLLECTION]

    async def create_dataset(self, data: Dict[str, Any]) -> str:
        coll = await self.get_collection()
        doc = {
            **data,
            "doc_type": "dataset",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await coll.insert_one(doc)
        return str(res.inserted_id)

    async def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        coll = await self.get_collection()
        try:
            doc = await coll.find_one({"_id": ObjectId(dataset_id), "doc_type": "dataset"})
            return serialize_doc(doc)
        except Exception:
            return None

    async def list_datasets(self, limit: int = 50) -> List[Dict[str, Any]]:
        coll = await self.get_collection()
        cursor = coll.find({"doc_type": "dataset"}).sort("created_at", -1).limit(limit)
        items = []
        async for doc in cursor:
            items.append(serialize_doc(doc))
        return items

    async def create_version(self, dataset_id: str, version_no: int, version_type: str, storage_key: str, schema_mapping: Dict[str, str]) -> str:
        coll = await self.get_collection()
        doc = {
            "doc_type": "dataset_version",
            "dataset_id": dataset_id,
            "version_no": version_no,
            "version_type": version_type,  # 'raw', 'mapped', 'cleaned'
            "storage_key": storage_key,
            "schema_mapping": schema_mapping,
            "created_at": datetime.now(timezone.utc)
        }
        res = await coll.insert_one(doc)
        return str(res.inserted_id)

    async def get_version(self, version_id: str) -> Optional[Dict[str, Any]]:
        coll = await self.get_collection()
        try:
            doc = await coll.find_one({"_id": ObjectId(version_id), "doc_type": "dataset_version"})
            return serialize_doc(doc)
        except Exception:
            return None

    async def get_latest_version(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        coll = await self.get_collection()
        doc = await coll.find_one({"doc_type": "dataset_version", "dataset_id": dataset_id}, sort=[("version_no", -1)])
        return serialize_doc(doc)

    async def list_versions(self, dataset_id: str) -> List[Dict[str, Any]]:
        coll = await self.get_collection()
        cursor = coll.find({"doc_type": "dataset_version", "dataset_id": dataset_id}).sort("version_no", -1)
        items = []
        async for doc in cursor:
            items.append(serialize_doc(doc))
        return items

    async def get_cleaning_logs(self, dataset_id: str) -> List[Dict[str, Any]]:
        coll = await self.get_collection()
        cursor = coll.find({"doc_type": "cleaning_log", "dataset_id": dataset_id}).sort("created_at", -1)
        items = []
        async for doc in cursor:
            items.append(serialize_doc(doc))
        return items

    async def add_cleaning_logs(self, dataset_id: str, version_id: str, logs: List[Dict[str, Any]]):
        coll = await self.get_collection()
        if not logs:
            return
        docs = [
            {
                "doc_type": "cleaning_log",
                "dataset_id": dataset_id,
                "version_id": version_id,
                "action": l["action"],
                "affected_rows": l["affected_rows"],
                "reason": l["reason"],
                "created_at": datetime.now(timezone.utc)
            }
            for l in logs
        ]
        await coll.insert_many(docs)
