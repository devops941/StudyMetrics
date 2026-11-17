import io
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from app.services.file_storage import get_file_path, save_uploaded_file
from app.core.security import generate_pseudonym

def parse_dataset_file(storage_key: str, sheet_name: Optional[str] = None) -> pd.DataFrame:
    """Reads stored CSV or Excel file into a pandas DataFrame."""
    path = get_file_path(storage_key)
    ext = path.suffix.lower()

    if ext == ".csv":
        return pd.read_csv(path)
    elif ext in (".xlsx", ".xls"):
        return pd.read_excel(path, sheet_name=sheet_name if sheet_name else 0)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def get_excel_sheets(storage_key: str) -> List[str]:
    """Retrieves sheet names from an Excel file."""
    path = get_file_path(storage_key)
    if path.suffix.lower() in (".xlsx", ".xls"):
        excel_file = pd.ExcelFile(path)
        return excel_file.sheet_names
    return []

def generate_synthetic_dataset(n: int = 286, seed: int = 42) -> Tuple[str, str, int, pd.DataFrame]:
    """
    Generates a realistic synthetic educational research dataset.
    Follows realistic positive correlation between study hours, attendance and assessment scores.
    Strictly labelled with data_source='synthetic'.
    """
    np.random.seed(seed)
    
    # 1. Study hours daily: gamma distribution clipped to [0.5, 10.0]
    study_hours = np.clip(np.random.gamma(shape=3.0, scale=1.2, size=n), 0.2, 10.0)
    
    # 2. Attendance percentage: beta distribution scaled to [40, 100]
    attendance = np.clip(np.random.beta(a=6.0, b=2.0, size=n) * 60 + 40, 45.0, 100.0)
    
    # 3. Exam score: generated with linear relation + residual noise
    # score = 25 + 4.5 * study_hours + 0.35 * attendance + noise
    noise = np.random.normal(loc=0, scale=7.5, size=n)
    exam_score = np.clip(25.0 + 4.2 * study_hours + 0.32 * attendance + noise, 20.0, 100.0)
    
    # Optional assignment & internal scores
    assignment_score = np.clip(exam_score + np.random.normal(0, 5, size=n), 20.0, 100.0)
    internal_score = np.clip(0.4 * assignment_score + 0.6 * exam_score + np.random.normal(0, 3, size=n), 20.0, 100.0)

    record_ids = [generate_pseudonym("SYN") for _ in range(n)]

    df = pd.DataFrame({
        "record_id": record_ids,
        "study_hours_daily": np.round(study_hours, 2),
        "attendance_pct": np.round(attendance, 1),
        "exam_score": np.round(exam_score, 1),
        "assignment_score": np.round(assignment_score, 1),
        "internal_score": np.round(internal_score, 1),
        "course_code": np.random.choice(["CS-101", "MATH-201", "STAT-102"], size=n),
        "term": np.random.choice(["Fall 2026", "Spring 2026"], size=n),
        "study_period_days": [90] * n,
        "data_source": ["synthetic"] * n
    })

    # Save synthetic file into storage
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    storage_key, checksum, size = save_uploaded_file(csv_bytes, "synthetic_studymetrics_sample.csv")

    return storage_key, checksum, size, df
