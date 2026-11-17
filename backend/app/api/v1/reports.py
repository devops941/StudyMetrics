from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import io
from app.repositories.session_repository import SessionRepository
from app.repositories.dataset_repository import DatasetRepository
from app.services.dataset_service import parse_dataset_file
from app.analytics.correlation import compute_correlation
from app.analytics.group_tests import compute_group_comparison
from app.reporting.pdf_report import generate_pdf_report
from app.reporting.excel_report import generate_excel_report

router = APIRouter(prefix="/reports", tags=["Reports"])
session_repo = SessionRepository()
dataset_repo = DatasetRepository()

async def get_or_compute_session_results(session_id: str, session: dict):
    """
    Retrieves results for the session. If empty and a dataset is linked,
    auto-computes core correlation and group comparison findings and stores them.
    """
    results = await session_repo.get_results_for_session(session_id)
    dataset_id = session.get("dataset_id")
    if not results and dataset_id:
        latest_ver = await dataset_repo.get_latest_version(dataset_id)
        storage_key = None
        if latest_ver:
            storage_key = latest_ver["storage_key"]
        else:
            dataset_doc = await dataset_repo.get_dataset(dataset_id)
            if dataset_doc:
                storage_key = dataset_doc["storage_key"]

        if storage_key:
            df = parse_dataset_file(storage_key)
            # 1. Study Hours vs Exam Score correlation
            if "study_hours_daily" in df.columns and "exam_score" in df.columns:
                corr_res = compute_correlation(df, "study_hours_daily", "exam_score", method="pearson")
                await session_repo.save_result(
                    session_id=session_id,
                    analysis_type="correlation",
                    parameters={"method": "pearson", "x_column": "study_hours_daily", "y_column": "exam_score"},
                    result=corr_res
                )
            # 2. Attendance % vs Exam Score correlation
            if "attendance_pct" in df.columns and "exam_score" in df.columns:
                att_res = compute_correlation(df, "attendance_pct", "exam_score", method="pearson")
                await session_repo.save_result(
                    session_id=session_id,
                    analysis_type="correlation",
                    parameters={"method": "pearson", "x_column": "attendance_pct", "y_column": "exam_score"},
                    result=att_res
                )
            # 3. Study Hours Group Comparison ANOVA
            if "study_hours_daily" in df.columns and "exam_score" in df.columns:
                group_res = compute_group_comparison(
                    df,
                    group_col="study_hours_daily",
                    target_col="exam_score",
                    bins=[0.0, 2.5, 5.0, 24.0],
                    bin_labels=["Low (<2.5h)", "Medium (2.5-5h)", "High (>5h)"],
                    test_type="auto"
                )
                await session_repo.save_result(
                    session_id=session_id,
                    analysis_type="group_comparison",
                    parameters={"group_column": "study_hours_daily", "target_column": "exam_score"},
                    result=group_res
                )
            results = await session_repo.get_results_for_session(session_id)
    return results

@router.post("/{session_id}/pdf")
async def generate_pdf(session_id: str):
    """Generates a publication-ready PDF research report."""
    session = await session_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    results = await get_or_compute_session_results(session_id, session)
    pdf_bytes = generate_pdf_report(session, results)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=StudyMetrics_Report_{session_id}.pdf"}
    )

@router.post("/{session_id}/excel")
async def generate_excel(session_id: str):
    """Generates a multi-sheet research Excel workbook."""
    session = await session_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    results = await get_or_compute_session_results(session_id, session)

    cleaned_df = None
    if session.get("dataset_id"):
        latest_ver = await dataset_repo.get_latest_version(session["dataset_id"])
        if latest_ver:
            cleaned_df = parse_dataset_file(latest_ver["storage_key"])
        else:
            dataset_doc = await dataset_repo.get_dataset(session["dataset_id"])
            if dataset_doc:
                cleaned_df = parse_dataset_file(dataset_doc["storage_key"])

    excel_bytes = generate_excel_report(session, results, cleaned_df=cleaned_df)

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=StudyMetrics_Data_{session_id}.xlsx"}
    )
