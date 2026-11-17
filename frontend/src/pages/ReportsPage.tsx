import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { listDatasets, createSession, downloadReportPdf, downloadReportExcel } from '../services/api/client';
import { FileText, FileSpreadsheet, Download, ShieldCheck, AlertCircle, Layers, CheckCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const datasets = datasetsData?.datasets || [];
  const requestedId = searchParams.get('id');
  const activeDataset = datasets.find((d) => d.id === requestedId) || datasets[0];

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      setDownloadSuccess(null);
      const session = await createSession("StudyMetrics Academic Study", activeDataset?.id);
      await downloadReportPdf(session.id);
      setDownloadSuccess("Academic PDF report downloaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF report. Ensure backend is running.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      setDownloadSuccess(null);
      const session = await createSession("StudyMetrics Academic Study", activeDataset?.id);
      await downloadReportExcel(session.id);
      setDownloadSuccess("Research Excel workbook (.xlsx) downloaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export Excel report. Ensure backend is running.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 bg-white rounded-xl border border-slate-200">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Research Report Exports</h2>
        <p className="text-sm text-slate-500">
          Generate formal academic PDFs and comprehensive Excel analytical workbooks.
        </p>
      </div>

      {/* Dataset Context Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-emerald-700" />
          <div>
            <span className="text-xs text-slate-400">Target Dataset:</span>
            <div className="flex items-center gap-2">
              <select
                value={activeDataset.id}
                onChange={(e) => setSearchParams({ id: e.target.value })}
                className="text-sm font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-emerald-600 py-0.5 cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_name} ({d.row_count} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle className="h-4 w-4 text-emerald-700" /> {downloadSuccess}
          </span>
          <button onClick={() => setDownloadSuccess(null)} className="font-bold text-emerald-700 hover:text-emerald-950">
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
              <FileText className="h-6 w-6 text-emerald-700" />
              <h3>Academic PDF Research Report</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Formatted for academic submission. Includes study metadata, research questions,
              data cleaning audit trail, descriptive tables, correlation findings, and ethical caveats.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Executive Research Abstract
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Correlation Analysis (Pearson & Spearman)
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Non-Causality & Ethical Limitations Notice
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            {isExportingPdf ? 'Generating PDF Document...' : 'Download Research PDF'}
          </button>
        </div>

        {/* Excel Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
              <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
              <h3>Comprehensive Excel Workbook</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Multi-tab spreadsheet with pre-formatted sheets: Read Me, Data Quality,
              Descriptive Statistics, Correlation Models, and Cleaned Dataset.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-6">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> ReadMe tab with measurement units & scales
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Full cleaned tabular records
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Formula injection protected
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            {isExportingExcel ? 'Assembling Excel Workbook...' : 'Download Formatted Excel (.xlsx)'}
          </button>
        </div>
      </div>
    </div>
  );
};
