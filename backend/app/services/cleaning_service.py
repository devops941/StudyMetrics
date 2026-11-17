from typing import List, Dict, Any, Tuple
import pandas as pd
from app.services.dataset_service import parse_dataset_file
from app.services.file_storage import save_uploaded_file

def clean_dataset(
    storage_key: str,
    actions: List[str],
    score_max: float = 100.0
) -> Tuple[str, str, int, int, int, List[Dict[str, Any]]]:
    """
    Applies non-destructive cleaning actions to the dataset and creates a new cleaned version file.
    Never overwrites the original raw file.
    
    Returns:
    (new_storage_key, new_checksum, initial_rows, final_rows, cleaned_file_size, logs)
    """
    df = parse_dataset_file(storage_key)
    initial_rows = len(df)
    logs: List[Dict[str, Any]] = []

    # 1. Action: drop exact duplicates
    if "drop_exact_duplicates" in actions:
        before = len(df)
        df = df.drop_duplicates()
        dropped = before - len(df)
        if dropped > 0:
            logs.append({
                "action": "drop_exact_duplicates",
                "affected_rows": dropped,
                "reason": "Removed exact duplicate records across all fields."
            })

    # 2. Action: drop duplicate IDs
    if "drop_duplicate_ids" in actions:
        id_col = next((c for c in ["record_id", "student_id"] if c in df.columns), None)
        if id_col:
            before = len(df)
            df = df.drop_duplicates(subset=[id_col], keep="first")
            dropped = before - len(df)
            if dropped > 0:
                logs.append({
                    "action": "drop_duplicate_ids",
                    "affected_rows": dropped,
                    "reason": f"Removed duplicate occurrences of identifier column '{id_col}'."
                })

    # 3. Action: drop missing required fields
    if "drop_missing_required" in actions:
        required_cols = [c for c in ["study_hours_daily", "exam_score"] if c in df.columns]
        if required_cols:
            before = len(df)
            df = df.dropna(subset=required_cols)
            dropped = before - len(df)
            if dropped > 0:
                logs.append({
                    "action": "drop_missing_required",
                    "affected_rows": dropped,
                    "reason": f"Removed records missing required analytical fields: {', '.join(required_cols)}."
                })

    # 4. Action: drop invalid out-of-range values
    if "drop_out_of_range" in actions:
        before = len(df)
        cond = pd.Series(True, index=df.index)
        
        if "study_hours_daily" in df.columns and pd.api.types.is_numeric_dtype(df["study_hours_daily"]):
            cond &= (df["study_hours_daily"] >= 0) & (df["study_hours_daily"] <= 24)
            
        if "attendance_pct" in df.columns and pd.api.types.is_numeric_dtype(df["attendance_pct"]):
            cond &= (df["attendance_pct"] >= 0) & (df["attendance_pct"] <= 100)
            
        if "exam_score" in df.columns and pd.api.types.is_numeric_dtype(df["exam_score"]):
            cond &= (df["exam_score"] >= 0) & (df["exam_score"] <= score_max)

        df = df[cond]
        dropped = before - len(df)
        if dropped > 0:
            logs.append({
                "action": "drop_out_of_range",
                "affected_rows": dropped,
                "reason": f"Removed records with impossible or out-of-range values."
            })

    final_rows = len(df)
    
    # Save cleaned file into storage
    cleaned_bytes = df.to_csv(index=False).encode("utf-8")
    new_storage_key, checksum, size = save_uploaded_file(cleaned_bytes, "cleaned_dataset.csv")

    return new_storage_key, checksum, initial_rows, final_rows, size, logs
