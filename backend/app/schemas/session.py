from datetime import datetime
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field

class SessionSettings(BaseModel):
    score_max: float = 100.0
    significance_level: float = 0.05
    attendance_threshold: float = 75.0

class SessionCreate(BaseModel):
    title: str = "Research Analysis Session"
    dataset_id: Optional[str] = None
    settings: Optional[SessionSettings] = None

class SessionResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    dataset_id: Optional[str] = None
    active_version_id: Optional[str] = None
    status: str
    settings: SessionSettings
    created_at: datetime
    updated_at: datetime
