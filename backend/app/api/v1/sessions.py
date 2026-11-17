from fastapi import APIRouter, HTTPException, status
from app.repositories.session_repository import SessionRepository
from app.schemas.session import SessionCreate, SessionResponse, SessionSettings

router = APIRouter(prefix="/sessions", tags=["Sessions"])
repo = SessionRepository()

@router.post("", response_model=SessionResponse)
async def create_session(payload: SessionCreate):
    """Creates a new research session workspace."""
    settings_dict = payload.settings.model_dump() if payload.settings else SessionSettings().model_dump()
    doc = {
        "title": payload.title,
        "dataset_id": payload.dataset_id,
        "active_version_id": None,
        "owner_id": "default_researcher",
        "status": "active",
        "settings": settings_dict
    }
    session_id = await repo.create_session(doc)
    created = await repo.get_session(session_id)
    return created

@router.get("/{id}", response_model=SessionResponse)
async def get_session(id: str):
    """Retrieves an existing research session."""
    session = await repo.get_session(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return session

@router.get("/{id}/results")
async def get_session_results(id: str):
    """Retrieves all analytical results saved under this session."""
    results = await repo.get_results_for_session(id)
    return {"session_id": id, "results": results}

@router.post("/{id}/results")
async def save_session_result(id: str, payload: dict):
    """Saves a structured statistical calculation result to the session."""
    session = await repo.get_session(id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    res_id = await repo.save_result(
        session_id=id,
        analysis_type=payload.get("analysis_type", "general"),
        parameters=payload.get("parameters", {}),
        result=payload.get("result", {})
    )
    return {"result_id": res_id, "status": "saved"}
