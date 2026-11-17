from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats

def compute_group_comparison(
    df: pd.DataFrame,
    group_col: str,
    target_col: str,
    bins: Optional[List[float]] = None,
    bin_labels: Optional[List[str]] = None,
    test_type: str = "auto",
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Performs group comparison and hypothesis testing across study groups.
    Handles continuous binning or categorical group variables.
    Calculates Welch's t-test, ANOVA, Kruskal-Wallis, or Mann-Whitney U.
    """
    if group_col not in df.columns or target_col not in df.columns:
        raise ValueError(f"Columns '{group_col}' or '{target_col}' not found in dataset.")

    clean_df = df[[group_col, target_col]].dropna().copy()
    if len(clean_df) < 4:
        raise ValueError("Insufficient sample size for group comparison.")

    # If group column is continuous numeric and bins are provided, categorize it
    if pd.api.types.is_numeric_dtype(clean_df[group_col]) and bins:
        labels = bin_labels if bin_labels else [f"Group {i+1}" for i in range(len(bins)-1)]
        clean_df["_group_binned"] = pd.cut(clean_df[group_col], bins=bins, labels=labels, include_lowest=True)
        working_group_col = "_group_binned"
    else:
        working_group_col = group_col

    # Group summaries
    grouped = clean_df.groupby(working_group_col, observed=True)[target_col]
    group_summaries: List[Dict[str, Any]] = []
    group_data_arrays: List[np.ndarray] = []
    valid_group_names: List[str] = []

    for name, group_series in grouped:
        arr = group_series.to_numpy(dtype=float)
        if len(arr) == 0:
            continue
        valid_group_names.append(str(name))
        group_data_arrays.append(arr)
        
        q25 = float(np.percentile(arr, 25))
        q75 = float(np.percentile(arr, 75))
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        
        group_summaries.append({
            "group_name": str(name),
            "n": int(len(arr)),
            "mean": round(float(np.mean(arr)), 3),
            "std": round(float(np.std(arr, ddof=1)), 3) if len(arr) > 1 else 0.0,
            "median": round(float(np.median(arr)), 3),
            "iqr": round(float(q75 - q25), 3),
            "min": round(min_val, 3),
            "max": round(max_val, 3),
            "q25": round(q25, 3),
            "q75": round(q75, 3)
        })

    k = len(group_data_arrays)
    if k < 2:
        raise ValueError("Group comparison requires at least 2 non-empty groups.")

    # Determine test
    test_statistic = 0.0
    p_value = 1.0
    df_val: Optional[float] = None
    effect_size: Dict[str, Any] = {}
    test_name = test_type

    if k == 2:
        g1, g2 = group_data_arrays[0], group_data_arrays[1]
        if test_type in ("auto", "welch_ttest"):
            res = stats.ttest_ind(g1, g2, equal_var=False)
            test_name = "Welch's Two-Sample t-test"
            test_statistic = float(res.statistic)
            p_value = float(res.pvalue)
            df_val = float(res.df) if hasattr(res, "df") else None
            # Cohen's d
            pooled_sd = np.sqrt(((len(g1)-1)*np.var(g1, ddof=1) + (len(g2)-1)*np.var(g2, ddof=1)) / (len(g1) + len(g2) - 2))
            if pooled_sd > 0:
                cohens_d = (np.mean(g1) - np.mean(g2)) / pooled_sd
                effect_size = {"metric": "Cohen's d", "value": round(float(cohens_d), 3)}
        else:
            res = stats.mannwhitneyu(g1, g2, alternative="two-sided")
            test_name = "Mann-Whitney U Test"
            test_statistic = float(res.statistic)
            p_value = float(res.pvalue)
    else:
        # k >= 3 groups
        if test_type in ("auto", "anova"):
            res = stats.f_oneway(*group_data_arrays)
            test_name = "One-Way ANOVA"
            test_statistic = float(res.statistic)
            p_value = float(res.pvalue)
            df_val = float(k - 1)
            # Eta squared (η²)
            grand_mean = np.mean(np.concatenate(group_data_arrays))
            ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in group_data_arrays)
            ss_total = sum(sum((x - grand_mean)**2 for x in g) for g in group_data_arrays)
            if ss_total > 0:
                eta_sq = ss_between / ss_total
                effect_size = {"metric": "Eta-squared (η²)", "value": round(float(eta_sq), 3)}
        else:
            res = stats.kruskal(*group_data_arrays)
            test_name = "Kruskal-Wallis H-test"
            test_statistic = float(res.statistic)
            p_value = float(res.pvalue)
            df_val = float(k - 1)

    # Post-hoc pairwise contrasts for k >= 2
    pairwise_contrasts: List[Dict[str, Any]] = []
    for i in range(len(valid_group_names)):
        for j in range(i + 1, len(valid_group_names)):
            gi, gj = group_data_arrays[i], group_data_arrays[j]
            mean_diff = float(np.mean(gi) - np.mean(gj))
            t_res = stats.ttest_ind(gi, gj, equal_var=False)
            
            # Cohen's d
            pooled_denom = len(gi) + len(gj) - 2
            if pooled_denom > 0:
                pooled_s = np.sqrt(((len(gi)-1)*np.var(gi, ddof=1) + (len(gj)-1)*np.var(gj, ddof=1)) / pooled_denom)
                cd = float(mean_diff / pooled_s) if pooled_s > 0 else 0.0
            else:
                cd = 0.0

            p_val_contrast = float(t_res.pvalue) if not np.isnan(t_res.pvalue) else 1.0
            pairwise_contrasts.append({
                "comparison": f"{valid_group_names[i]} vs {valid_group_names[j]}",
                "group_a": valid_group_names[i],
                "group_b": valid_group_names[j],
                "diff": round(mean_diff, 2),
                "p_value": round(p_val_contrast, 5),
                "cohens_d": round(cd, 2),
                "significant": bool(p_val_contrast < alpha)
            })

    is_significant = bool(p_value < alpha)
    p_val_rounded = round(p_value, 5)

    interpretation = (
        f"{test_name} indicates {'a statistically significant' if is_significant else 'no statistically significant'} "
        f"difference between groups (statistic = {test_statistic:.3f}, p = {p_val_rounded}, alpha = {alpha})."
    )

    assumptions_note = (
        "Welch t-test accounts for unequal variances. ANOVA assumes approximate normality and homoscedasticity. "
        "Non-parametric tests (Mann-Whitney / Kruskal-Wallis) assess rank differences without normality assumptions."
    )

    return {
        "test_name": test_name,
        "groups": group_summaries,
        "test_statistic": round(test_statistic, 4),
        "p_value": p_val_rounded,
        "degrees_of_freedom": df_val,
        "effect_size": effect_size,
        "is_significant": is_significant,
        "assumptions_note": assumptions_note,
        "interpretation": interpretation,
        "pairwise_contrasts": pairwise_contrasts
    }
