import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, runCorrelation, runGroupComparison } from '../services/api/client';
import { TableProperties, AlertTriangle, ArrowRight } from 'lucide-react';

export const StatisticalResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

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
            ['Low', 'Medium', 'High'],
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

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Statistical Results Matrix</h2>
          <p className="text-sm text-slate-500">
            Consolidated table of estimated statistical parameters, test statistics, and significance.
          </p>
        </div>
        <Link
          to={`/reports?id=${activeDataset.id}`}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          Download Reports <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-emerald-700" /> Empirical Findings Summary
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Relationship / Test</th>
                <th className="px-3 py-2 text-left">Analytical Model</th>
                <th className="px-3 py-2 text-center">Sample (n)</th>
                <th className="px-3 py-2 text-center">Estimate / Statistic</th>
                <th className="px-3 py-2 text-center">95% CI</th>
                <th className="px-3 py-2 text-center">p-Value</th>
                <th className="px-3 py-2 text-center">Significance (α=0.05)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {studyCorr && (
                <tr className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="px-3 py-2 font-sans font-bold text-slate-800">Study Hours &rarr; Exam Score</td>
                  <td className="px-3 py-2 font-sans text-slate-600">Pearson Linear Correlation</td>
                  <td className="px-3 py-2 text-center text-slate-700">{studyCorr.n}</td>
                  <td className="px-3 py-2 text-center text-emerald-800 font-bold">r = {studyCorr.estimate.toFixed(3)}</td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {studyCorr.confidence_interval ? `[${studyCorr.confidence_interval[0]}, ${studyCorr.confidence_interval[1]}]` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-700">
                    {studyCorr.p_value < 0.001 ? '< 0.001' : studyCorr.p_value.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-sans font-semibold">
                    {studyCorr.is_statistically_significant ? 'Statistically Significant' : 'Not Significant'}
                  </td>
                </tr>
              )}

              {attCorr && (
                <tr className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="px-3 py-2 font-sans font-bold text-slate-800">Attendance &rarr; Exam Score</td>
                  <td className="px-3 py-2 font-sans text-slate-600">Pearson Linear Correlation</td>
                  <td className="px-3 py-2 text-center text-slate-700">{attCorr.n}</td>
                  <td className="px-3 py-2 text-center text-emerald-800 font-bold">r = {attCorr.estimate.toFixed(3)}</td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {attCorr.confidence_interval ? `[${attCorr.confidence_interval[0]}, ${attCorr.confidence_interval[1]}]` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-700">
                    {attCorr.p_value < 0.001 ? '< 0.001' : attCorr.p_value.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-sans font-semibold">
                    {attCorr.is_statistically_significant ? 'Statistically Significant' : 'Not Significant'}
                  </td>
                </tr>
              )}

              {groupTest && (
                <tr className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="px-3 py-2 font-sans font-bold text-slate-800">Study Cohort Comparisons</td>
                  <td className="px-3 py-2 font-sans text-slate-600">{groupTest.test_name}</td>
                  <td className="px-3 py-2 text-center text-slate-700">
                    {groupTest.groups.reduce((a, b) => a + b.n, 0)}
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-800 font-bold">F = {groupTest.test_statistic.toFixed(3)}</td>
                  <td className="px-3 py-2 text-center text-slate-600">
                    {groupTest.effect_size ? `${groupTest.effect_size.metric}: ${groupTest.effect_size.value}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-700">
                    {groupTest.p_value < 0.001 ? '< 0.001' : groupTest.p_value.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-700 font-sans font-semibold">
                    {groupTest.is_significant ? 'Statistically Significant' : 'Not Significant'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
