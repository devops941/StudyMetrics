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

class SessionRepository:
    @staticmethod
    async def get_collection():
        db = await get_database()
        return db[settings.MONGODB_COLLECTION]

    async def create_session(self, data: Dict[str, Any]) -> str:
        coll = await self.get_collection()
        doc = {
            **data,
            "doc_type": "analysis_session",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await coll.insert_one(doc)
        return str(res.inserted_id)

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        coll = await self.get_collection()
        try:
            doc = await coll.find_one({"_id": ObjectId(session_id), "doc_type": "analysis_session"})
            return serialize_doc(doc)
        except Exception:
            return None

    async def update_session(self, session_id: str, updates: Dict[str, Any]):
        coll = await self.get_collection()
        updates["updated_at"] = datetime.now(timezone.utc)
        await coll.update_one({"_id": ObjectId(session_id), "doc_type": "analysis_session"}, {"$set": updates})

    async def save_result(self, session_id: str, analysis_type: str, parameters: Dict[str, Any], result: Dict[str, Any]) -> str:
        coll = await self.get_collection()
        doc = {
            "doc_type": "analysis_result",
            "session_id": session_id,
            "analysis_type": analysis_type,
            "parameters": parameters,
            "result": result,
            "created_at": datetime.now(timezone.utc)
        }
        res = await coll.insert_one(doc)
        return str(res.inserted_id)

    async def get_results_for_session(self, session_id: str) -> List[Dict[str, Any]]:
        coll = await self.get_collection()
        cursor = coll.find({"doc_type": "analysis_result", "session_id": session_id}).sort("created_at", -1)
        items = []
        async for doc in cursor:
            items.append(serialize_doc(doc))
        return items
