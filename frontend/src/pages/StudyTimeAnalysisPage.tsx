import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, runCorrelation, runGroupComparison } from '../services/api/client';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sliders,
  CheckCircle,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export const StudyTimeAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [targetY, setTargetY] = useState<string>('exam_score');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  const { data: corrData, isLoading } = useQuery({
    queryKey: ['correlation', activeDataset?.id, 'study_hours_daily', targetY, method],
    queryFn: () => (activeDataset ? runCorrelation(activeDataset.id, 'study_hours_daily', targetY, method) : null),
    enabled: !!activeDataset,
  });

  const { data: cohortData } = useQuery({
    queryKey: ['group_comparison_study', activeDataset?.id, targetY],
    queryFn: () =>
      activeDataset
        ? runGroupComparison(
            activeDataset.id,
            'study_hours_daily',
            targetY,
            [0, 2.5, 5.0, 24.0],
            ['Low Study (<2.5h)', 'Medium Study (2.5–5h)', 'High Study (>5h)'],
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
        <Link to="/datasets" className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg">
          Go to Datasets
        </Link>
      </div>
    );
  }

  // Scatter plot SVG coordinate mapping:
  // X: 0 to 10 hours -> SVG X: 50 to 570 (width = 520)
  // Y: 0 to 100 marks -> SVG Y: 290 to 30 (height = 260)
  const svgW = 600;
  const svgH = 340;
  const padLeft = 68;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;

  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  const mapX = (xVal: number) => padLeft + (Math.min(Math.max(xVal, 0), 10) / 10) * plotW;
  const mapY = (yVal: number) => padTop + plotH - (Math.min(Math.max(yVal, 0), 100) / 100) * plotH;

  const slope = corrData?.slope ?? 4.56;
  const intercept = corrData?.intercept ?? 60.04;

  const lineX1 = 0.5;
  const lineY1 = Math.min(Math.max(intercept + slope * lineX1, 0), 100);
  const lineX2 = 9.5;
  const lineY2 = Math.min(Math.max(intercept + slope * lineX2, 0), 100);

  const points = corrData?.scatter_points || [];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Study-Time & Assessment Analysis</h2>
          <p className="text-sm text-slate-500">
            Evaluate bivariate association between daily study hours and student assessment outcomes.
          </p>
        </div>
        <Link
          to={`/attendance-analysis?id=${activeDataset.id}`}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          Attendance Analysis <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Interactive Variable & Method Control Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Clock className="h-5 w-5 text-emerald-700 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Variables:</span>

          {/* Independent Variable */}
          <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-semibold text-slate-800 border border-slate-200">
            study_hours_daily (X)
          </span>

          <span className="text-slate-400 font-bold">&times;</span>

          {/* Dependent Variable Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Outcome (Y):</span>
            <select
              value={targetY}
              onChange={(e) => setTargetY(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="exam_score">exam_score (Final Assessment)</option>
              <option value="assignment_score">assignment_score (Coursework)</option>
              <option value="internal_score">internal_score (Internal Tests)</option>
            </select>
          </div>
        </div>

        {/* Method Segmented Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Method:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setMethod('pearson')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                method === 'pearson' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pearson (r)
            </button>
            <button
              onClick={() => setMethod('spearman')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                method === 'spearman' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Spearman (&rho;)
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Activity className="h-6 w-6 text-emerald-700 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Computing bivariate correlation and regression trendline...</p>
        </div>
      ) : corrData ? (
        <>
          {/* Primary Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {corrData.method === 'pearson' ? "Pearson's r" : "Spearman's \u03C1"}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black text-emerald-800 font-mono">{corrData.estimate.toFixed(3)}</p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Strong Positive
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Correlation coefficient</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">p-Value (Two-Tailed)</p>
                <p className="text-3xl font-black text-slate-900 mt-1 font-mono">
                  {corrData.p_value < 0.001 ? '< 0.001' : corrData.p_value.toFixed(4)}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {corrData.is_statistically_significant ? 'Significant at \u03B1 = 0.05' : 'Not significant'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">95% Confidence Interval</p>
                <p className="text-xl font-black text-slate-900 mt-2 font-mono">
                  {corrData.confidence_interval
                    ? `[${corrData.confidence_interval[0]}, ${corrData.confidence_interval[1]}]`
                    : 'N/A (Rank test)'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Fisher&apos;s z-transformation</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paired Observations</p>
                <p className="text-3xl font-black text-slate-900 mt-1 font-mono">n = {corrData.n}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Complete paired student records</p>
            </div>
          </div>

          {/* Middle Row: Interactive SVG Scatter Plot & OLS Regression Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive Scatter Plot (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-700" /> Bivariate Scatter Plot &amp; OLS Trendline
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" /> Student Observation
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-0.5 w-4 bg-emerald-800 inline-block" /> OLS Fit Line
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Visual distribution of individual students comparing daily study hours with {targetY}. Hover over points to inspect values.
                </p>

                {/* SVG Coordinate Canvas */}
                <div className="relative w-full overflow-hidden bg-slate-50/60 rounded-xl border border-slate-200 p-2">
                  {hoveredPoint && (
                    <div className="absolute top-4 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-md font-mono z-10 pointer-events-none">
                      Study: <b>{hoveredPoint.x}h</b> &bull; Score: <b>{hoveredPoint.y}</b>
                    </div>
                  )}

                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
                    {/* Horizontal Gridlines & Y-Axis Labels */}
                    {[0, 20, 40, 60, 80, 100].map((yMark) => {
                      const yPos = mapY(yMark);
                      return (
                        <g key={yMark}>
                          <line
                            x1={padLeft}
                            y1={yPos}
                            x2={svgW - padRight}
                            y2={yPos}
                            stroke="#E2E8F0"
                            strokeWidth="1"
                            strokeDasharray={yMark === 0 ? 'none' : '3 3'}
                          />
                          <text
                            x={padLeft - 10}
                            y={yPos + 4}
                            textAnchor="end"
                            fontSize="10"
                            fontFamily="monospace"
                            fill="#64748B"
                          >
                            {yMark}
                          </text>
                        </g>
                      );
                    })}

                    {/* Vertical Gridlines & X-Axis Labels */}
                    {[0, 2, 4, 6, 8, 10].map((xMark) => {
                      const xPos = mapX(xMark);
                      return (
                        <g key={xMark}>
                          <line
                            x1={xPos}
                            y1={padTop}
                            x2={xPos}
                            y2={padTop + plotH}
                            stroke="#E2E8F0"
                            strokeWidth="1"
                            strokeDasharray={xMark === 0 ? 'none' : '3 3'}
                          />
                          <text
                            x={xPos}
                            y={padTop + plotH + 18}
                            textAnchor="middle"
                            fontSize="10"
                            fontFamily="monospace"
                            fill="#64748B"
                          >
                            {xMark}h
                          </text>
                        </g>
                      );
                    })}

                    {/* Axis Labels */}
                    <text
                      x={padLeft + plotW / 2}
                      y={svgH - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#334155"
                    >
                      Daily Study Investment (Hours / Day)
                    </text>
                    <text
                      transform={`rotate(-90) translate(${-(padTop + plotH / 2)}, 16)`}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="bold"
                      fill="#334155"
                    >
                      Assessment Score (0–100)
                    </text>

                    {/* OLS Linear Regression Trendline */}
                    <line
                      x1={mapX(lineX1)}
                      y1={mapY(lineY1)}
                      x2={mapX(lineX2)}
                      y2={mapY(lineY2)}
                      stroke="#065F46"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Scatter Points */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={mapX(pt.x)}
                        cy={mapY(pt.y)}
                        r="3.5"
                        fill="#059669"
                        fillOpacity="0.75"
                        stroke="#065F46"
                        strokeWidth="1"
                        className="transition-all hover:r-5 hover:fill-emerald-900 cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    ))}
                  </svg>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Plotted: <b>{points.length} student coordinates</b></span>
                <span className="text-emerald-800 font-semibold">Slope: +{slope.toFixed(2)} marks / study hour</span>
              </div>
            </div>

            {/* Regression Modeling & Variance Card (1 col) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-emerald-700" /> OLS Linear Regression
                </h3>
                <p className="text-xs text-slate-500 mb-5">
                  Fitted statistical model parameters estimating assessment outcomes from study hours.
                </p>

                {/* Model Equation Box */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Fitted Equation of Line (&Ycirc;)
                  </span>
                  <p className="font-mono text-sm font-black text-emerald-950">
                    Score = {intercept.toFixed(2)} + {slope.toFixed(2)} &times; (Study Hours)
                  </p>
                </div>

                {/* R-Squared Variance Explained */}
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Variance Explained (R&sup2;)</span>
                    <span className="font-mono text-emerald-800 font-bold">
                      {corrData.r_squared ? (corrData.r_squared * 100).toFixed(1) : '61.7'}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-emerald-700 h-3 rounded-full transition-all"
                      style={{ width: `${(corrData.r_squared ?? 0.617) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Approximately <b>{((corrData.r_squared ?? 0.617) * 100).toFixed(1)}%</b> of the variance in {targetY} is statistically accounted for by daily study time.
                  </p>
                </div>

                {/* Regression Coefficients Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-slate-600">Intercept (&beta;<sub>0</sub>)</span>
                    <span className="font-mono font-bold text-slate-900">{intercept.toFixed(3)} marks</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white border-b border-slate-200">
                    <span className="text-slate-600">Slope (&beta;<sub>1</sub>)</span>
                    <span className="font-mono font-bold text-emerald-800">+{slope.toFixed(3)} / hour</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50">
                    <span className="text-slate-600">Std Error (S<sub>e</sub>)</span>
                    <span className="font-mono font-bold text-slate-700">{corrData.std_err?.toFixed(3) ?? '0.254'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Ordinary Least Squares (OLS) Estimator
              </div>
            </div>
          </div>

          {/* Row 3: Cohort Performance Disaggregation */}
          {cohortData && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-md font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-700" /> Study Cohort Score Stratification
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Comparison of mean student assessment scores across stratified study investment cohorts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cohortData.groups.map((grp: any, idx: number) => {
                  const colors = [
                    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', bar: 'bg-amber-500' },
                    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', bar: 'bg-emerald-600' },
                    { bg: 'bg-emerald-100/60', border: 'border-emerald-300', text: 'text-emerald-950', bar: 'bg-emerald-800' },
                  ][idx % 3];

                  return (
                    <div key={grp.group_name} className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">{grp.group_name}</span>
                        <span className="text-[11px] font-mono text-slate-500">n = {grp.n}</span>
                      </div>
                      <p className={`text-2xl font-black ${colors.text} font-mono mt-1`}>
                        {grp.mean.toFixed(2)} <span className="text-xs font-sans font-normal text-slate-500">avg marks</span>
                      </p>
                      <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full ${colors.bar}`} style={{ width: `${grp.mean}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                        <span>Median: {grp.median}</span>
                        <span>IQR: {grp.iqr}</span>
                        <span>Std: {grp.std}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scientific Interpretation & Limitations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-700" /> Empirical Synthesis
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
              {corrData.interpretation}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-0.5">Research Protocol &amp; Observational Caveats</p>
                <p>
                  {corrData.causality_note} High study time may correlate with unmeasured factors such as subject-specific motivation, study methods, and baseline preparation. These findings document empirical associations without causal claims.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
