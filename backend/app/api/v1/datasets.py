from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.file_storage import save_uploaded_file
from app.services.dataset_service import (
    parse_dataset_file,
    get_excel_sheets,
    generate_synthetic_dataset
)
from app.services.validation_service import run_dataset_validation
from app.services.cleaning_service import clean_dataset
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.dataset import ColumnMappingRequest, CleaningRequest, ValidationResult

router = APIRouter(prefix="/datasets", tags=["Datasets"])
repo = DatasetRepository()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Uploads a CSV or Excel dataset file."""
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    storage_key, checksum, size = save_uploaded_file(content, file.filename)
    df = parse_dataset_file(storage_key)
    sheet_names = get_excel_sheets(storage_key)

    dataset_doc = {
        "original_name": file.filename,
        "storage_key": storage_key,
        "checksum": checksum,
        "file_size": size,
        "source_type": "upload",
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "sheet_names": sheet_names,
        "status": "uploaded",
        "owner_id": "default_researcher"
    }
    dataset_id = await repo.create_dataset(dataset_doc)
    
    # Create Version 1 (Raw)
    version_id = await repo.create_version(
        dataset_id=dataset_id,
        version_no=1,
        version_type="raw",
        storage_key=storage_key,
        schema_mapping={}
    )

    return {
        "dataset_id": dataset_id,
        "active_version_id": version_id,
        "metadata": dataset_doc
    }

@router.post("/sample")
async def create_sample_dataset(n: int = 286):
    """Generates a labelled synthetic dataset for testing and demonstration."""
    storage_key, checksum, size, df = generate_synthetic_dataset(n=n)

    dataset_doc = {
        "original_name": "synthetic_studymetrics_sample.csv",
        "storage_key": storage_key,
        "checksum": checksum,
        "file_size": size,
        "source_type": "synthetic",
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "sheet_names": [],
        "status": "ready",
        "owner_id": "default_researcher"
    }
    dataset_id = await repo.create_dataset(dataset_doc)
    
    version_id = await repo.create_version(
        dataset_id=dataset_id,
        version_no=1,
        version_type="cleaned",
        storage_key=storage_key,
        schema_mapping={c: c for c in df.columns}
    )

    return {
        "dataset_id": dataset_id,
        "active_version_id": version_id,
        "metadata": dataset_doc,
        "message": "Labelled synthetic dataset created successfully."
    }

@router.get("")
async def list_datasets():
    """Lists recent uploaded/generated datasets."""
    datasets = await repo.list_datasets()
    return {"datasets": datasets}

@router.get("/{id}/preview")
async def preview_dataset(id: str, limit: int = 50, sheet_name: Optional[str] = None):
    """Returns row preview, column definitions and data types."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    latest_ver = await repo.get_latest_version(id)
    storage_key = latest_ver["storage_key"] if latest_ver else dataset["storage_key"]
    df = parse_dataset_file(storage_key, sheet_name=sheet_name)

    preview_rows = df.head(limit).replace({float("nan"): None}).to_dict(orient="records")
    return {
        "dataset_id": id,
        "storage_key": storage_key,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "rows": preview_rows
    }

@router.post("/{id}/mapping")
async def save_column_mapping(id: str, payload: ColumnMappingRequest):
    """Saves source-to-canonical column mapping."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    latest_ver = await repo.get_latest_version(id)
    storage_key = latest_ver["storage_key"] if latest_ver else dataset["storage_key"]

    new_version_no = (latest_ver["version_no"] + 1) if latest_ver else 2
    version_id = await repo.create_version(
        dataset_id=id,
        version_no=new_version_no,
        version_type="mapped",
        storage_key=storage_key,
        schema_mapping=payload.mapping
    )

    return {
        "dataset_id": id,
        "version_id": version_id,
        "mapping": payload.mapping,
        "message": "Column mapping saved successfully."
    }

@router.post("/{id}/validate", response_model=ValidationResult)
async def validate_dataset(id: str, score_max: float = 100.0):
    """Runs data quality validation: missingness, duplicates, and range boundaries."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    latest_ver = await repo.get_latest_version(id)
    storage_key = latest_ver["storage_key"] if latest_ver else dataset["storage_key"]

    result = run_dataset_validation(storage_key, score_max=score_max)
    return result

@router.post("/{id}/clean")
async def apply_cleaning(id: str, payload: CleaningRequest, score_max: float = 100.0):
    """Applies confirmed exclusions and non-destructively creates a new dataset version."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    latest_ver = await repo.get_latest_version(id)
    storage_key = latest_ver["storage_key"] if latest_ver else dataset["storage_key"]

    new_storage_key, checksum, init_rows, final_rows, size, logs = clean_dataset(
        storage_key=storage_key,
        actions=payload.actions,
        score_max=score_max
    )

    new_version_no = (latest_ver["version_no"] + 1) if latest_ver else 2
    version_id = await repo.create_version(
        dataset_id=id,
        version_no=new_version_no,
        version_type="cleaned",
        storage_key=new_storage_key,
        schema_mapping=latest_ver["schema_mapping"] if latest_ver else {}
    )

    await repo.add_cleaning_logs(dataset_id=id, version_id=version_id, logs=logs)

    return {
        "dataset_id": id,
        "version_id": version_id,
        "version_no": new_version_no,
        "initial_rows": init_rows,
        "final_rows": final_rows,
        "removed_rows": init_rows - final_rows,
        "cleaning_logs": logs,
        "message": f"Cleaned Version {new_version_no} generated successfully."
    }

@router.get("/{id}/versions")
async def get_dataset_versions(id: str):
    """Retrieves all versions created for a dataset."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    versions = await repo.list_versions(id)
    return {"dataset_id": id, "versions": versions}

@router.get("/{id}/logs")
async def get_cleaning_logs(id: str):
    """Retrieves cleaning audit trail for a dataset."""
    dataset = await repo.get_dataset(id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    logs = await repo.get_cleaning_logs(id)
    return {"dataset_id": id, "logs": logs}
