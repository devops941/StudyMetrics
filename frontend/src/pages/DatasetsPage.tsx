import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDatasets, uploadDataset, fetchDatasetPreview } from '../services/api/client';
import { Upload, FileSpreadsheet, Eye, ArrowRight, Check, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DatasetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const { data: datasetsData, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['preview', selectedDatasetId],
    queryFn: () => (selectedDatasetId ? fetchDatasetPreview(selectedDatasetId, 15) : null),
    enabled: !!selectedDatasetId,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDataset,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      setSelectedDatasetId(data.dataset_id);
      setUploadSuccessMsg(`"${data.metadata.original_name}" uploaded successfully (${data.metadata.row_count} rows, ${data.metadata.column_count} columns).`);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadSuccessMsg(null);
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  const datasets = datasetsData?.datasets || [];

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dataset Manager</h2>
        <p className="text-sm text-slate-500">
          Upload research CSV or XLSX files for observational study analysis.
        </p>
      </div>

      {/* Upload Success Alert */}
      {uploadSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-fadeIn">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle className="h-4 w-4 text-emerald-700" /> {uploadSuccessMsg}
          </span>
          <button onClick={() => setUploadSuccessMsg(null)} className="font-bold text-emerald-700 hover:text-emerald-950">
            &times;
          </button>
        </div>
      )}

      {/* Upload File Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
          <Upload className="h-5 w-5 text-emerald-700" />
          <h3>Upload Research File</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Upload institutional or survey CSV or Excel files. Files are verified, pseudonymized, and securely stored in private server storage.
        </p>

        <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/40 flex flex-col items-center justify-center">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
          <div className="p-3 bg-emerald-100/60 text-emerald-800 rounded-full mb-2">
            <Upload className="h-6 w-6" />
          </div>
          <span className="text-sm font-semibold text-emerald-900">
            {uploadMutation.isPending ? 'Uploading & parsing dataset...' : 'Click to select or drag CSV / XLSX file here'}
          </span>
          <p className="text-xs text-slate-400 mt-1">Supported formats: .csv, .xlsx, .xls &bull; Maximum file size: 20MB</p>
        </label>
      </div>

      {/* Dataset Selection List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-md font-bold text-slate-900 mb-3">Available Datasets</h3>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading datasets...</p>
        ) : datasets.length === 0 ? (
          <p className="text-sm text-slate-500">No datasets uploaded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {datasets.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDatasetId(d.id)}
                className={`py-3 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  selectedDatasetId === d.id ? 'bg-emerald-50/70 border border-emerald-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{d.original_name}</p>
                    <p className="text-xs text-slate-500">
                      {d.row_count} rows &bull; {d.column_count} columns &bull; Source: {d.source_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedDatasetId === d.id && (
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <Check className="h-4 w-4" /> Selected
                    </span>
                  )}
                  <Link
                    to={`/data-quality?id=${d.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    Data Quality <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Preview Table */}
      {selectedDatasetId && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-700" /> Tabular Preview (First 15 Rows)
            </h3>
            {previewData && (
              <span className="text-xs text-slate-500">
                Displaying 15 of {previewData.total_rows} total rows
              </span>
            )}
          </div>

          {isPreviewLoading ? (
            <p className="text-sm text-slate-500">Loading preview data...</p>
          ) : previewData ? (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    {previewData.columns.map((col: string) => (
                      <th key={col} className="px-3 py-2 text-left whitespace-nowrap">
                        {col}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {previewData.dtypes[col]}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewData.rows.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      {previewData.columns.map((col: string) => (
                        <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap font-mono text-[11px]">
                          {row[col] !== null ? String(row[col]) : <span className="text-red-400 font-sans italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
