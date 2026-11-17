import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDatasets,
  validateDataset,
  cleanDataset,
  fetchDatasetVersions,
  fetchCleaningLogs,
} from '../services/api/client';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  History,
  FileText,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CleaningResultState {
  version_id: string;
  version_no?: number;
  initial_rows: number;
  final_rows: number;
  removed_rows: number;
  cleaning_logs: Array<{ action: string; affected_rows: number; reason: string }>;
  message?: string;
}

export const DataQualityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedActions, setSelectedActions] = useState<string[]>([
    'drop_exact_duplicates',
    'drop_out_of_range',
    'drop_missing_required',
  ]);
  const [cleaningResult, setCleaningResult] = useState<CleaningResultState | null>(null);

  const { data: datasetsData, isLoading: isDatasetsLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  const {
    data: valReport,
    isLoading: isValLoading,
    refetch: refetchValidation,
  } = useQuery({
    queryKey: ['validation', activeDataset?.id],
    queryFn: () => (activeDataset ? validateDataset(activeDataset.id) : null),
    enabled: !!activeDataset,
  });

  const { data: versionsData, refetch: refetchVersions } = useQuery({
    queryKey: ['versions', activeDataset?.id],
    queryFn: () => (activeDataset ? fetchDatasetVersions(activeDataset.id) : null),
    enabled: !!activeDataset,
  });

  const { data: logsData, refetch: refetchLogs } = useQuery({
    queryKey: ['logs', activeDataset?.id],
    queryFn: () => (activeDataset ? fetchCleaningLogs(activeDataset.id) : null),
    enabled: !!activeDataset,
  });

  const cleanMutation = useMutation({
    mutationFn: () => cleanDataset(activeDataset.id, selectedActions),
    onSuccess: (data) => {
      setCleaningResult(data);
      queryClient.invalidateQueries({ queryKey: ['validation', activeDataset.id] });
      queryClient.invalidateQueries({ queryKey: ['versions', activeDataset.id] });
      queryClient.invalidateQueries({ queryKey: ['logs', activeDataset.id] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      refetchValidation();
      refetchVersions();
      refetchLogs();
    },
  });

  const toggleAction = (act: string) => {
    setSelectedActions((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleDatasetChange = (newId: string) => {
    setSearchParams({ id: newId });
    setCleaningResult(null);
  };

  if (isDatasetsLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500">Loading datasets...</p>
      </div>
    );
  }

  if (!activeDataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No Active Dataset Found</h3>
        <p className="text-sm text-slate-500 mt-1 mb-4">Please upload a dataset or create a synthetic sample first.</p>
        <Link to="/datasets" className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg">
          Go to Datasets
        </Link>
      </div>
    );
  }

  const versions = versionsData?.versions || [];
  const latestVersion = versions[0];
  const logs = logsData?.logs || [];
  const missingCounts = valReport?.missing_counts || {};
  const totalRows = valReport?.total_rows || activeDataset.row_count || 1;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Data Quality & Cleaning Review</h2>
        <p className="text-sm text-slate-500">
          Inspect missing values, duplicates, and boundary violations. All cleaning creates a new immutable version.
        </p>
      </div>

      {/* Dataset Context Bar & Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-emerald-700 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <span className="text-xs text-slate-400">Target Dataset:</span>
              <div className="flex items-center gap-2">
                <select
                  value={activeDataset.id}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="text-sm font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-emerald-600 py-0.5 cursor-pointer"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.original_name} ({d.row_count} rows)
                    </option>
                  ))}
                </select>
                {latestVersion && (
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Version {latestVersion.version_no} ({latestVersion.version_type})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setCleaningResult(null);
            refetchValidation();
            refetchVersions();
            refetchLogs();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Re-scan Quality
        </button>
      </div>

      {/* Immediate Visual Feedback Banner for Cleaning */}
      {cleaningResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start justify-between shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                {cleaningResult.message || `Cleaned Version ${cleaningResult.version_no || ''} Generated Successfully!`}
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Retained: <span className="font-semibold">{cleaningResult.final_rows} rows</span> | Excluded:{' '}
                <span className="font-semibold">{cleaningResult.removed_rows} rows</span> (Initial:{' '}
                {cleaningResult.initial_rows} rows)
              </p>
              {cleaningResult.removed_rows === 0 && (
                <p className="text-[11px] text-emerald-700 mt-1 italic">
                  Note: 0 rows were removed because your dataset already complies with research boundaries (study hours
                  0–24h, attendance 0–100%, valid scores). A new clean immutable version was safely registered.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setCleaningResult(null)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Error Banner if Cleaning Fails */}
      {cleanMutation.isError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start justify-between">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">Cleaning Execution Failed</h4>
              <p className="text-xs text-rose-700 mt-1">
                {(cleanMutation.error as any)?.response?.data?.detail || cleanMutation.error?.message || 'An error occurred while cleaning the dataset.'}
              </p>
            </div>
          </div>
          <button onClick={() => cleanMutation.reset()} className="text-xs font-bold text-rose-700">
            &times;
          </button>
        </div>
      )}

      {/* Quality Summary Metric Cards */}
      {isValLoading ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="h-6 w-6 text-emerald-700 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Scanning data quality and constraints...</p>
        </div>
      ) : valReport ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Exact Duplicate Rows</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{valReport.duplicate_rows_count}</p>
            <p className="text-[11px] text-slate-400 mt-1">Full row duplicates</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duplicate Record IDs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{valReport.duplicate_ids_count}</p>
            <p className="text-[11px] text-slate-400 mt-1">Identical student keys</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Range Violations</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {(Object.values(valReport.out_of_range_counts || {}) as number[]).reduce((acc, curr) => acc + curr, 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Outside [0–24]h / [0–100]%</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Analysis Readiness</p>
            <p
              className={`text-xl font-bold mt-1 flex items-center gap-1.5 ${
                valReport.is_valid_for_analysis ? 'text-emerald-700' : 'text-amber-600'
              }`}
            >
              {valReport.is_valid_for_analysis ? (
                <>
                  <CheckCircle className="h-5 w-5" /> Clean / Ready
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5" /> Action Advised
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Standard audit status</p>
          </div>
        </div>
      ) : null}

      {/* Column Quality & Completeness Table */}
      {valReport && Object.keys(missingCounts).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" /> Column Completeness & Missingness
            </h3>
            <span className="text-xs text-slate-500">
              Total Columns: {Object.keys(missingCounts).length} &bull; Valid Records: {totalRows}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Column Name</th>
                  <th className="py-2.5 px-3">Missing Records</th>
                  <th className="py-2.5 px-3">Missing %</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3">Quality Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(missingCounts).map(([col, rawCount]) => {
                  const count = Number(rawCount);
                  const pct = ((count / totalRows) * 100).toFixed(1);
                  const isClean = count === 0;
                  return (
                    <tr key={col} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-medium text-slate-900">{col}</td>
                      <td className="py-2.5 px-3 text-slate-700">{count}</td>
                      <td className="py-2.5 px-3 text-slate-700">{pct}%</td>
                      <td className="py-2.5 px-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${isClean ? 'bg-emerald-600' : 'bg-amber-500'}`}
                            style={{ width: `${100 - Number(pct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isClean ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="h-3 w-3" /> Complete (100%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> {count} missing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detected Issues List (if any) */}
      {valReport?.issues && valReport.issues.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Detected Quality Issues (
            {valReport.issues.length})
          </h4>
          <div className="space-y-2">
            {(valReport.issues as Array<{ issue_type: string; field: string; details: string }>).map((issue, idx: number) => (
              <div
                key={idx}
                className="bg-white/80 p-3 rounded-lg border border-amber-200/70 text-xs flex items-start gap-2.5"
              >
                <span className="px-1.5 py-0.5 font-mono text-[10px] font-semibold rounded bg-amber-100 text-amber-800">
                  {issue.issue_type}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">{issue.field}:</span>{' '}
                  <span className="text-slate-600">{issue.details}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleaning Workflow Action Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" /> Apply Researcher-Approved Cleaning
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Select actions to apply. Original file is never overwritten. A new cleaned version is stored and logged.
        </p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedActions.includes('drop_exact_duplicates')}
              onChange={() => toggleAction('drop_exact_duplicates')}
              className="rounded text-emerald-700 focus:ring-emerald-700 h-4 w-4"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Drop Exact Duplicate Rows</p>
              <p className="text-[11px] text-slate-500">Removes repeated records across all attributes.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedActions.includes('drop_out_of_range')}
              onChange={() => toggleAction('drop_out_of_range')}
              className="rounded text-emerald-700 focus:ring-emerald-700 h-4 w-4"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Drop Impossible Out-of-Range Records</p>
              <p className="text-[11px] text-slate-500">
                Excludes negative study hours, attendance &gt; 100%, and scores &gt; 100.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={selectedActions.includes('drop_missing_required')}
              onChange={() => toggleAction('drop_missing_required')}
              className="rounded text-emerald-700 focus:ring-emerald-700 h-4 w-4"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Drop Incomplete Analytical Rows</p>
              <p className="text-[11px] text-slate-500">
                Excludes records where study hours or final assessment score is empty (never imputes to 0).
              </p>
            </div>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => cleanMutation.mutate()}
            disabled={cleanMutation.isPending || selectedActions.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {cleanMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executing Cleaning...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Confirm & Generate Cleaned Version
              </>
            )}
          </button>

          <Link
            to={`/exploratory-analysis?id=${activeDataset.id}`}
            className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1.5 self-center"
          >
            Proceed to Exploratory Analysis <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Dataset Version History & Audit Trail */}
      {(versions.length > 0 || logs.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Version History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-700" /> Immutable Version History
            </h3>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {versions.map((ver: any) => (
                <div
                  key={ver.id || ver._id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">Version {ver.version_no}</span>
                    <span className="ml-2 px-2 py-0.5 font-medium rounded-full text-[10px] bg-slate-200 text-slate-700 uppercase">
                      {ver.version_type}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ver.created_at ? new Date(ver.created_at).toLocaleString() : 'Recent'}
                    </p>
                  </div>
                  {latestVersion?.id === ver.id && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cleaning Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700" /> Cleaning Audit Trail
            </h3>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No records excluded yet. Dataset retains original rows.</p>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {logs.map((log: any, idx: number) => (
                  <div
                    key={log.id || log._id || idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{log.action}</span>
                      <span className="text-amber-700 font-mono">-{log.affected_rows} rows</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{log.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
