# StudyMetrics — Statistical Methodology & Research Integrity

## 1. Research Scope
StudyMetrics investigates the empirical relationship between:
- **Predictor 1**: Average daily study time (`study_hours_daily`)
- **Predictor 2**: Classroom attendance percentage (`attendance_pct`)
- **Outcome**: Assessment performance (`exam_score`, `internal_score`, `assignment_score`)

## 2. Statistical Techniques
1. **Descriptive Statistics**: Valid $n$, mean, standard deviation, median, interquartile range (IQR), minimum, maximum, and skewness.
2. **Correlation Analysis**:
   - **Pearson correlation ($r$)**: Measures linear association for continuous, normally distributed paired observations. Provides two-tailed p-value and 95% confidence intervals.
   - **Spearman rank correlation ($\rho$)**: Non-parametric monotonic association suited for skewed distributions or ordinal scales.
3. **Group Hypothesis Testing**:
   - **Two groups**: Welch's two-sample t-test (robust against unequal variances) and Mann-Whitney U test.
   - **Three or more groups**: One-way ANOVA with post-hoc diagnostics, and Kruskal-Wallis non-parametric test.

## 3. Data-Quality & Ethical Safeguards
- **No Zero Imputation**: Missing study hours or exam marks are never imputed with 0, as this introduces severe negative skew and false associations.
- **Strict Anonymization**: Individual student IDs are pseudonymized into synthetic identifiers (`record_id`).
- **Exact P-Values**: P-values are reported with exact decimal precision; values smaller than machine epsilon are shown as `p < 0.001`, never `p = 0.000`.
- **Causality Caveat**: Observational correlation does not establish causation. Uncontrolled confounders (prior knowledge, motivation, socio-economic factors) must be acknowledged.
