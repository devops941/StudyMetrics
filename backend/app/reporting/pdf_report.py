import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(session_data: Dict[str, Any], results: List[Dict[str, Any]]) -> bytes:
    """
    Generates a formal educational research report in PDF format using ReportLab.
    Adheres strictly to research reporting rules and ethical caveats.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#065F46"),
        alignment=0,
        spaceAfter=10
    )
    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Heading1"],
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=14,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )
    callout_style = ParagraphStyle(
        "Callout",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E3A8A"),
        backColor=colors.HexColor("#EFF6FF"),
        borderColor=colors.HexColor("#93C5FD"),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=8,
        spaceAfter=8
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("StudyMetrics: Student Study-Time & Assessment Research Report", title_style))
    elements.append(Paragraph(f"<b>Session:</b> {session_data.get('title', 'Empirical Study')} | <b>Generated:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", body_style))
    elements.append(Spacer(1, 10))

    # Ethical Safeguards Notice
    elements.append(Paragraph(
        "<b>RESEARCH INTEGRITY & CAUSALITY NOTICE:</b> This research report evaluates statistical associations from observational data. "
        "Reported metrics indicate mathematical correlation and group variance, <i>not causation</i>. Findings should not be used to label or rank individual students.",
        callout_style
    ))
    elements.append(Spacer(1, 10))

    # 1. Dataset & Scope
    elements.append(Paragraph("1. Research Scope and Dataset Overview", h1_style))
    scope_text = (
        "This study investigates whether average daily study time (hours) and classroom attendance percentage "
        "exhibit statistically significant associations with student assessment performance. Data preprocessing rules "
        "enforced pseudonymization, range validation [0-24 hrs study, 0-100% attendance], and strict avoidance of zero-imputation for missing values."
    )
    elements.append(Paragraph(scope_text, body_style))
    elements.append(Spacer(1, 10))

    # 2. Results Section
    elements.append(Paragraph("2. Statistical Results Summary", h1_style))

    if not results:
        elements.append(Paragraph("No analysis outputs recorded for this session yet.", body_style))
    else:
        summary_rows = [["Analysis Type", "Parameters / Method", "Key Metric", "p-value", "Significance"]]
        for r in results:
            a_type = r.get("analysis_type", "").capitalize()
            res_obj = r.get("result", {})
            params = r.get("parameters", {})

            if a_type == "Correlation":
                param_str = f"{params.get('method', 'Pearson').title()} ({params.get('x_column')} vs {params.get('y_column')})"
                metric_str = f"r = {res_obj.get('estimate', 'N/A')}"
                p_val = res_obj.get("p_value", 1.0)
                p_str = f"p = {p_val}" if p_val >= 0.001 else "p < 0.001"
                sig_str = "Significant" if res_obj.get("is_statistically_significant") else "Not Significant"
            elif a_type == "Group_comparison":
                param_str = f"{res_obj.get('test_name', 'Group Test')}"
                metric_str = f"stat = {res_obj.get('test_statistic', 'N/A')}"
                p_val = res_obj.get("p_value", 1.0)
                p_str = f"p = {p_val}" if p_val >= 0.001 else "p < 0.001"
                sig_str = "Significant" if res_obj.get("is_significant") else "Not Significant"
            else:
                param_str = str(params)
                metric_str = "Calculated"
                p_str = "-"
                sig_str = "-"

            summary_rows.append([a_type, param_str, metric_str, p_str, sig_str])

        table = Table(summary_rows, colWidths=[90, 180, 100, 70, 90])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#065F46")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(table)

    elements.append(Spacer(1, 15))

    # 3. Limitations & Ethics
    elements.append(Paragraph("3. Research Limitations and Recommendations", h1_style))
    limitations = (
        "• <b>Confounding Factors:</b> Study-hours and attendance reflect self-regulation or motivation, which are not directly measured.<br/>"
        "• <b>Non-Linearity:</b> Diminishing returns may exist at higher hours of daily study.<br/>"
        "• <b>Data Hygiene:</b> All findings reflect cleaned records excluding range anomalies and verified against duplicate student identifiers."
    )
    elements.append(Paragraph(limitations, body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
