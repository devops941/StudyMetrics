# StudyMetrics — Architecture & System Design

## 1. System Overview
StudyMetrics follows a clean, decoupled 3-tier architecture:
- **Presentation Layer**: React 19 + TypeScript frontend with Tailwind CSS and TanStack Query.
- **Application & Analytics Layer**: Python 3.12 + FastAPI with pure NumPy/Pandas/SciPy analytics modules.
- **Persistence Layer**: MongoDB database for document metadata and state + local private filesystem storage for dataset files.

## 2. Decoupling Rules
1. **Frontend-Database Boundary**: React never connects to MongoDB directly. All state queries and mutations pass through the `/api/v1` REST API.
2. **Tabular Storage Separation**: Uploaded tabular data (CSV/XLSX) are never stored as giant embedded arrays inside MongoDB documents to avoid BSON document limit (16 MiB). Instead, files are saved in `storage/uploads/` with unique safe UUID storage keys.
3. **Statistical Decoupling**: Analytics functions in `app/analytics/` are framework-agnostic. They receive pure DataFrames or numeric arrays and return Python dictionaries/primitives.

## 3. Database Collections
- `datasets`: Uploaded files and synthetic dataset metadata.
- `dataset_versions`: Raw, mapped, and cleaned dataset versions.
- `cleaning_logs`: Audit trail of rows removed, reasons, and timestamps.
- `analysis_sessions`: Active research workspace containing parameter configurations.
- `analysis_results`: Saved analytical results (descriptive stats, correlations, group tests).
- `report_exports`: Generated report file metadata and download paths.
