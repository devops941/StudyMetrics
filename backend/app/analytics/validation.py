from typing import Dict, Any, List
import pandas as pd
import numpy as np

def validate_dataframe(df: pd.DataFrame, score_max: float = 100.0) -> Dict[str, Any]:
    """
    Performs data quality validation on the tabular dataset.
    Checks for:
    - Missingness count per column (never imputed to zero)
    - Exact duplicate rows
    - Duplicate student IDs
    - Range violations (study_hours < 0 or > 24, attendance < 0 or > 100, scores < 0 or > score_max)
    """
    total_rows = len(df)
    total_columns = len(df.columns)
    
    missing_counts = {col: int(df[col].isna().sum()) for col in df.columns}
    duplicate_rows_count = int(df.duplicated().sum())
    
    duplicate_ids_count = 0
    if "record_id" in df.columns:
        duplicate_ids_count = int(df["record_id"].duplicated().sum())
    elif "student_id" in df.columns:
        duplicate_ids_count = int(df["student_id"].duplicated().sum())

    out_of_range_counts = {}
    issues: List[Dict[str, Any]] = []

    # Check study hours
    study_col = next((c for c in ["study_hours_daily", "study_hours"] if c in df.columns), None)
    if study_col and pd.api.types.is_numeric_dtype(df[study_col]):
        invalid_study = ((df[study_col] < 0) | (df[study_col] > 24)).sum()
        out_of_range_counts[study_col] = int(invalid_study)
        if invalid_study > 0:
            issues.append({
                "field": study_col,
                "issue_type": "RANGE_VIOLATION",
                "count": int(invalid_study),
                "details": f"{invalid_study} records have study hours outside [0, 24] hours."
            })

    # Check attendance
    att_col = next((c for c in ["attendance_pct", "attendance"] if c in df.columns), None)
    if att_col and pd.api.types.is_numeric_dtype(df[att_col]):
        invalid_att = ((df[att_col] < 0) | (df[att_col] > 100)).sum()
        out_of_range_counts[att_col] = int(invalid_att)
        if invalid_att > 0:
            issues.append({
                "field": att_col,
                "issue_type": "RANGE_VIOLATION",
                "count": int(invalid_att),
                "details": f"{invalid_att} records have attendance outside [0, 100]%."
            })

    # Check exam scores
    score_col = next((c for c in ["exam_score", "score", "grade"] if c in df.columns), None)
    if score_col and pd.api.types.is_numeric_dtype(df[score_col]):
        invalid_score = ((df[score_col] < 0) | (df[score_col] > score_max)).sum()
        out_of_range_counts[score_col] = int(invalid_score)
        if invalid_score > 0:
            issues.append({
                "field": score_col,
                "issue_type": "RANGE_VIOLATION",
                "count": int(invalid_score),
                "details": f"{invalid_score} records have assessment score outside [0, {score_max}]."
            })

    if duplicate_rows_count > 0:
        issues.append({
            "field": "_all_",
            "issue_type": "DUPLICATE_ROWS",
            "count": duplicate_rows_count,
            "details": f"Found {duplicate_rows_count} exact duplicate rows."
        })

    if duplicate_ids_count > 0:
        issues.append({
            "field": "record_id",
            "issue_type": "DUPLICATE_ID",
            "count": duplicate_ids_count,
            "details": f"Found {duplicate_ids_count} duplicate record identifiers."
        })

    for col, count in missing_counts.items():
        if count > 0:
            issues.append({
                "field": col,
                "issue_type": "MISSING_VALUES",
                "count": count,
                "details": f"Column '{col}' has {count} missing (NaN/null) values."
            })

    is_valid = len([i for i in issues if i["issue_type"] in ("RANGE_VIOLATION", "DUPLICATE_ID")]) == 0

    return {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "missing_counts": missing_counts,
        "duplicate_rows_count": duplicate_rows_count,
        "duplicate_ids_count": duplicate_ids_count,
        "out_of_range_counts": out_of_range_counts,
        "is_valid_for_analysis": is_valid,
        "issues": issues,
    }
