from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class CanonicalRecord(BaseModel):
    record_id: str = Field(..., description="Unique pseudonymous ID; no real register number")
    study_hours_daily: float = Field(..., ge=0.0, le=24.0, description="Average study hours per day")
    attendance_pct: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage")
    exam_score: float = Field(..., ge=0.0, description="Final assessment score")
    assignment_score: Optional[float] = Field(None, ge=0.0, description="Optional assignment score")
    internal_score: Optional[float] = Field(None, ge=0.0, description="Optional continuous internal assessment score")
    course_code: Optional[str] = Field("CS-101", description="Course or subject code")
    term: Optional[str] = Field("Term 1", description="Academic term / semester")
    study_period_days: Optional[int] = Field(90, ge=1, description="Days covered by study tracking")
    data_source: str = Field("synthetic", description="Source classification: synthetic, survey, institutional")

class DatasetMetadata(BaseModel):
    id: str
    original_name: str
    storage_key: str
    checksum: str
    source_type: str
    row_count: int
    column_count: int
    status: str
    columns: List[str]
    sheet_names: Optional[List[str]] = None
    created_at: datetime

class ColumnMappingRequest(BaseModel):
    mapping: Dict[str, str] = Field(
        ...,
        description="Dictionary mapping canonical field names to uploaded file column headers"
    )

class QualityIssue(BaseModel):
    field: str
    issue_type: str
    count: int
    details: str

class ValidationResult(BaseModel):
    total_rows: int
    total_columns: int
    missing_counts: Dict[str, int]
    duplicate_rows_count: int
    duplicate_ids_count: int
    out_of_range_counts: Dict[str, int]
    is_valid_for_analysis: bool
    issues: List[QualityIssue]

class CleaningAction(BaseModel):
    action: str  # e.g., "drop_missing_required", "drop_exact_duplicates", "drop_out_of_range"
    reason: str
    affected_rows: int

class CleaningRequest(BaseModel):
    actions: List[str]
    reason: str = "Standard pre-analysis data hygiene"
