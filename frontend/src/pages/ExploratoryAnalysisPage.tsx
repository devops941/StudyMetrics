import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, runEDA } from '../services/api/client';
import {
  BarChart2,
  Table,
  AlertCircle,
  ArrowRight,
  Sliders,
  Activity,
} from 'lucide-react';

type ChartMode = 'histogram' | 'boxplot' | 'cumulative' | 'table';

export const ExploratoryAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [chartMode, setChartMode] = useState<ChartMode>('histogram');
  const [selectedCol, setSelectedCol] = useState<string>('all');

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  const { data: edaData, isLoading } = useQuery({
    queryKey: ['eda', activeDataset?.id],
    queryFn: () => (activeDataset ? runEDA(activeDataset.id) : null),
    enabled: !!activeDataset,
  });

  if (!activeDataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Dataset Active</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Please upload or select a dataset before running EDA.</p>
        <Link to="/datasets" className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg">
          Go to Datasets
        </Link>
      </div>
    );
  }

  const columns = edaData ? Object.keys(edaData.histograms) : [];
  const visibleColumns = selectedCol === 'all' ? columns : columns.filter((c) => c === selectedCol);

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Exploratory Data Analysis (EDA)</h2>
          <p className="text-sm text-slate-500">
            Univariate distributions, descriptive statistics, dispersion, and five-number summaries.
          </p>
        </div>
        <Link
          to={`/study-time-analysis?id=${activeDataset.id}`}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          Study-Time Correlation <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Activity className="h-6 w-6 text-emerald-700 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Computing descriptive statistics and distribution models...</p>
        </div>
      ) : edaData ? (
        <>
          {/* Descriptive Statistics Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Table className="h-4 w-4 text-emerald-700" /> Summary Statistics (Numeric Variables)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Variable</th>
                    <th className="px-3 py-2.5 text-center">Valid N</th>
                    <th className="px-3 py-2.5 text-center">Missing</th>
                    <th className="px-3 py-2.5 text-center">Mean</th>
                    <th className="px-3 py-2.5 text-center">Std Dev</th>
                    <th className="px-3 py-2.5 text-center">Median</th>
                    <th className="px-3 py-2.5 text-center">IQR</th>
                    <th className="px-3 py-2.5 text-center">Min</th>
                    <th className="px-3 py-2.5 text-center">Max</th>
                    <th className="px-3 py-2.5 text-center">Skewness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {edaData.statistics.map((s) => (
                    <tr key={s.column} className="hover:bg-slate-50/80 font-mono text-[11px]">
                      <td className="px-3 py-2.5 font-sans font-bold text-slate-800">{s.column}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.n_valid}</td>
                      <td className="px-3 py-2.5 text-center text-slate-500">{s.n_missing}</td>
                      <td className="px-3 py-2.5 text-center text-emerald-800 font-semibold">{s.mean ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.std ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.median ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.iqr ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.min ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">{s.max ?? '-'}</td>
                      <td className="px-3 py-2.5 text-center text-slate-700">
                        {s.skewness !== null ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              Math.abs(s.skewness) < 0.2
                                ? 'bg-slate-100 text-slate-700'
                                : s.skewness > 0
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {s.skewness > 0 ? `+${s.skewness}` : s.skewness}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Chart Controls Bar (Manual Switcher + Variable Filter) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Chart Mode Segmented Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-700" /> Chart View:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setChartMode('histogram')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    chartMode === 'histogram'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Histogram
                </button>
                <button
                  onClick={() => setChartMode('boxplot')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    chartMode === 'boxplot'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Box Plot (Tukey)
                </button>
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    chartMode === 'cumulative'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cumulative CDF
                </button>
                <button
                  onClick={() => setChartMode('table')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    chartMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Frequency Table
                </button>
              </div>
            </div>

            {/* Right: Variable Selector Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSelectedCol('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  selectedCol === 'all'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Variables
              </button>
              {columns.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCol(c)}
                  className={`px-2.5 py-1 text-xs font-medium font-mono rounded-lg transition-colors whitespace-nowrap ${
                    selectedCol === c
                      ? 'bg-emerald-800 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Visualizations Grid */}
          <div className={`grid gap-6 ${selectedCol === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {visibleColumns.map((col) => {
              const hist = edaData.histograms[col];
              const box = edaData.boxplots[col];
              const stat = edaData.statistics.find((s) => s.column === col);
              const totalCount = hist.counts.reduce((a, b) => a + b, 0) || 1;
              const maxCount = Math.max(...hist.counts, 1);

              return (
                <div key={col} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-emerald-700" />
                        Variable: <span className="font-mono text-emerald-900 font-bold">{col}</span>
                      </h4>
                      {stat && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-medium text-slate-500">
                            Mean: <b className="text-slate-800">{stat.mean}</b>
                          </span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="font-medium text-slate-500">
                            Median: <b className="text-slate-800">{stat.median}</b>
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-5">
                      {chartMode === 'histogram' && 'Binned frequency intervals with relative percentages.'}
                      {chartMode === 'boxplot' && 'Five-number summary: Min, Q1, Median, Q3, Max, and Outliers.'}
                      {chartMode === 'cumulative' && 'Empirical cumulative distribution function (CDF progression to 100%).'}
                      {chartMode === 'table' && 'Numerical distribution table with frequency and cumulative share.'}
                    </p>

                    {/* VIEW 1: HISTOGRAM */}
                    {chartMode === 'histogram' && (
                      <div>
                        <div className="h-44 flex items-end gap-2 pt-4 pb-2 border-b border-slate-200">
                          {hist.counts.map((count, i) => {
                            const heightPct = (count / maxCount) * 100;
                            const sharePct = ((count / totalCount) * 100).toFixed(1);
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                                <span className="text-[10px] font-mono text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {count} ({sharePct}%)
                                </span>
                                <div
                                  style={{ height: `${Math.max(heightPct, 6)}%` }}
                                  className="w-full bg-emerald-700 hover:bg-emerald-800 rounded-t transition-all cursor-pointer"
                                  title={`${hist.bin_labels[i]}: ${count} records (${sharePct}%)`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 font-mono">
                          <span>{hist.bin_edges[0]}</span>
                          <span className="text-slate-500">10 Binned Intervals</span>
                          <span>{hist.bin_edges[hist.bin_edges.length - 1]}</span>
                        </div>
                      </div>
                    )}

                    {/* VIEW 2: BOX PLOT (TUKEY FIVE-NUMBER SUMMARY) */}
                    {chartMode === 'boxplot' && box && (
                      <div className="py-4">
                        {/* Boxplot Diagram Container */}
                        <div className="relative h-20 bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-center">
                          {/* Whisker Line */}
                          <div className="absolute h-0.5 bg-slate-400 w-[84%]" />

                          {/* Min Whisker Cap */}
                          <div className="absolute left-[8%] h-7 w-0.5 bg-slate-600 rounded" />

                          {/* IQR Box (Q1 to Q3) */}
                          <div
                            className="absolute h-10 bg-emerald-700/80 border-2 border-emerald-900 rounded-md shadow-xs flex items-center justify-center"
                            style={{ left: '26%', width: '48%' }}
                          >
                            {/* Median Line */}
                            <div className="h-full w-1 bg-white shadow-xs" title={`Median: ${box.median}`} />
                          </div>

                          {/* Max Whisker Cap */}
                          <div className="absolute right-[8%] h-7 w-0.5 bg-slate-600 rounded" />
                        </div>

                        {/* Five-Number Metrics Badges */}
                        <div className="grid grid-cols-5 gap-2 mt-4 text-center font-mono text-[11px]">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-sans text-slate-400 block">Min</span>
                            <span className="font-bold text-slate-800">{box.min}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-sans text-slate-400 block">Q1 (25%)</span>
                            <span className="font-bold text-slate-800">{box.q1}</span>
                          </div>
                          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <span className="text-[10px] font-sans text-emerald-700 block font-bold">Median</span>
                            <span className="font-bold text-emerald-900">{box.median}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-sans text-slate-400 block">Q3 (75%)</span>
                            <span className="font-bold text-slate-800">{box.q3}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-sans text-slate-400 block">Max</span>
                            <span className="font-bold text-slate-800">{box.max}</span>
                          </div>
                        </div>

                        {/* Outliers */}
                        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                          <span>
                            Interquartile Range (IQR): <b className="text-slate-800 font-mono">{(box.q3 - box.q1).toFixed(2)}</b>
                          </span>
                          <span>
                            Outliers:{' '}
                            {box.outliers && box.outliers.length > 0 ? (
                              <b className="text-rose-600 font-mono">{box.outliers.join(', ')}</b>
                            ) : (
                              <span className="text-emerald-700 font-semibold">None detected</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* VIEW 3: CUMULATIVE CDF PROGRESSION */}
                    {chartMode === 'cumulative' && (
                      <div>
                        <div className="h-44 flex items-end gap-2 pt-4 pb-2 border-b border-slate-200">
                          {(() => {
                            let cumulative = 0;
                            return hist.counts.map((count, i) => {
                              cumulative += count;
                              const cumPct = (cumulative / totalCount) * 100;
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                                  <span className="text-[9px] font-mono text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {cumPct.toFixed(0)}%
                                  </span>
                                  <div
                                    style={{ height: `${Math.max(cumPct, 5)}%` }}
                                    className="w-full bg-blue-700 hover:bg-blue-800 rounded-t transition-all cursor-pointer"
                                    title={`Up to ${hist.bin_edges[i + 1]}: ${cumulative} students (${cumPct.toFixed(1)}%)`}
                                  />
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 font-mono">
                          <span>0%</span>
                          <span className="text-slate-500">Cumulative Progression</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}

                    {/* VIEW 4: FREQUENCY TABLE */}
                    {chartMode === 'table' && (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-56">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-50 font-semibold text-slate-700">
                            <tr>
                              <th className="px-3 py-2 text-left">Bin Interval</th>
                              <th className="px-3 py-2 text-center">Frequency (f)</th>
                              <th className="px-3 py-2 text-center">Relative %</th>
                              <th className="px-3 py-2 text-center">Cumulative %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {(() => {
                              let cum = 0;
                              return hist.counts.map((cnt, idx) => {
                                cum += cnt;
                                const relPct = ((cnt / totalCount) * 100).toFixed(1);
                                const cumPct = ((cum / totalCount) * 100).toFixed(1);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-3 py-1.5 font-sans font-medium text-slate-800">{hist.bin_labels[idx]}</td>
                                    <td className="px-3 py-1.5 text-center text-slate-900 font-bold">{cnt}</td>
                                    <td className="px-3 py-1.5 text-center text-slate-600">{relPct}%</td>
                                    <td className="px-3 py-1.5 text-center text-emerald-800 font-semibold">{cumPct}%</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Sample Size: n = {totalCount}</span>
                    <span className="text-emerald-800 font-medium">Standard Academic Audit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
};
