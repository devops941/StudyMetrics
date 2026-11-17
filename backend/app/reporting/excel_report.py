import io
from typing import Dict, Any, List
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import pandas as pd

def generate_excel_report(session_data: Dict[str, Any], results: List[Dict[str, Any]], cleaned_df: pd.DataFrame = None) -> bytes:
    """
    Generates a multi-sheet formatted Excel workbook using openpyxl.
    Sheets:
    1. Read Me
    2. Data Quality & Settings
    3. Descriptive Stats
    4. Correlations
    5. Group Comparison
    6. Cleaned Data (optional)
    """
    wb = openpyxl.Workbook()
    
    # Styles
    header_fill = PatternFill(start_color="065F46", end_color="065F46", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_font = Font(name="Calibri", size=11, bold=True)
    regular_font = Font(name="Calibri", size=11)
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    def style_header(ws, col_count):
        for col in range(1, col_count + 1):
            cell = ws.cell(row=1, column=col)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_align

    # 1. Read Me
    ws_readme = wb.active
    ws_readme.title = "Read Me"
    ws_readme.views.sheetView[0].showGridLines = True
    readme_content = [
        ["StudyMetrics Research Analysis Workbook"],
        [""],
        ["Session Title", session_data.get("title", "Research Analysis")],
        ["Study Objective", "Investigating study-time and attendance associations with assessment performance"],
        ["Integrity Notice", "Observational statistics do not establish causation. No individual student ranking."],
        ["Study Period", "90 Days standard academic measurement"],
        ["Units", "study_hours_daily (hours/day), attendance_pct (0-100%), exam_score (0-100 scale)"],
    ]
    for row_idx, row in enumerate(readme_content, 1):
        for col_idx, val in enumerate(row, 1):
            cell = ws_readme.cell(row=row_idx, column=col_idx, value=val)
            if row_idx == 1:
                cell.font = Font(name="Calibri", size=14, bold=True, color="065F46")
            elif col_idx == 1:
                cell.font = bold_font

    ws_readme.column_dimensions['A'].width = 22
    ws_readme.column_dimensions['B'].width = 80

    # 2. Correlations Sheet
    ws_corr = wb.create_sheet(title="Correlations")
    ws_corr.views.sheetView[0].showGridLines = True
    corr_headers = ["Method", "X Variable", "Y Variable", "Sample Size (n)", "Estimate (r / rho)", "p-value", "95% CI Lower", "95% CI Upper", "Significant (alpha=0.05)"]
    ws_corr.append(corr_headers)
    style_header(ws_corr, len(corr_headers))

    corr_results = [r for r in results if r.get("analysis_type") == "correlation"]
    for r in corr_results:
        res = r.get("result", {})
        ci = res.get("confidence_interval") or [None, None]
        ws_corr.append([
            res.get("method", "").title(),
            res.get("x", ""),
            res.get("y", ""),
            res.get("n", 0),
            res.get("estimate", 0.0),
            res.get("p_value", 1.0),
            ci[0],
            ci[1],
            "Yes" if res.get("is_statistically_significant") else "No"
        ])
    for col in ws_corr.columns:
        col_letter = col[0].column_letter
        ws_corr.column_dimensions[col_letter].width = 18

    # 3. Group Comparison Sheet
    ws_grp = wb.create_sheet(title="Group Comparison")
    ws_grp.views.sheetView[0].showGridLines = True
    grp_headers = ["Test Name", "Group", "n", "Mean", "Std Dev", "Median", "IQR", "Test Statistic", "p-value", "Significant"]
    ws_grp.append(grp_headers)
    style_header(ws_grp, len(grp_headers))

    grp_results = [r for r in results if r.get("analysis_type") == "group_comparison"]
    for r in grp_results:
        res = r.get("result", {})
        test_name = res.get("test_name", "")
        stat = res.get("test_statistic", 0.0)
        p_val = res.get("p_value", 1.0)
        sig = "Yes" if res.get("is_significant") else "No"
        for g in res.get("groups", []):
            ws_grp.append([
                test_name,
                g.get("group_name"),
                g.get("n"),
                g.get("mean"),
                g.get("std"),
                g.get("median"),
                g.get("iqr"),
                stat,
                p_val,
                sig
            ])
    for col in ws_grp.columns:
        col_letter = col[0].column_letter
        ws_grp.column_dimensions[col_letter].width = 16

    # 4. Cleaned Data Sheet (if provided)
    if cleaned_df is not None and not cleaned_df.empty:
        ws_data = wb.create_sheet(title="Cleaned Data")
        ws_data.views.sheetView[0].showGridLines = True
        ws_data.append(list(cleaned_df.columns))
        style_header(ws_data, len(cleaned_df.columns))
        for row in cleaned_df.itertuples(index=False):
            ws_data.append(list(row))
        for col in ws_data.columns:
            col_letter = col[0].column_letter
            ws_data.column_dimensions[col_letter].width = 16

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
