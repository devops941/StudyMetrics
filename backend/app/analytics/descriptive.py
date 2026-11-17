from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats

def compute_descriptive_stats(df: pd.DataFrame, columns: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Computes rigorous descriptive statistics for numerical columns in df.
    """
    if columns is None:
        target_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    else:
        target_cols = [c for c in columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]

    results = []
    for col in target_cols:
        series = df[col].dropna()
        n_valid = int(len(series))
        n_missing = int(df[col].isna().sum())

        if n_valid == 0:
            results.append({
                "column": col,
                "n_valid": 0,
                "n_missing": n_missing,
                "mean": None,
                "std": None,
                "median": None,
                "iqr": None,
                "min": None,
                "max": None,
                "skewness": None,
            })
            continue

        q25 = float(np.percentile(series, 25))
        q75 = float(np.percentile(series, 75))
        iqr = float(q75 - q25)
        
        skew = float(stats.skew(series)) if n_valid >= 3 else None

        results.append({
            "column": col,
            "n_valid": n_valid,
            "n_missing": n_missing,
            "mean": round(float(np.mean(series)), 3),
            "std": round(float(np.std(series, ddof=1)), 3) if n_valid > 1 else 0.0,
            "median": round(float(np.median(series)), 3),
            "iqr": round(iqr, 3),
            "min": round(float(np.min(series)), 3),
            "max": round(float(np.max(series)), 3),
            "skewness": round(skew, 3) if skew is not None else None,
        })
    return results

def compute_chart_distributions(df: pd.DataFrame, columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Computes histogram bins and box plot summary metrics for frontend visualization.
    """
    if columns is None:
        target_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    else:
        target_cols = [c for c in columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]

    histograms = {}
    boxplots = {}

    for col in target_cols:
        series = df[col].dropna()
        if len(series) < 2:
            continue

        # Histogram (10 bins)
        counts, bin_edges = np.histogram(series, bins=10)
        histograms[col] = {
            "counts": counts.tolist(),
            "bin_edges": [round(float(b), 2) for b in bin_edges],
            "bin_labels": [f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}" for i in range(len(counts))]
        }

        # Boxplot summary
        q1 = float(np.percentile(series, 25))
        median = float(np.percentile(series, 50))
        q3 = float(np.percentile(series, 75))
        iqr = q3 - q1
        lower_fence = max(float(np.min(series)), q1 - 1.5 * iqr)
        upper_fence = min(float(np.max(series)), q3 + 1.5 * iqr)
        outliers = series[(series < lower_fence) | (series > upper_fence)].tolist()

        boxplots[col] = {
            "min": round(lower_fence, 2),
            "q1": round(q1, 2),
            "median": round(median, 2),
            "q3": round(q3, 2),
            "max": round(upper_fence, 2),
            "outliers": [round(float(o), 2) for o in outliers]
        }

    return {
        "histograms": histograms,
        "boxplots": boxplots
    }
