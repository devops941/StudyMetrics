import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { DatasetsPage } from '../pages/DatasetsPage';
import { DataQualityPage } from '../pages/DataQualityPage';
import { ExploratoryAnalysisPage } from '../pages/ExploratoryAnalysisPage';
import { StudyTimeAnalysisPage } from '../pages/StudyTimeAnalysisPage';
import { AttendanceAnalysisPage } from '../pages/AttendanceAnalysisPage';
import { GroupComparisonPage } from '../pages/GroupComparisonPage';
import { StatisticalResultsPage } from '../pages/StatisticalResultsPage';
import { ReportsPage } from '../pages/ReportsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/data-quality" element={<DataQualityPage />} />
        <Route path="/exploratory-analysis" element={<ExploratoryAnalysisPage />} />
        <Route path="/study-time-analysis" element={<StudyTimeAnalysisPage />} />
        <Route path="/attendance-analysis" element={<AttendanceAnalysisPage />} />
        <Route path="/group-comparison" element={<GroupComparisonPage />} />
        <Route path="/statistical-results" element={<StatisticalResultsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
