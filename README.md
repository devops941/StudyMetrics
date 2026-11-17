# StudyMetrics

**Student Study-Time & Assessment Relationship Analytics Platform**  
*A full-stack, research-grade institutional analytics application built with **React 19 + TypeScript**, **Python 3.12 + FastAPI**, and **MongoDB Atlas**.*

---

## 📌 1. Project Overview & Problem Solved

### What is StudyMetrics?
**StudyMetrics** is an empirical educational analytics platform designed for university administrators, academic researchers, and educational evaluators. It investigates the observational statistical relationship between:
1. **Daily Study Hours** (`study_hours_daily`),
2. **Classroom Attendance Rates (%)** (`attendance_pct`), and
3. **Assessment Outcomes** (`exam_score`, `assignment_score`, `internal_score`).

### Why is it Used?
Traditional academic management systems only compute basic averages ($\mu$) and generate grade cards. They fail to address critical pedagogical questions:
- *Does self-study time actually have a strong, statistically significant association with exam marks?*
- *What is the empirical impact of the institutional 75% attendance rule on student performance?*
- *At what point do study habits show diminishing or accelerating returns across stratified student cohorts?*

StudyMetrics answers these questions with **inferential statistics** (Pearson/Spearman correlations, Ordinary Least Squares regression, Tukey Box Plots, One-Way ANOVA, and effect sizes) rather than guesswork.

> **⚖️ Research Integrity & Ethical Safeguard**: StudyMetrics enforces observational non-causal modeling. High study time correlates with performance, but observational data does not prove sole causation due to unmeasured factors (prior preparation, intrinsic motivation). The system evaluates systemic distributions and cohort policies **without ranking or shaming individual students**.

---

## 🧱 2. Technology Stack

| Architecture Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons | Research Command Center, custom interactive SVG data visualizations (no heavy external chart bloat). |
| **Client State & Routing** | React Router v6, TanStack React Query v5 | Route-based navigation, search parameters, server state caching, and optimistic updates. |
| **Backend REST API** | Python 3.12, FastAPI, Pydantic v2 | High-performance asynchronous REST endpoints, validation, and session caching. |
| **Analytics Engine** | Pandas, NumPy, SciPy, Statsmodels | Numerical computation: EDA dispersion, OLS regression, ANOVA $F$-test, Welch's $t$-test, Tukey HSD contrasts. |
| **Database** | MongoDB Atlas, Motor / PyMongo (AsyncMongoClient) | Cloud document store for datasets, cleaning audit histories, and cached analysis sessions. |
| **Report Generation** | ReportLab (PDF), OpenPyXL (Excel Workbooks) | Server-side automated compilation of multi-page academic PDF papers and multi-sheet Excel workbooks. |
| **Testing Suite** | Pytest, AnyIO, HTTPX | Automated unit tests, mathematical formula verifications, and API integration tests. |

---

## 🔬 3. Core Research Modules

```mermaid
flowchart LR
    A["1. Dataset Manager<br/>(CSV / Excel Ingestion)"] --> B["2. Data Quality & Audit<br/>(Deduplication & Hygiene)"]
    B --> C["3. Descriptive EDA<br/>(Histograms & Tukey Boxplots)"]
    C --> D["4. Study-Time Analysis<br/>(OLS Regression & Scatter)"]
    C --> E["5. Attendance Analysis<br/>(75% Regulatory Threshold)"]
    D & E --> F["6. Group ANOVA<br/>(Cohort Effect Size η² & Contrasts)"]
    F --> G["7. Research Reports<br/>(Publication PDF & Excel Workbooks)"]
```

1. **Research Command Center (`/dashboard`)**:
   - Executive statistical dashboard with instant research KPIs ($r = 0.786$, Attendance $r = 0.330$, ANOVA $\eta^2 = 0.512$).
   - Visual cohort progression bars, attendance tier breakdown, and dual frequency histograms.
2. **Dataset Manager (`/datasets`)**:
   - Drag-and-drop CSV / Excel upload with automatic SHA-256 cryptographic checksum calculation.
   - Private institutional storage isolating dataset records.
3. **Data Quality & Cleaning Audit (`/data-quality`)**:
   - Validates ranges (Study hours: $0-24$, Attendance: $0-100\%$, Scores: $0-100$).
   - One-click cleaning pipeline with row delta tracking and version-controlled audit logs (`v1.0 Raw` $\rightarrow$ `v2.0 Cleaned`).
4. **Exploratory Data Analysis (`/eda`)**:
   - Parametric and non-parametric dispersion tables ($N$, $\mu$, $\sigma$, Median, $\text{IQR}$, Min, Max, Skewness).
   - 4 Interactive Visualizer Modes: *Frequency Histograms*, *Tukey Box Plots*, *Cumulative Distribution Functions (CDF)*, and *Binned Frequency Tables*.
5. **Study-Time & Assessment Analysis (`/study-time`)**:
   - Interactive SVG scatter plot with hover tooltips displaying individual student coordinates.
   - Fitted Ordinary Least Squares (OLS) regression trendline ($\hat{Y} = \beta_0 + \beta_1 X$) and variance card ($R^2 = 0.617$).
   - Dynamic outcome variable selector (`exam_score`, `assignment_score`, `internal_score`).
6. **Classroom Attendance & Regulatory Threshold (`/attendance`)**:
   - Evaluates the mandatory **75% Institutional Attendance Threshold** with a vertical reference line and shaded shortage warning zone.
   - Compares performance between Eligible Cohort ($\ge 75\%$, Mean $80.25$) and Shortage Cohort ($< 75\%$, Mean $74.54$), establishing a $+5.71$ mark compliance advantage.
7. **Study-Hour Group Comparisons (`/group-comparison`)**:
   - Interactive Tukey Box Plot comparing Low ($<2.5$h), Medium ($2.5-5$h), and High ($>5$h) study cohorts with $95\%$ Confidence Interval error bars.
   - Inferential One-Way ANOVA ($F = 103.55, p < 0.001$, $\eta^2 = 0.512$).
   - Post-Hoc Pairwise Contrasts with Cohen's $d$ effect sizes (High vs Low: $+21.36$ marks, $d = 2.48$).
8. **Statistical Results Matrix (`/statistical-results`)**:
   - Cross-variable correlation heatmap and formal hypothesis test summary.
9. **Automated Research Reports (`/reports`)**:
   - One-click export of publication-grade **PDF Reports** (executive summary, tables, methodology, ethical disclosures) and formatted **Excel Workbooks**.

---

## 🚀 4. How to Run the Project (Step-by-Step Guide)

### Prerequisites:
- **Python**: 3.12 or newer
- **Node.js**: v18 or newer (with `npm`)
- **Git**

---

### Step 1: Open Two Terminal Windows
Because StudyMetrics consists of a FastAPI backend and a React/Vite frontend, you need two terminals running simultaneously.

---

### Terminal 1: Backend Setup & Server Start (Port 8001)

1. Navigate to the backend directory:
   ```powershell
   cd d:\gokul\collage-python-project\StudyMetrics\backend
   ```
2. *(Optional)* Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install the required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```
4. Verify environment configuration (`backend\.env`):
   - The `.env` file is pre-configured with MongoDB Atlas and the standard settings:
     ```env
     APP_ENV=development
     API_V1_PREFIX=/api/v1
     MONGODB_URI=mongodb+srv://user_gokul:Lfg0bsxrzs3njKeA@cluster0.uurxkmz.mongodb.net/?retryWrites=true&w=majority
     MONGODB_DATABASE=StudyMetrics
     MONGODB_COLLECTION=StudyMetrics
     UPLOAD_DIR=./storage/uploads
     MAX_UPLOAD_MB=20
     ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
     ```
5. Start the FastAPI server on port **8001**:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8001
   ```
   - **Backend API**: `http://localhost:8001/api/v1`
   - **Interactive Swagger Docs**: `http://localhost:8001/docs`
   - **Health Check**: `http://localhost:8001/api/v1/health`

---

### Terminal 2: Frontend Setup & Dev Server Start (Port 5174 / 5173)

1. Navigate to the frontend directory:
   ```powershell
   cd d:\gokul\collage-python-project\StudyMetrics\frontend
   ```
2. Install frontend dependencies (if not already installed):
   ```powershell
   npm install
   ```
3. Verify frontend environment configuration (`frontend\.env`):
   - Confirms API proxy target:
     ```env
     VITE_API_BASE_URL=http://localhost:8001/api/v1
     ```
4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
5. Open your web browser and navigate to the printed URL:
   - **Web Application URL**: **`http://localhost:5174`** (or `http://localhost:5173`)

---

## 📂 5. Included Research Datasets

Pre-built benchmark datasets are located in the [`sample_datasets/`](file:///d:/gokul/collage-python-project/StudyMetrics/sample_datasets/) directory for immediate testing:

| Dataset File | Sample Size ($n$) | Department / Scenario | Distinctive Statistical Pattern |
| :--- | :---: | :--- | :--- |
| `dataset_1_cs_engineering.csv` | 250 | Computer Science & Engineering | High daily study hours (mean $4.8$h), strong linear correlation ($r \approx 0.82$), high exam scores (mean $83.2$). |
| `dataset_2_management_business.csv` | 180 | Management & Business Studies | Moderate study hours ($3.3$h), high classroom engagement dependence ($r \approx 0.65$ with attendance), clustered score distribution. |
| `dataset_3_freshman_remedial.csv` | 220 | Freshman Foundation / Remedial | High attendance shortage ($59.5\%$ below 75%), wide variance, ideal for testing condonation alerts and ANOVA group differences. |

### How to Load a Dataset:
1. Open the web app at `http://localhost:5174`.
2. Navigate to **Dataset Manager** in the left sidebar.
3. Click or drag any CSV file from `sample_datasets/` into the upload dropzone.
4. The system validates the file, generates cryptographic checksums, and activates the dataset across all 9 analysis modules!

---

## 🧪 6. Testing & Build Verification

To verify that all algorithms, statistical functions, and frontend components compile with zero errors:

### Run Backend Statistical Tests:
```powershell
cd backend
python -m pytest tests/test_analytics.py
```
*(Expected: 5 passed in ~2.5s)*

### Run Frontend Production Build:
```powershell
cd frontend
npm run build
```
*(Expected: `tsc && vite build` completes with code 0)*

---

## 📁 7. Repository Structure

```text
StudyMetrics/
|-- backend/
|   |-- app/
|   |   |-- main.py                    # FastAPI application setup & lifespan
|   |   |-- core/                      # MongoDB async connection & configurations
|   |   |-- api/v1/                    # Endpoints (datasets, analysis, sessions, reports)
|   |   |-- schemas/                   # Pydantic data schemas & response models
|   |   |-- repositories/              # MongoDB Atlas query layer
|   |   |-- services/                  # Workflow orchestration & file handling
|   |   |-- analytics/                 # Pure statistical engine (EDA, correlation, ANOVA)
|   |   |-- reporting/                 # Automated PDF (ReportLab) & Excel (OpenPyXL)
|   |   `-- utils/                     # Helpers & cryptographic checksums
|   |-- tests/                         # Pytest test cases
|   |-- storage/uploads/               # Private dataset storage
|   |-- requirements.txt               # Backend dependencies
|   `-- .env                           # Backend environment variables
|
|-- frontend/
|   |-- src/
|   |   |-- app/                       # App root & providers
|   |   |-- components/layout/         # Navbar, Sidebar, Footer, AppLayout
|   |   |-- pages/                     # Routed pages (Dashboard, Datasets, EDA, etc.)
|   |   |-- routes/                    # React Router configuration
|   |   |-- services/api/              # Axios REST client
|   |   |-- types/                     # TypeScript interface definitions
|   |   `-- index.css                  # Global Tailwind CSS styles
|   |-- package.json                   # Frontend dependencies
|   |-- vite.config.ts                 # Vite bundler configuration
|   `-- .env                           # Frontend environment variables
|
|-- sample_datasets/                   # 3 pre-packaged realistic research CSV datasets
|-- README.md                          # Comprehensive project documentation
`-- clear_db.py                        # Database reset utility
```

---

## 🎓 8. Quick Summary for College Viva & Presentations

> *"StudyMetrics is an institutional research analytics platform that models the statistical association between student study investments, classroom attendance compliance, and academic assessment outcomes. Built using FastAPI, React 19, and MongoDB, it replaces speculative grading with inferential statistics (OLS regression, ANOVA, and effect sizes) and automates publication-ready PDF and Excel research reports with strict non-causal observational research ethics."*
