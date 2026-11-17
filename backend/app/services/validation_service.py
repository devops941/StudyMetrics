from typing import Dict, Any
import pandas as pd
from app.analytics.validation import validate_dataframe
from app.services.dataset_service import parse_dataset_file

def run_dataset_validation(storage_key: str, score_max: float = 100.0) -> Dict[str, Any]:
    """Validates data quality of a stored dataset file."""
    df = parse_dataset_file(storage_key)
    return validate_dataframe(df, score_max=score_max)
