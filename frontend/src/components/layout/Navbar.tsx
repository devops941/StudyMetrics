import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDatasets } from '../../services/api/client';
import { Layers, FileSpreadsheet, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: listDatasets,
  });

  const activeDataset = datasetsData?.datasets?.[0];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3.5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-emerald-800 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            SM
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none group-hover:text-emerald-800 transition-colors">
              StudyMetrics
            </h1>
            <p className="text-[11px] text-slate-500 mt-1">
              Student Study-Time & Assessment Research
            </p>
          </div>
        </Link>
      </div>

      {/* Right Controls & Status Indicators */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Active Dataset Chip */}
        {activeDataset ? (
          <Link
            to="/datasets"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-slate-500 text-[11px]">Dataset:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[180px]">
              {activeDataset.original_name}
            </span>
          </Link>
        ) : (
          <Link
            to="/datasets"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Select Dataset</span>
          </Link>
        )}

        {/* Operational Status Dot */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          <span className="hidden sm:inline">System Operational</span>
          <span className="sm:hidden">Active</span>
        </div>

        {/* Quick Reports Link */}
        <Link
          to="/reports"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Research Reports</span>
        </Link>
      </div>
    </header>
  );
};
