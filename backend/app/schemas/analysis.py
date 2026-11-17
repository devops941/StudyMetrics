from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class EDARequest(BaseModel):
    dataset_version_id: str
    target_columns: Optional[List[str]] = None
    group_by: Optional[str] = None

class DescriptiveStat(BaseModel):
    column: str
    n_valid: int
    n_missing: int
    mean: Optional[float]
    std: Optional[float]
    median: Optional[float]
    iqr: Optional[float]
    min: Optional[float]
    max: Optional[float]
    skewness: Optional[float]

class EDAResponse(BaseModel):
    statistics: List[DescriptiveStat]
    histograms: Dict[str, Dict[str, Any]]
    boxplots: Dict[str, Dict[str, Any]]

class CorrelationRequest(BaseModel):
    dataset_version_id: str
    x_column: str = "study_hours_daily"
    y_column: str = "exam_score"
    method: str = "pearson"  # "pearson" or "spearman"

class CorrelationResponse(BaseModel):
    method: str
    x: str
    y: str
    n: int
    estimate: float
    p_value: float
    confidence_interval: Optional[List[float]] = None
    t_statistic: Optional[float] = None
    is_statistically_significant: bool
    causality_note: str = "This observational analysis does not establish causation."
    interpretation: str
    slope: Optional[float] = None
    intercept: Optional[float] = None
    r_squared: Optional[float] = None
    std_err: Optional[float] = None
    scatter_points: Optional[List[Dict[str, float]]] = None

class GroupComparisonRequest(BaseModel):
    dataset_version_id: str
    group_column: str = "study_hours_daily"
    target_column: str = "exam_score"
    bins: Optional[List[float]] = None  # e.g. [0, 2, 4, 24] for Low, Medium, High
    bin_labels: Optional[List[str]] = None
    test_type: str = "auto"  # "auto", "welch_ttest", "anova", "kruskal_wallis", "mann_whitney"

class GroupSummary(BaseModel):
    group_name: str
    n: int
    mean: float
    std: float
    median: float
    iqr: float
    min: Optional[float] = None
    max: Optional[float] = None
    q25: Optional[float] = None
    q75: Optional[float] = None

class GroupComparisonResponse(BaseModel):
    test_name: str
    groups: List[GroupSummary]
    test_statistic: float
    p_value: float
    degrees_of_freedom: Optional[float] = None
    effect_size: Optional[Dict[str, Any]] = None
    is_significant: bool
    assumptions_note: str
    interpretation: str
    pairwise_contrasts: Optional[List[Dict[str, Any]]] = None
