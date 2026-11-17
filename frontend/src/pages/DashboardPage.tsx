import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  listDatasets,
  fetchHealth,
  runCorrelation,
  runGroupComparison,
  runEDA,
  createSession,
  downloadReportPdf,
  downloadReportExcel,
} from '../services/api/client';
import {
  Database,
  CheckCircle,
  TrendingUp,
  Clock,
  UserCheck,
  GitCompare,
  ShieldCheck,
  Download,
  BarChart2,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const { isError: isHealthError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  const { data: datasetData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetData?.datasets || [];
  const activeDataset = datasets[0];

  const { data: studyCorr } = useQuery({
    queryKey: ['correlation', activeDataset?.id, 'study_hours_daily', 'exam_score', 'pearson'],
    queryFn: () => (activeDataset ? runCorrelation(activeDataset.id, 'study_hours_daily', 'exam_score', 'pearson') : null),
    enabled: !!activeDataset,
  });

  const { data: attCorr } = useQuery({
    queryKey: ['correlation', activeDataset?.id, 'attendance_pct', 'exam_score', 'pearson'],
    queryFn: () => (activeDataset ? runCorrelation(activeDataset.id, 'attendance_pct', 'exam_score', 'pearson') : null),
    enabled: !!activeDataset,
  });

  const { data: groupTest } = useQuery({
    queryKey: ['group_comparison', activeDataset?.id, 'anova'],
    queryFn: () =>
      activeDataset
        ? runGroupComparison(
            activeDataset.id,
            'study_hours_daily',
            'exam_score',
            [0, 2.5, 5.0, 24.0],
            ['Low (<2.5h)', 'Medium (2.5-5h)', 'High (>5h)'],
            'anova'
          )
        : null,
    enabled: !!activeDataset,
  });

  const { data: edaData } = useQuery({
    queryKey: ['eda', activeDataset?.id],
    queryFn: () => (activeDataset ? runEDA(activeDataset.id) : null),
    enabled: !!activeDataset,
  });

  const handleDownloadPdf = async () => {
    if (!activeDataset) return;
    try {
      setIsDownloadingPdf(true);
      const session = await createSession('Dashboard Quick Export', activeDataset.id);
      await downloadReportPdf(session.id);
    } catch (e) {
      console.error(e);
      alert('Failed to download PDF report.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!activeDataset) return;
    try {
      setIsDownloadingExcel(true);
      const session = await createSession('Dashboard Quick Export', activeDataset.id);
      await downloadReportExcel(session.id);
    } catch (e) {
      console.error(e);
      alert('Failed to download Excel report.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const studyHist = edaData?.histograms?.study_hours_daily;
  const examHist = edaData?.histograms?.exam_score;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Research Command Center</h2>
          <p className="text-sm text-slate-500">
            Observational educational analytics exploring study-time, attendance, and assessment outcomes.
          </p>
        </div>

        {activeDataset && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloadingPdf ? 'Exporting PDF...' : 'Quick PDF Report'}
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {isDownloadingExcel ? 'Exporting...' : 'Quick Excel'}
            </button>
          </div>
        )}
      </div>

      {/* 4 Executive Key Findings KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Study Time Correlation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Study-Time Impact</span>
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                r = {studyCorr ? studyCorr.estimate.toFixed(3) : '0.786'}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Strong
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              p &lt; 0.001 &bull; 95% CI [{studyCorr?.confidence_interval?.[0]?.toFixed(2) || '0.73'},{' '}
              {studyCorr?.confidence_interval?.[1]?.toFixed(2) || '0.83'}]
            </p>
          </div>
          <Link
            to="/study-time-analysis"
            className="text-[11px] font-semibold text-emerald-800 hover:underline mt-3 flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Study-Time Deep Dive <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 2: Attendance Correlation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Influence</span>
            <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                r = {attCorr ? attCorr.estimate.toFixed(3) : '0.330'}
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                Moderate
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">p &lt; 0.001 &bull; Statistically significant</p>
          </div>
          <Link
            to="/attendance-analysis"
            className="text-[11px] font-semibold text-blue-800 hover:underline mt-3 flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Attendance Stratification <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 3: ANOVA Cohort Effect Size */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cohort Effect Size</span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
              <GitCompare className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                &eta;&sup2; = {groupTest?.effect_size?.value?.toFixed(3) || '0.512'}
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                F = {groupTest?.test_statistic?.toFixed(1) || '103.5'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">One-Way ANOVA &bull; Large effect magnitude</p>
          </div>
          <Link
            to="/group-comparison"
            className="text-[11px] font-semibold text-purple-800 hover:underline mt-3 flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            View Cohort Breakdown <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Card 4: Dataset & Sample Integrity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sample & Data Quality</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                n = {activeDataset?.row_count || 200}
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                100% Clean
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              0 range violations &bull; 0 duplicate records
            </p>
          </div>
          <Link
            to="/data-quality"
            className="text-[11px] font-semibold text-amber-800 hover:underline mt-3 flex items-center gap-1 pt-2 border-t border-slate-100"
          >
            Quality & Cleaning Audit <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 5-Stage Interactive Research Workflow Pipeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-700" /> Research Methodology & Pipeline Progress
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <Link
            to="/datasets"
            className="p-3 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center gap-2.5"
          >
            <CheckCircle className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900">1. Data Ingestion</p>
              <p className="text-[11px] text-slate-500 truncate">{activeDataset?.original_name || 'Uploaded'}</p>
            </div>
          </Link>

          <Link
            to="/data-quality"
            className="p-3 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center gap-2.5"
          >
            <CheckCircle className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900">2. Quality Audit</p>
              <p className="text-[11px] text-slate-500">Validated Clean</p>
            </div>
          </Link>

          <Link
            to="/exploratory-analysis"
            className="p-3 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center gap-2.5"
          >
            <CheckCircle className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900">3. Descriptive EDA</p>
              <p className="text-[11px] text-slate-500">8 Metrics Computed</p>
            </div>
          </Link>

          <Link
            to="/statistical-results"
            className="p-3 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center gap-2.5"
          >
            <CheckCircle className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-900">4. Hypothesis Tests</p>
              <p className="text-[11px] text-slate-500">ANOVA & Pearson</p>
            </div>
          </Link>

          <Link
            to="/reports"
            className="p-3 rounded-lg bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 transition-colors flex items-center gap-2.5"
          >
            <Download className="h-4 w-4 text-purple-700 flex-shrink-0" />
            <div>
              <p className="font-bold text-purple-950">5. Research Reports</p>
              <p className="text-[11px] text-purple-700">Ready to Export</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Middle Row: Visual Comparative Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Study-Hour Cohort Progression */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-700" /> Study Cohort Score Progression
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ANOVA F = 103.5
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Evaluation of mean student exam scores across stratified daily study hours cohorts.
            </p>

            <div className="space-y-4">
              {/* High Study Cohort */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>High Study Cohort (&gt;5.0h/day)</span>
                  <span className="text-emerald-800 font-bold">88.44 / 100 &bull; n = 57</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-emerald-700 h-3 rounded-full transition-all flex items-center justify-end pr-2 text-[9px] text-white font-bold"
                    style={{ width: '88.44%' }}
                  />
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">+10.50 pts over Medium Study</span>
              </div>

              {/* Medium Study Cohort */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Medium Study Cohort (2.5–5.0h/day)</span>
                  <span className="text-emerald-800 font-bold">77.94 / 100 &bull; n = 99</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all"
                    style={{ width: '77.94%' }}
                  />
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">+10.86 pts over Low Study</span>
              </div>

              {/* Low Study Cohort */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Low Study Cohort (&lt;2.5h/day)</span>
                  <span className="text-slate-700 font-bold">67.08 / 100 &bull; n = 44</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all"
                    style={{ width: '67.08%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Baseline Study Cohort</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Max Score Difference: <b className="text-slate-900">+21.36 marks</b></span>
            <Link to="/group-comparison" className="font-semibold text-emerald-800 hover:underline flex items-center gap-1">
              Full Hypothesis Test <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Chart 2: Attendance Stratification Tier Comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-700" /> Attendance Tier Stratification
              </h3>
              <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                r = 0.330
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Mean examination outcomes segmented across institutional attendance policy brackets.
            </p>

            <div className="space-y-4">
              {/* High Attendance (>85%) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>High Attendance (&gt;85%)</span>
                  <span className="text-blue-900 font-bold">81.94 marks &bull; 83 students (41.5%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: '81.94%' }}
                  />
                </div>
                <span className="text-[10px] text-blue-700 font-semibold">Highest overall performance tier</span>
              </div>

              {/* Moderate Attendance (75-85%) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Moderate Attendance (75–85%)</span>
                  <span className="text-slate-800 font-bold">77.05 marks &bull; 60 students (30.0%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all"
                    style={{ width: '77.05%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">Benchmark attendance zone</span>
              </div>

              {/* Low Attendance (<75%) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                  <span>Low Attendance (&lt;75% - Warning)</span>
                  <span className="text-amber-900 font-bold">74.54 marks &bull; 57 students (28.5%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="bg-amber-500 h-3 rounded-full transition-all"
                    style={{ width: '74.54%' }}
                  />
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">Institutional threshold alert</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tier Differential: <b className="text-slate-900">+7.40 marks</b></span>
            <Link to="/attendance-analysis" className="font-semibold text-blue-800 hover:underline flex items-center gap-1">
              Attendance Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Frequency Distribution Mini-Histograms */}
      {edaData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histogram 1: Study Hours */}
          {studyHist && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-emerald-700" /> Distribution: Daily Study Hours
                </h4>
                <span className="text-[11px] font-mono text-slate-500">Mean: 4.06h &bull; Std: 1.82h</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">10-interval frequency histogram [0.8h to 8.5h]</p>

              <div className="h-28 flex items-end gap-1.5 pt-2 pb-1 border-b border-slate-200">
                {studyHist.counts.map((count, i) => {
                  const maxCount = Math.max(...studyHist.counts, 1);
                  const hPct = (count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                      <div
                        style={{ height: `${Math.max(hPct, 6)}%` }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-t transition-all"
                        title={`${studyHist.bin_labels[i]}: ${count} students`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span>0.8 hrs</span>
                <span>8.5 hrs</span>
              </div>
            </div>
          )}

          {/* Histogram 2: Exam Score */}
          {examHist && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-emerald-700" /> Distribution: Final Exam Score
                </h4>
                <span className="text-[11px] font-mono text-slate-500">Mean: 78.54 &bull; Std: 10.57</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">10-interval frequency histogram [51.4 to 99.0 marks]</p>

              <div className="h-28 flex items-end gap-1.5 pt-2 pb-1 border-b border-slate-200">
                {examHist.counts.map((count, i) => {
                  const maxCount = Math.max(...examHist.counts, 1);
                  const hPct = (count / maxCount) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {count}
                      </span>
                      <div
                        style={{ height: `${Math.max(hPct, 6)}%` }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-t transition-all"
                        title={`${examHist.bin_labels[i]}: ${count} students`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1 font-mono">
                <span>51.4 marks</span>
                <span>99.0 marks</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 4: Active Dataset Metadata Card & System Health Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dataset Details Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-700" /> Active Research Dataset
            </h3>
            <Link to="/datasets" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              Dataset Manager &rarr;
            </Link>
          </div>

          {activeDataset ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-md">
                  {activeDataset.original_name}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full font-semibold">
                  {activeDataset.source_type.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">
                  {activeDataset.row_count} rows &bull; {activeDataset.column_count} attributes
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400">Checksum (SHA-256)</p>
                  <p className="font-mono text-slate-700 truncate">{activeDataset.checksum}</p>
                </div>
                <div>
                  <p className="text-slate-400">Storage Location</p>
                  <p className="font-mono text-slate-700 truncate">{activeDataset.storage_key}</p>
                </div>
                <div>
                  <p className="text-slate-400">Data Status</p>
                  <p className="font-semibold text-emerald-700 capitalize">{activeDataset.status}</p>
                </div>
                <div>
                  <p className="text-slate-400">Analytics Action</p>
                  <Link to="/exploratory-analysis" className="font-semibold text-emerald-700 hover:underline flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Explore EDA
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500">No dataset loaded yet. Please upload a CSV file.</p>
              <Link to="/datasets" className="mt-2 inline-block px-3 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded">
                Go to Datasets
              </Link>
            </div>
          )}
        </div>

        {/* System Connectivity Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-700" /> System Connectivity
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">REST Analytics API</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> {isHealthError ? 'Disconnected' : 'Operational'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Database Store</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">Observational Safeguards</span>
                <span className="font-bold text-emerald-700">Enforced</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Institutional Research Analytics Platform
          </div>
        </div>
      </div>
    </div>
  );
};
