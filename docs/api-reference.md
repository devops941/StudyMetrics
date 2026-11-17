# StudyMetrics — API Reference

## Base URL
`/api/v1`

## Endpoints

### System Health
- **`GET /api/v1/health`**  
  Checks application status and MongoDB connectivity.

### Datasets
- **`POST /api/v1/datasets/upload`**  
  Multipart file upload (`.csv`, `.xlsx`). Returns dataset metadata and preview.
- **`POST /api/v1/datasets/sample`**  
  Generates a synthetic dataset for testing/demonstration with labelled `data_source="synthetic"`.
- **`GET /api/v1/datasets/{id}/preview`**  
  Retrieves row preview, column definitions, and summary counts.
- **`POST /api/v1/datasets/{id}/mapping`**  
  Saves column mapping from raw column headers to canonical names.
- **`POST /api/v1/datasets/{id}/validate`**  
  Runs quality validation: missingness, duplicates, and out-of-range checks.
- **`POST /api/v1/datasets/{id}/clean`**  
  Applies confirmed cleaning actions and creates a new immutable dataset version.

### Analytics
- **`POST /api/v1/analysis/eda`**  
  Calculates descriptive statistics (mean, SD, median, IQR, min/max) and histogram/boxplot distributions.
- **`POST /api/v1/analysis/correlation`**  
  Computes Pearson $r$ or Spearman $\rho$ correlation between study-time/attendance and scores.
- **`POST /api/v1/analysis/group-comparison`**  
  Executes hypothesis testing (Welch's t-test, ANOVA, Kruskal-Wallis, Mann-Whitney U).

### Sessions & Reports
- **`POST /api/v1/sessions`** / **`GET /api/v1/sessions/{id}`**  
  Manages research workspace sessions.
- **`POST /api/v1/reports/{session_id}/pdf`**  
  Generates research PDF via ReportLab.
- **`POST /api/v1/reports/{session_id}/excel`**  
  Generates research Excel workbook via OpenPyXL.
- **`GET /api/v1/reports/{export_id}/download`**  
  Downloads exported report file.
