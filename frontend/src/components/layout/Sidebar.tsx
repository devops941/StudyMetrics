import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  CheckCircle2,
  BarChart2,
  Clock,
  UserCheck,
  GitCompare,
  TableProperties,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: Array<{
    name: string;
    path: string;
    icon: React.ElementType;
  }>;
}

const navSections: NavSection[] = [
  {
    title: 'Data Workspace',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Dataset Manager', path: '/datasets', icon: Database },
      { name: 'Data Quality & Clean', path: '/data-quality', icon: CheckCircle2 },
    ],
  },
  {
    title: 'Statistical Analytics',
    items: [
      { name: 'Exploratory (EDA)', path: '/exploratory-analysis', icon: BarChart2 },
      { name: 'Study-Time Analysis', path: '/study-time-analysis', icon: Clock },
      { name: 'Attendance Analysis', path: '/attendance-analysis', icon: UserCheck },
      { name: 'Group Comparisons (ANOVA)', path: '/group-comparison', icon: GitCompare },
    ],
  },
  {
    title: 'Research Synthesis',
    items: [
      { name: 'Statistical Results Matrix', path: '/statistical-results', icon: TableProperties },
      { name: 'Research Reports', path: '/reports', icon: FileSpreadsheet },
    ],
  },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-between border-r border-slate-800 p-3.5 select-none z-20">
      {/* Navigation Sections */}
      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Ethical Research Notice Box */}
      <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/70 text-[11px] text-slate-400 flex-shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Research Protocol</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-400">
          Observational statistical analysis. Does not assert causality or perform individual student ranking.
        </p>
      </div>
    </aside>
  );
};
