import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.mongodb import ping_database, close_database, init_indexes
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studymetrics")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing StudyMetrics API...")
    is_connected = await ping_database()
    if is_connected:
        logger.info("Connected to MongoDB successfully.")
        await init_indexes()
    else:
        logger.warning("MongoDB ping failed on startup. Verify MongoDB connection settings.")
    yield
    logger.info("Shutting down StudyMetrics API...")
    await close_database()

app = FastAPI(
    title="StudyMetrics Research API",
    description="Educational analytics API exploring study-time, attendance and assessment relationships.",
    version="2.1.0",
    lifespan=lifespan
)

# CORS configuration allowing all localhost/127.0.0.1 ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "project": "StudyMetrics",
        "description": "Student Study-Time and Assessment Relationship Study",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
