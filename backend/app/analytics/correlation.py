import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats

def compute_correlation(
    df: pd.DataFrame,
    x_col: str,
    y_col: str,
    method: str = "pearson",
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Computes Pearson or Spearman correlation for paired observations.
    Includes 95% Confidence Interval, t-statistic, and ethical reporting notes.
    """
    if x_col not in df.columns or y_col not in df.columns:
        raise ValueError(f"Columns '{x_col}' or '{y_col}' not found in dataset.")

    # Extract paired complete cases
    paired = df[[x_col, y_col]].dropna()
    n = len(paired)

    if n < 3:
        raise ValueError(f"Insufficient paired observations (n={n}). At least 3 complete pairs are required.")

    x = paired[x_col].to_numpy(dtype=float)
    y = paired[y_col].to_numpy(dtype=float)

    # Check for zero variance / constant variables
    std_x = np.std(x, ddof=1)
    std_y = np.std(y, ddof=1)
    if std_x == 0 or std_y == 0:
        return {
            "method": method,
            "x": x_col,
            "y": y_col,
            "n": n,
            "estimate": 0.0,
            "p_value": 1.0,
            "confidence_interval": None,
            "t_statistic": None,
            "is_statistically_significant": False,
            "causality_note": "This observational analysis does not establish causation.",
            "interpretation": f"Cannot compute correlation: {'x' if std_x == 0 else 'y'} variable is constant."
        }

    confidence_interval: Optional[List[float]] = None
    t_stat: Optional[float] = None

    if method.lower() == "spearman":
        res = stats.spearmanr(x, y)
        estimate = float(res.statistic)
        p_val = float(res.pvalue)
    else:
        # Default Pearson
        res = stats.pearsonr(x, y)
        estimate = float(res.statistic)
        p_val = float(res.pvalue)

        # Compute Fisher's z-transformation 95% CI
        if abs(estimate) < 1.0 and n > 3:
            z = np.arctanh(estimate)
            se = 1.0 / math.sqrt(n - 3)
            z_crit = stats.norm.ppf(1 - alpha / 2)
            ci_low = np.tanh(z - z_crit * se)
            ci_high = np.tanh(z + z_crit * se)
            confidence_interval = [round(float(ci_low), 4), round(float(ci_high), 4)]

        # t-statistic: t = r * sqrt(n-2) / sqrt(1 - r^2)
        if abs(estimate) < 1.0:
            t_stat = round(float(estimate * math.sqrt(n - 2) / math.sqrt(1 - estimate**2)), 3)

    # Safeguard against presenting p-value as 0.000
    p_val_rounded = round(p_val, 5)

    # Compute OLS linear regression parameters and scatter plot points
    slope: Optional[float] = None
    intercept: Optional[float] = None
    r_squared: Optional[float] = None
    std_err: Optional[float] = None
    scatter_points: Optional[List[Dict[str, float]]] = None

    try:
        reg = stats.linregress(x, y)
        slope = round(float(reg.slope), 4)
        intercept = round(float(reg.intercept), 4)
        r_squared = round(float(reg.rvalue ** 2), 4)
        std_err = round(float(reg.stderr), 4)
        scatter_points = [{"x": round(float(xi), 2), "y": round(float(yi), 2)} for xi, yi in zip(x, y)]
    except Exception:
        pass

    # Qualitative strength label
    abs_est = abs(estimate)
    if abs_est >= 0.7:
        strength = "strong"
    elif abs_est >= 0.4:
        strength = "moderate"
    elif abs_est >= 0.2:
        strength = "weak"
    else:
        strength = "negligible"

    direction = "positive" if estimate > 0 else "negative"
    sig_text = "statistically significant" if p_val < alpha else "not statistically significant"
    interpretation = (
        f"A {strength} {direction} association was observed ({method.title()} r = {estimate:.3f}, "
        f"p = {p_val_rounded}, n = {n}), which is {sig_text} at alpha = {alpha}."
    )

    return {
        "method": method.lower(),
        "x": x_col,
        "y": y_col,
        "n": n,
        "estimate": round(estimate, 4),
        "p_value": p_val_rounded,
        "confidence_interval": confidence_interval,
        "t_statistic": t_stat,
        "is_statistically_significant": bool(p_val < alpha),
        "causality_note": "This observational analysis does not establish causation.",
        "interpretation": interpretation,
        "slope": slope,
        "intercept": intercept,
        "r_squared": r_squared,
        "std_err": std_err,
        "scatter_points": scatter_points
    }
