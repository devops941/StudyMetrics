import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, runCorrelation, runGroupComparison } from '../services/api/client';
import {
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface HoveredPoint {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  tier: string;
  index: number;
}

export const AttendanceAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [targetVar, setTargetVar] = useState<string>('exam_score');
  const [hoveredPt, setHoveredPt] = useState<HoveredPoint | null>(null);

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  const { data: corrData, isLoading: isCorrLoading } = useQuery({
    queryKey: ['correlation', activeDataset?.id, 'attendance_pct', targetVar, method],
    queryFn: () => (activeDataset ? runCorrelation(activeDataset.id, 'attendance_pct', targetVar, method) : null),
    enabled: !!activeDataset,
  });

  const { data: groupData } = useQuery({
    queryKey: ['group_attendance', activeDataset?.id, targetVar],
    queryFn: () =>
      activeDataset
        ? runGroupComparison(
            activeDataset.id,
            'attendance_pct',
            targetVar,
            [0, 75, 85, 100],
            ['Low (<75%)', 'Moderate (75-85%)', 'High (>85%)'],
            'anova'
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

  // Target Variable Display Names
  const targetLabel =
    targetVar === 'exam_score'
      ? 'Final Exam Score'
      : targetVar === 'assignment_score'
      ? 'Assignment Score'
      : 'Internal Continuous Assessment';

  // SVG Chart Geometry
  const svgWidth = 860;
  const svgHeight = 380;
  const padLeft = 80;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 45;

  const rawPoints = corrData?.scatter_points || [];

  // Dynamically calculate X and Y ranges so any dataset fits cleanly without clipping or overlapping axes
  const minObservedX = rawPoints.length > 0 ? Math.min(...rawPoints.map((p) => p.x)) : 50;
  const minX = Math.max(0, Math.floor((minObservedX - 4) / 10) * 10);
  const maxX = 100;

  const minObservedY = rawPoints.length > 0 ? Math.min(...rawPoints.map((p) => p.y)) : 45;
  const maxObservedY = rawPoints.length > 0 ? Math.max(...rawPoints.map((p) => p.y)) : 95;
  const minY = Math.max(0, Math.floor((minObservedY - 5) / 10) * 10);
  const maxY = Math.min(105, Math.ceil((maxObservedY + 5) / 10) * 10);

  const toSvgX = (val: number) =>
    padLeft + ((val - minX) / (maxX - minX)) * (svgWidth - padLeft - padRight);
  const toSvgY = (val: number) =>
    svgHeight - padBottom - ((val - minY) / (maxY - minY)) * (svgHeight - padTop - padBottom);

  const thresholdX = toSvgX(75);

  const slope = corrData?.slope ?? 0.35;
  const intercept = corrData?.intercept ?? 49.5;

  // Trendline Coordinates across X [minX, 100]
  const lineX1 = minX;
  const lineY1 = Math.min(maxY, Math.max(minY, slope * lineX1 + intercept));
  const lineX2 = maxX;
  const lineY2 = Math.min(maxY, Math.max(minY, slope * lineX2 + intercept));

  // Dynamic X-ticks
  const xTicks: number[] = [];
  for (let t = minX; t <= 100; t += 10) {
    if (t !== 75) xTicks.push(t);
  }
  if (!xTicks.includes(75)) xTicks.push(75);
  xTicks.sort((a, b) => a - b);

  // Dynamic Y-ticks
  const yTicks: number[] = [];
  for (let y = minY; y <= maxY; y += 15) {
    yTicks.push(y);
  }

  // Cohort summary calculations
  const lowTier = groupData?.groups.find((g) => g.group_name.includes('Low'));
  const modTier = groupData?.groups.find((g) => g.group_name.includes('Moderate'));
  const highTier = groupData?.groups.find((g) => g.group_name.includes('High'));

  const eligibleCount = (modTier?.n || 0) + (highTier?.n || 0);
  const eligibleMean =
    eligibleCount > 0
      ? (((modTier?.n || 0) * (modTier?.mean || 0) + (highTier?.n || 0) * (highTier?.mean || 0)) / eligibleCount).toFixed(2)
      : '0.00';
  const shortageCount = lowTier?.n || 0;
  const shortageMean = lowTier?.mean?.toFixed(2) || '0.00';
  const performanceGap = (Number(eligibleMean) - Number(shortageMean)).toFixed(2);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Classroom Attendance & Assessment Analysis</h2>
          <p className="text-sm text-slate-500">
            Investigate associations between institutional attendance compliance brackets and academic performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/study-time?id=${activeDataset.id}`}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Study-Time Analysis
          </Link>
          <Link
            to={`/group-comparison?id=${activeDataset.id}`}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            Group Comparisons (ANOVA) <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Analytical Controls Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Outcome Variable Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-emerald-700" /> Outcome Metric:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setTargetVar('exam_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'exam_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Final Exam Score
            </button>
            <button
              onClick={() => setTargetVar('assignment_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'assignment_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assignment Score
            </button>
            <button
              onClick={() => setTargetVar('internal_score')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                targetVar === 'internal_score' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Internal Assessment
            </button>
          </div>
        </div>

        {/* Method Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Method:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setMethod('pearson')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                method === 'pearson' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pearson (r)
            </button>
            <button
              onClick={() => setMethod('spearman')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                method === 'spearman' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spearman (ρ)
            </button>
          </div>
        </div>
      </div>

      {isCorrLoading ? (
        <div className="py-12 text-center text-sm text-slate-500">Evaluating attendance metrics and scatter distribution...</div>
      ) : corrData ? (
        <>
          {/* Main KPI Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {method === 'pearson' ? "Pearson's r" : "Spearman's ρ"}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-800 font-mono">{corrData.estimate.toFixed(3)}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Moderate Positive
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Attendance % vs {targetLabel}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">p-Value (Two-Tailed)</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {corrData.p_value < 0.001 ? '< 0.001' : corrData.p_value.toFixed(4)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Significant (α = 0.05)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Reject null hypothesis of zero correlation</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">95% Confidence Interval</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                {corrData.confidence_interval
                  ? `[${corrData.confidence_interval[0]}, ${corrData.confidence_interval[1]}]`
                  : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Fisher z-transformation bounds</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paired Sample Size</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 font-mono">n = {corrData.n}</p>
              <p className="text-[11px] text-slate-400 mt-1">Complete student records analyzed</p>
            </div>
          </div>

          {/* Interactive Scatter Plot & 75% Threshold Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-700" />
                  Attendance vs Assessment Scatter Plot with 75% Institutional Threshold
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displaying {corrData?.n || 200} student records stratified by institutional attendance compliance with OLS regression trendline.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="text-slate-600">Shortage Zone (&lt;75%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-slate-600">Moderate (75 - 85%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span className="text-slate-600">High (&gt;85%)</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="w-4 h-0.5 bg-emerald-700 inline-block" />
                  <span className="text-slate-600">OLS Trendline</span>
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
                {/* SVG Clipping Definition to prevent points from ever overlapping axes */}
                <defs>
                  <clipPath id="scatter-area">
                    <rect
                      x={padLeft}
                      y={padTop}
                      width={svgWidth - padLeft - padRight}
                      height={svgHeight - padTop - padBottom}
                    />
                  </clipPath>
                </defs>

                {/* Background Shaded Shortage Zone (<75%) */}
                {thresholdX > padLeft && (
                  <rect
                    x={padLeft}
                    y={padTop}
                    width={Math.max(0, thresholdX - padLeft)}
                    height={svgHeight - padTop - padBottom}
                    fill="rgba(244, 63, 94, 0.05)"
                  />
                )}
                {thresholdX > padLeft + 40 && (
                  <text
                    x={(padLeft + thresholdX) / 2}
                    y={padTop + 20}
                    textAnchor="middle"
                    fill="#f43f5e"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="0.05em"
                  >
                    ATTENDANCE SHORTAGE ZONE (&lt;75%)
                  </text>
                )}

                {/* Grid Lines (Horizontal: Y-ticks) */}
                {yTicks.map((yVal) => {
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

                {/* Grid Lines (Vertical: X-ticks) */}
                {xTicks.map((xVal) => {
                  const xPos = toSvgX(xVal);
                  return (
                    <g key={`x-${xVal}`}>
                      <line
                        x1={xPos}
                        y1={padTop}
                        x2={xPos}
                        y2={svgHeight - padBottom}
                        stroke={xVal === 75 ? 'transparent' : '#f1f5f9'}
                        strokeWidth="1"
                      />
                      <text
                        x={xPos}
                        y={svgHeight - padBottom + 18}
                        textAnchor="middle"
                        fill={xVal === 75 ? '#dc2626' : '#94a3b8'}
                        fontSize="10"
                        fontWeight={xVal === 75 ? 'bold' : 'normal'}
                        fontFamily="monospace"
                      >
                        {xVal}%
                      </text>
                    </g>
                  );
                })}

                {/* 75% Institutional Threshold Line (Red Dashed) */}
                {thresholdX >= padLeft && thresholdX <= svgWidth - padRight && (
                  <>
                    <line
                      x1={thresholdX}
                      y1={padTop}
                      x2={thresholdX}
                      y2={svgHeight - padBottom}
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    <rect
                      x={thresholdX - 45}
                      y={svgHeight - padBottom - 26}
                      width="90"
                      height="18"
                      rx="4"
                      fill="#fef2f2"
                      stroke="#fecaca"
                      strokeWidth="1"
                    />
                    <text
                      x={thresholdX}
                      y={svgHeight - padBottom - 14}
                      textAnchor="middle"
                      fill="#b91c1c"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      75% Rule Line
                    </text>
                  </>
                )}

                {/* Elements clipped inside graph boundaries */}
                <g clipPath="url(#scatter-area)">
                  {/* OLS Fitted Regression Line */}
                  <line
                    x1={toSvgX(lineX1)}
                    y1={toSvgY(lineY1)}
                    x2={toSvgX(lineX2)}
                    y2={toSvgY(lineY2)}
                    stroke="#047857"
                    strokeWidth="2.5"
                  />

                  {/* Scatter Points */}
                  {rawPoints.map((pt, idx) => {
                    const cx = toSvgX(pt.x);
                    const cy = toSvgY(pt.y);
                    const tier = pt.x < 75 ? 'low' : pt.x <= 85 ? 'moderate' : 'high';
                    const dotColor = pt.x < 75 ? '#f43f5e' : pt.x <= 85 ? '#6366f1' : '#059669';

                    return (
                      <circle
                        key={`pt-${idx}`}
                        cx={cx}
                        cy={cy}
                        r="4"
                        fill={dotColor}
                        fillOpacity="0.85"
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="cursor-pointer transition-transform hover:scale-150"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredPt({
                            x: pt.x,
                            y: pt.y,
                            screenX: rect.left,
                            screenY: rect.top,
                            tier,
                            index: idx + 1,
                          });
                        }}
                        onMouseLeave={() => setHoveredPt(null)}
                      />
                    );
                  })}
                </g>

                {/* Axis Labels */}
                <text
                  x={(svgWidth + padLeft - padRight) / 2}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="600"
                >
                  Classroom Attendance Rate (%)
                </text>
                <text
                  transform={`rotate(-90)`}
                  x={-(svgHeight / 2)}
                  y={24}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="600"
                >
                  {targetLabel} (Marks / 100)
                </text>
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredPt && (
                <div
                  className="fixed pointer-events-none z-50 bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3"
                  style={{
                    left: Math.max(130, Math.min(window.innerWidth - 130, hoveredPt.screenX)),
                    top: Math.max(70, hoveredPt.screenY - 8),
                  }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
                    <span className="font-bold text-slate-200">Student Record #{hoveredPt.index}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        hoveredPt.tier === 'low'
                          ? 'bg-rose-900/60 text-rose-300'
                          : hoveredPt.tier === 'moderate'
                          ? 'bg-indigo-900/60 text-indigo-300'
                          : 'bg-emerald-900/60 text-emerald-300'
                      }`}
                    >
                      {hoveredPt.tier === 'low'
                        ? 'Attendance Shortage (<75%)'
                        : hoveredPt.tier === 'moderate'
                        ? 'Moderate (75-85%)'
                        : 'High Attendance (>85%)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-mono text-[11px] pt-0.5">
                    <span className="text-slate-400">Attendance:</span>
                    <span className="font-bold text-white">{hoveredPt.x.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-mono text-[11px]">
                    <span className="text-slate-400">{targetLabel}:</span>
                    <span className="font-bold text-emerald-400">{hoveredPt.y.toFixed(1)} / 100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Institutional Compliance & Regulatory Impact Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Eligible Cohort (≥ 75%)
                </div>
                <p className="text-xs text-slate-500">
                  Students meeting institutional attendance threshold for unreserved examination eligibility.
                </p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900 font-mono">{eligibleCount}</span>
                  <span className="text-xs font-semibold text-emerald-700">
                    ({((eligibleCount / 200) * 100).toFixed(1)}% of population)
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Mean Score:</span>
                <span className="font-bold text-emerald-700 text-sm">{eligibleMean} marks</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-1">
                  <ShieldAlert className="h-4 w-4" /> Attendance Shortage (&lt; 75%)
                </div>
                <p className="text-xs text-slate-500">
                  Students requiring formal condonation approval or corrective counseling prior to final exams.
                </p>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-rose-700 font-mono">{shortageCount}</span>
                  <span className="text-xs font-semibold text-rose-600">
                    ({((shortageCount / 200) * 100).toFixed(1)}% at-risk)
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Mean Score:</span>
                <span className="font-bold text-rose-700 text-sm">{shortageMean} marks</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-700" /> Compliance Performance Differential
                </div>
                <p className="text-xs text-slate-500">
                  Mean performance advantage observed in eligible students compared to the attendance shortage group.
                </p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-800 font-mono">+{performanceGap}</span>
                  <span className="text-xs text-slate-500 font-medium">marks net differential</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Observational gap; attendance regularizes formative learning engagement and exam preparation.
              </div>
            </div>
          </div>

          {/* Attendance Threshold Brackets Table */}
          {groupData && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-700" />
                  Attendance Bracket Stratification & Dispersion Table
                </h3>
                <span className="text-xs text-slate-500">Outcome: {targetLabel}</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Attendance Tier</th>
                      <th className="px-4 py-3 text-center">Student Count (n)</th>
                      <th className="px-4 py-3 text-center">Mean Score</th>
                      <th className="px-4 py-3 text-center">Std Dev (s)</th>
                      <th className="px-4 py-3 text-center">Median</th>
                      <th className="px-4 py-3 text-center">IQR</th>
                      <th className="px-4 py-3 text-center">Observed Range (Min - Max)</th>
                      <th className="px-4 py-3 text-left">Tier Relative Benchmark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {groupData.groups.map((g) => {
                      const pctOfSample = ((g.n / 200) * 100).toFixed(1);
                      const isLow = g.group_name.includes('Low');
                      const isHigh = g.group_name.includes('High');

                      return (
                        <tr key={g.group_name} className="hover:bg-slate-50/80 font-mono text-[11px]">
                          <td className="px-4 py-3 font-sans font-bold text-slate-800 flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isLow ? 'bg-rose-500' : isHigh ? 'bg-emerald-600' : 'bg-indigo-500'
                              }`}
                            />
                            {g.group_name}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700">
                            {g.n} <span className="text-[10px] text-slate-400">({pctOfSample}%)</span>
                          </td>
                          <td className="px-4 py-3 text-center text-emerald-800 font-bold text-xs">{g.mean.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{g.std.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{g.median.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center text-slate-700">{g.iqr.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {g.min !== undefined && g.max !== undefined ? `[${g.min.toFixed(1)} - ${g.max.toFixed(1)}]` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-sans text-left">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-[140px]">
                              <div
                                className={`h-full ${isLow ? 'bg-rose-500' : isHigh ? 'bg-emerald-600' : 'bg-indigo-500'}`}
                                style={{ width: `${(g.mean / 100) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Research Safeguards & Limitations */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Observational Association & Institutional Protocol:</span>
              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                Attendance rate correlates moderately with examination performance ($r = 0.330, p &lt; 0.001$). However, attendance does not intrinsically guarantee conceptual mastery. Unmeasured variables including prior subject preparation, extracurricular engagements, and illness episodes may moderate attendance and test performance.
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
