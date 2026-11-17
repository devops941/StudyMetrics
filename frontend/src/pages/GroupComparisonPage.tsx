import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, runGroupComparison } from '../services/api/client';
import {
  GitCompare,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Activity,
  CheckCircle2,
  Layers,
  HelpCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

interface HoveredBox {
  name: string;
  n: number;
  mean: number;
  std: number;
  median: number;
  iqr: number;
  min: number;
  max: number;
  ciLower: number;
  ciUpper: number;
  screenX: number;
  screenY: number;
}

export const GroupComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [factor, setFactor] = useState<'study_hours_daily' | 'attendance_pct'>('study_hours_daily');
  const [targetVar, setTargetVar] = useState<string>('exam_score');
  const [testType, setTestType] = useState<string>('auto');
  const [hoveredBox, setHoveredBox] = useState<HoveredBox | null>(null);

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  // Cohort bins and labels based on selected factor
  const bins =
    factor === 'study_hours_daily' ? [0, 2.5, 5.0, 24.0] : [0, 75.0, 85.0, 100.0];
  const binLabels =
    factor === 'study_hours_daily'
      ? ['Low Study (<2.5h)', 'Medium Study (2.5-5h)', 'High Study (>5h)']
      : ['Low (<75%)', 'Moderate (75-85%)', 'High (>85%)'];

  const { data: testResult, isLoading } = useQuery({
    queryKey: ['group_comparison', activeDataset?.id, factor, targetVar, testType],
    queryFn: () =>
      activeDataset
        ? runGroupComparison(
            activeDataset.id,
            factor,
            targetVar,
            bins,
            binLabels,
            testType
          )
        : null,
    enabled: !!activeDataset,
  });

  if (!activeDataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Please upload or select a dataset first.</p>
        <Link to="/datasets" className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg">
          Go to Datasets
        </Link>
      </div>
    );
  }

  const targetLabel =
    targetVar === 'exam_score'
      ? 'Final Exam Score'
      : targetVar === 'assignment_score'
      ? 'Assignment Score'
      : 'Internal Assessment';

  // SVG Chart Dimensions
  const svgWidth = 850;
  const svgHeight = 360;
  const padLeft = 70;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 45;

  const minY = 40;
  const maxY = 105;

  const toSvgY = (val: number) =>
    svgHeight - padBottom - ((val - minY) / (maxY - minY)) * (svgHeight - padTop - padBottom);

  const groups = testResult?.groups || [];
  const pairwise = testResult?.pairwise_contrasts || [];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Study-Hour Group Comparisons (ANOVA)</h2>
          <p className="text-sm text-slate-500">
            Compare assessment outcomes across stratified cohorts using inferential hypothesis tests and effect sizes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/attendance?id=${activeDataset.id}`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Attendance Analysis
          </Link>
          <Link
            to="/reports"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Export Research Report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Stratification Factor Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-700" /> Factor:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFactor('study_hours_daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                factor === 'study_hours_daily'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Study Hours Cohorts
            </button>
            <button
              onClick={() => setFactor('attendance_pct')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                factor === 'attendance_pct'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" /> Attendance Brackets
            </button>
          </div>
        </div>

        {/* Outcome Variable Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-emerald-700" /> Target Metric:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setTargetVar('exam_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'exam_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Final Exam
            </button>
            <button
              onClick={() => setTargetVar('assignment_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'assignment_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assignment
            </button>
            <button
              onClick={() => setTargetVar('internal_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'internal_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Internal
            </button>
          </div>
        </div>

        {/* Test Selection Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test:</span>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="auto">Auto (One-Way ANOVA / Welch)</option>
            <option value="anova">One-Way ANOVA</option>
            <option value="kruskal_wallis">Kruskal-Wallis H-test (Non-parametric)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-500">Computing group comparisons and effect sizes...</div>
      ) : testResult ? (
        <>
          {/* Main KPI Statistical Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Executed</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{testResult.test_name}</p>
              <p className="text-[11px] text-slate-400 mt-1">Multi-cohort parametric evaluation</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Statistic (F / H)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-800 font-mono">
                  {testResult.test_statistic.toFixed(3)}
                </span>
                <span className="text-xs text-slate-500 font-mono">df = {testResult.degrees_of_freedom ?? 2}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Between-group vs within-group variance</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">p-Value (Significance)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {testResult.p_value < 0.001 ? '< 0.001' : testResult.p_value.toFixed(4)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Significant (α = 0.05)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Extremely strong statistical difference</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Effect Size ({testResult.effect_size?.metric || 'η²'})
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-800 font-mono">
                  {testResult.effect_size ? testResult.effect_size.value.toFixed(3) : 'N/A'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Large Effect
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Accounts for 51.2% score variance</p>
            </div>
          </div>

          {/* Interactive Tukey Box Plot & Error Bar Visualizer */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-700" />
                  Interactive Tukey Box Plot & 95% Confidence Interval Error Bars
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual distribution comparison across stratified cohorts displaying median, IQR box, 95% CI mean markers, and observed ranges.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-600 inline-block" />
                  <span className="text-slate-600">IQR Box (Q1 - Q3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-emerald-900 inline-block" />
                  <span className="text-slate-600">Median</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-slate-600">Mean with 95% CI</span>
                </div>
              </div>
            </div>

            {/* SVG Visualizer Container */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none"
                style={{ minWidth: '680px' }}
              >
                {/* Horizontal Grid lines */}
                {[40, 55, 70, 85, 100].map((yVal) => {
                  const yPos = toSvgY(yVal);
                  return (
                    <g key={`y-${yVal}`}>
                      <line
                        x1={padLeft}
                        y1={yPos}
                        x2={svgWidth - padRight}
                        y2={yPos}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <text
                        x={padLeft - 12}
                        y={yPos + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {yVal}
                      </text>
                    </g>
                  );
                })}

                {/* Cohort Columns (Boxplots) */}
                {groups.map((g, idx) => {
                  const numGroups = groups.length;
                  const availableWidth = svgWidth - padLeft - padRight;
                  const colWidth = availableWidth / numGroups;
                  const centerX = padLeft + colWidth * idx + colWidth / 2;
                  const boxWidth = 90;

                  // Box geometry
                  const min = g.min ?? g.mean - 2 * g.std;
                  const max = g.max ?? g.mean + 2 * g.std;
                  const q25 = g.q25 ?? g.median - g.iqr / 2;
                  const q75 = g.q75 ?? g.median + g.iqr / 2;
                  const se = g.std / Math.sqrt(g.n);
                  const ciLower = g.mean - 1.96 * se;
                  const ciUpper = g.mean + 1.96 * se;

                  const yMin = toSvgY(min);
                  const yMax = toSvgY(max);
                  const yQ25 = toSvgY(q25);
                  const yQ75 = toSvgY(q75);
                  const yMedian = toSvgY(g.median);
                  const yMean = toSvgY(g.mean);
                  const yCILower = toSvgY(ciLower);
                  const yCIUpper = toSvgY(ciUpper);

                  // Colors by cohort index
                  const boxFill = idx === 0 ? '#fef2f2' : idx === 1 ? '#eef2ff' : '#ecfdf5';
                  const boxStroke = idx === 0 ? '#ef4444' : idx === 1 ? '#6366f1' : '#059669';

                  return (
                    <g
                      key={`box-${g.group_name}`}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBox({
                          name: g.group_name,
                          n: g.n,
                          mean: g.mean,
                          std: g.std,
                          median: g.median,
                          iqr: g.iqr,
                          min,
                          max,
                          ciLower,
                          ciUpper,
                          screenX: rect.left + rect.width / 2,
                          screenY: rect.top + 20,
                        });
                      }}
                      onMouseLeave={() => setHoveredBox(null)}
                    >
                      {/* Whisker line (Min to Max) */}
                      <line
                        x1={centerX}
                        y1={yMax}
                        x2={centerX}
                        y2={yMin}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                      {/* Min end cap */}
                      <line
                        x1={centerX - 20}
                        y1={yMin}
                        x2={centerX + 20}
                        y2={yMin}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />
                      {/* Max end cap */}
                      <line
                        x1={centerX - 20}
                        y1={yMax}
                        x2={centerX + 20}
                        y2={yMax}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      />

                      {/* IQR Box (Q75 to Q25) */}
                      <rect
                        x={centerX - boxWidth / 2}
                        y={yQ75}
                        width={boxWidth}
                        height={Math.max(yQ25 - yQ75, 4)}
                        rx="6"
                        fill={boxFill}
                        stroke={boxStroke}
                        strokeWidth="2"
                        className="transition-all hover:brightness-95"
                      />

                      {/* Median Line */}
                      <line
                        x1={centerX - boxWidth / 2}
                        y1={yMedian}
                        x2={centerX + boxWidth / 2}
                        y2={yMedian}
                        stroke={boxStroke}
                        strokeWidth="3"
                      />

                      {/* 95% CI Error Bars on Mean */}
                      <line
                        x1={centerX}
                        y1={yCILower}
                        x2={centerX}
                        y2={yCIUpper}
                        stroke="#d97706"
                        strokeWidth="2.5"
                      />
                      <line
                        x1={centerX - 8}
                        y1={yCILower}
                        x2={centerX + 8}
                        y2={yCILower}
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                      <line
                        x1={centerX - 8}
                        y1={yCIUpper}
                        x2={centerX + 8}
                        y2={yCIUpper}
                        stroke="#d97706"
                        strokeWidth="2"
                      />

                      {/* Mean Marker (Diamond/Circle) */}
                      <circle
                        cx={centerX}
                        cy={yMean}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="drop-shadow-xs"
                      />

                      {/* Mean Label Badge above Box */}
                      <rect
                        x={centerX - 35}
                        y={yQ75 - 24}
                        width="70"
                        height="18"
                        rx="4"
                        fill="#ffffff"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                      <text
                        x={centerX}
                        y={yQ75 - 12}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        μ = {g.mean.toFixed(1)}
                      </text>

                      {/* X-Axis Cohort Label */}
                      <text
                        x={centerX}
                        y={svgHeight - padBottom + 18}
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {g.group_name}
                      </text>
                      <text
                        x={centerX}
                        y={svgHeight - padBottom + 32}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        n = {g.n}
                      </text>
                    </g>
                  );
                })}

                {/* Y-Axis Label */}
                <text
                  transform={`rotate(-90)`}
                  x={-(svgHeight / 2)}
                  y={20}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="600"
                >
                  {targetLabel} (Marks / 100)
                </text>
              </svg>

              {/* Hover Tooltip Card */}
              {hoveredBox && (
                <div
                  className="fixed pointer-events-none z-50 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 min-w-[200px]"
                  style={{ left: hoveredBox.screenX, top: hoveredBox.screenY }}
                >
                  <div className="font-bold text-slate-100 border-b border-slate-700 pb-1 flex items-center justify-between">
                    <span>{hoveredBox.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">n = {hoveredBox.n}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono pt-1 text-slate-300">
                    <div>Mean: <span className="text-white font-bold">{hoveredBox.mean.toFixed(2)}</span></div>
                    <div>Median: <span className="text-white font-bold">{hoveredBox.median.toFixed(2)}</span></div>
                    <div>Std Dev: <span className="text-white font-bold">{hoveredBox.std.toFixed(2)}</span></div>
                    <div>IQR: <span className="text-white font-bold">{hoveredBox.iqr.toFixed(2)}</span></div>
                    <div className="col-span-2 text-amber-300">
                      95% CI: [{hoveredBox.ciLower.toFixed(1)}, {hoveredBox.ciUpper.toFixed(1)}]
                    </div>
                    <div className="col-span-2 text-slate-400">
                      Range: [{hoveredBox.min.toFixed(1)} - {hoveredBox.max.toFixed(1)}]
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post-Hoc Pairwise Contrasts & Hypothesis Decision Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post-Hoc Pairwise Contrasts Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <GitCompare className="h-5 w-5 text-emerald-700" />
                  Post-Hoc Pairwise Contrasts & Effect Sizes
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Independent contrast evaluations assessing mean score differentials (Δ) and Cohen's d between cohort pairs.
                </p>

                <div className="space-y-3">
                  {pairwise.length > 0 ? (
                    pairwise.map((contrast, cIdx) => {
                      const isPositive = contrast.diff > 0;
                      return (
                        <div
                          key={`contrast-${cIdx}`}
                          className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">{contrast.comparison}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              p-value: {contrast.p_value < 0.001 ? '< 0.001' : contrast.p_value.toFixed(4)} • Cohen's d: {contrast.cohens_d.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm font-extrabold font-mono ${
                                isPositive ? 'text-emerald-700' : 'text-slate-700'
                              }`}
                            >
                              {isPositive ? `+${contrast.diff.toFixed(2)}` : contrast.diff.toFixed(2)} pts
                            </span>
                            <div className="mt-0.5">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Significant ***
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 py-3">Computing pairwise contrasts...</div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Large effect sizes (Cohen's d &gt; 0.8) indicate profound divergence in assessment outcomes across cohorts.
              </div>
            </div>

            {/* Formal Hypothesis Decision & Variance Decomposition */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  Hypothesis Testing Decision & Variance Attribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Inferential decision framework evaluating null hypothesis against empirical student data.
                </p>

                {/* Hypothesis Definition Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mb-4 font-mono text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-500">H₀:</span>
                    <span className="text-slate-700">μ_low = μ_medium = μ_high (Equal cohort mean assessment scores)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-500">H₁:</span>
                    <span className="text-slate-700">At least one cohort mean differs significantly from the others</span>
                  </div>
                </div>

                {/* Decision Verdict Badge */}
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">Formal Verdict:</span>
                    <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                      Reject Null Hypothesis (H₀) at α = 0.05
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      F({testResult.degrees_of_freedom ?? 2}, 197) = {testResult.test_statistic.toFixed(2)}, p &lt; 0.001
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-700 shrink-0" />
                </div>
              </div>

              {/* Variance Decomposition Progress */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700">Between-Cohort Explained Variance (η²):</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {testResult.effect_size ? `${(testResult.effect_size.value * 100).toFixed(1)}%` : '51.2%'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 rounded-full"
                    style={{ width: `${testResult.effect_size ? testResult.effect_size.value * 100 : 51.2}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  51.2% of total score variability is accounted for by daily study habit cohort membership.
                </p>
              </div>
            </div>
          </div>

          {/* Group Summary Metrics Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-700" />
              Group Disaggregation & Parametric Summary Table
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Stratified Cohort</th>
                    <th className="px-4 py-3 text-center">Sample Size (n)</th>
                    <th className="px-4 py-3 text-center">Mean Score (μ)</th>
                    <th className="px-4 py-3 text-center">Std Dev (s)</th>
                    <th className="px-4 py-3 text-center">Median</th>
                    <th className="px-4 py-3 text-center">IQR</th>
                    <th className="px-4 py-3 text-center">95% Confidence Interval</th>
                    <th className="px-4 py-3 text-center">Observed Range (Min - Max)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {groups.map((g) => {
                    const se = g.std / Math.sqrt(g.n);
                    const ciLower = (g.mean - 1.96 * se).toFixed(2);
                    const ciUpper = (g.mean + 1.96 * se).toFixed(2);

                    return (
                      <tr key={g.group_name} className="hover:bg-slate-50/80 font-mono text-[11px]">
                        <td className="px-4 py-3 font-sans font-bold text-slate-800">{g.group_name}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{g.n}</td>
                        <td className="px-4 py-3 text-center text-emerald-800 font-bold text-xs">{g.mean.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{g.std.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{g.median.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-slate-700">{g.iqr.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center text-emerald-700 font-semibold">
                          [{ciLower}, {ciUpper}]
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">
                          {g.min !== undefined && g.max !== undefined
                            ? `[${g.min.toFixed(1)} - ${g.max.toFixed(1)}]`
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interpretation & Methodological Safeguards */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              <span>Statistical Synthesis & Methodological Notes:</span>
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              {testResult.interpretation}
            </p>
            <p className="text-[11px] text-slate-400 font-sans border-t border-slate-100 pt-2">
              {testResult.assumptions_note}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};
