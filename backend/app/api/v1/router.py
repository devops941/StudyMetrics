from fastapi import APIRouter
from app.api.v1.datasets import router as datasets_router
from app.api.v1.analysis import router as analysis_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.reports import router as reports_router
from app.core.mongodb import ping_database

api_router = APIRouter()

@api_router.get("/health", tags=["Health"])
async def health_check():
    """Checks the health of FastAPI and MongoDB connection."""
    db_connected = await ping_database()
    return {
        "status": "online",
        "service": "StudyMetrics Research API",
        "mongodb_connected": db_connected
    }

api_router.include_router(datasets_router)
api_router.include_router(analysis_router)
api_router.include_router(sessions_router)
api_router.include_router(reports_router)
