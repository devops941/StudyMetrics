import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-3.5 px-6 sm:px-8 mt-auto">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p className="font-medium text-slate-600">
          StudyMetrics &bull; Student Study-Time & Assessment Research
        </p>
        <p className="text-[11px] text-slate-400">
          &copy; 2026 Academic Research Study. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
