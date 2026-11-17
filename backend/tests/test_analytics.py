import pytest
import pandas as pd
import numpy as np
from app.analytics.descriptive import compute_descriptive_stats, compute_chart_distributions
from app.analytics.correlation import compute_correlation
from app.analytics.group_tests import compute_group_comparison
from app.analytics.validation import validate_dataframe

@pytest.fixture
def sample_dataframe():
    np.random.seed(42)
    n = 100
    study_hours = np.linspace(1.0, 8.0, n)
    attendance = np.linspace(50.0, 100.0, n)
    exam_score = 30.0 + 5.0 * study_hours + 0.3 * attendance + np.random.normal(0, 2, n)
    
    return pd.DataFrame({
        "record_id": [f"STD-{i:03d}" for i in range(n)],
        "study_hours_daily": study_hours,
        "attendance_pct": attendance,
        "exam_score": exam_score
    })

def test_descriptive_stats(sample_dataframe):
    stats = compute_descriptive_stats(sample_dataframe, ["study_hours_daily", "exam_score"])
    assert len(stats) == 2
    study_stat = next(s for s in stats if s["column"] == "study_hours_daily")
    assert study_stat["n_valid"] == 100
    assert study_stat["n_missing"] == 0
    assert 4.0 <= study_stat["mean"] <= 5.0

def test_pearson_correlation(sample_dataframe):
    corr = compute_correlation(
        sample_dataframe,
        x_col="study_hours_daily",
        y_col="exam_score",
        method="pearson"
    )
    assert corr["method"] == "pearson"
    assert corr["n"] == 100
    assert corr["estimate"] > 0.8  # Strong positive correlation
    assert corr["is_statistically_significant"] is True
    assert "causality_note" in corr

def test_spearman_correlation(sample_dataframe):
    corr = compute_correlation(
        sample_dataframe,
        x_col="attendance_pct",
        y_col="exam_score",
        method="spearman"
    )
    assert corr["method"] == "spearman"
    assert corr["estimate"] > 0.8
    assert corr["is_statistically_significant"] is True

def test_group_comparison_welch(sample_dataframe):
    result = compute_group_comparison(
        sample_dataframe,
        group_col="study_hours_daily",
        target_col="exam_score",
        bins=[0.0, 4.5, 10.0],
        bin_labels=["Low Study", "High Study"],
        test_type="welch_ttest"
    )
    assert "Welch" in result["test_name"]
    assert len(result["groups"]) == 2
    assert result["is_significant"] is True

def test_dataframe_validation():
    bad_df = pd.DataFrame({
        "record_id": ["STD-001", "STD-001"],  # Duplicate ID
        "study_hours_daily": [-2.0, 28.0],     # Out of range
        "attendance_pct": [120.0, 80.0],       # Out of range
        "exam_score": [50.0, None]             # Missing value
    })
    val = validate_dataframe(bad_df, score_max=100.0)
    assert val["duplicate_ids_count"] == 1
    assert val["missing_counts"]["exam_score"] == 1
    assert val["is_valid_for_analysis"] is False
