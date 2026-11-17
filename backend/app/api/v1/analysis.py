from fastapi import APIRouter, HTTPException, status
from app.services.dataset_service import parse_dataset_file
from app.repositories.dataset_repository import DatasetRepository
from app.analytics.descriptive import compute_descriptive_stats, compute_chart_distributions
from app.analytics.correlation import compute_correlation
from app.analytics.group_tests import compute_group_comparison
from app.schemas.analysis import (
    EDARequest, EDAResponse,
    CorrelationRequest, CorrelationResponse,
    GroupComparisonRequest, GroupComparisonResponse
)

router = APIRouter(prefix="/analysis", tags=["Analytics"])
dataset_repo = DatasetRepository()

async def resolve_dataframe_from_version(version_id: str):
    """
    Resolves stored dataset file from either a dataset version ID or a parent dataset ID.
    If a dataset ID is provided, automatically uses the latest version (or raw storage key).
    """
    # 1. Try resolving as a dataset_version ID
    version = await dataset_repo.get_version(version_id)
    if version:
        return parse_dataset_file(version["storage_key"])

    # 2. If not found, check if version_id is actually a parent dataset_id
    latest = await dataset_repo.get_latest_version(version_id)
    if latest:
        return parse_dataset_file(latest["storage_key"])

    # 3. Fallback to raw dataset document storage_key
    dataset = await dataset_repo.get_dataset(version_id)
    if dataset:
        return parse_dataset_file(dataset["storage_key"])

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Dataset or dataset version '{version_id}' not found."
    )

@router.post("/eda", response_model=EDAResponse)
async def run_eda(payload: EDARequest):
    """Calculates comprehensive descriptive statistics and distribution data."""
    try:
        df = await resolve_dataframe_from_version(payload.dataset_version_id)
        stats = compute_descriptive_stats(df, columns=payload.target_columns)
        charts = compute_chart_distributions(df, columns=payload.target_columns)
        return {
            "statistics": stats,
            "histograms": charts["histograms"],
            "boxplots": charts["boxplots"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/correlation", response_model=CorrelationResponse)
async def run_correlation(payload: CorrelationRequest):
    """Computes Pearson or Spearman correlation with confidence interval and cautious interpretation."""
    try:
        df = await resolve_dataframe_from_version(payload.dataset_version_id)
        res = compute_correlation(
            df=df,
            x_col=payload.x_column,
            y_col=payload.y_column,
            method=payload.method
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/group-comparison", response_model=GroupComparisonResponse)
async def run_group_comparison(payload: GroupComparisonRequest):
    """Executes Welch's t-test, ANOVA, Kruskal-Wallis, or Mann-Whitney U test."""
    try:
        df = await resolve_dataframe_from_version(payload.dataset_version_id)
        res = compute_group_comparison(
            df=df,
            group_col=payload.group_column,
            target_col=payload.target_column,
            bins=payload.bins,
            bin_labels=payload.bin_labels,
            test_type=payload.test_type
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
