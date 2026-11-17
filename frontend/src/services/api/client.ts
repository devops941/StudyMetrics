import axios from 'axios';
import {
  DatasetMetadata,
  EDAResponse,
  CorrelationResult,
  GroupComparisonResult,
  AnalysisSession
} from '../../types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An unexpected API error occurred.';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// API Service Functions
export async function fetchHealth() {
  const res = await apiClient.get('/health');
  return res.data;
}

export async function uploadDataset(file: File): Promise<{ dataset_id: string; active_version_id: string; metadata: DatasetMetadata }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function createSampleDataset(n: number = 286): Promise<{ dataset_id: string; active_version_id: string; metadata: DatasetMetadata }> {
  const res = await apiClient.post(`/datasets/sample?n=${n}`);
  return res.data;
}

export async function listDatasets(): Promise<{ datasets: DatasetMetadata[] }> {
  const res = await apiClient.get('/datasets');
  return res.data;
}

export async function fetchDatasetPreview(id: string, limit: number = 20) {
  const res = await apiClient.get(`/datasets/${id}/preview?limit=${limit}`);
  return res.data;
}

export async function validateDataset(id: string, scoreMax: number = 100) {
  const res = await apiClient.post(`/datasets/${id}/validate?score_max=${scoreMax}`);
  return res.data;
}

export async function cleanDataset(id: string, actions: string[], scoreMax: number = 100) {
  const res = await apiClient.post(`/datasets/${id}/clean?score_max=${scoreMax}`, { actions });
  return res.data;
}

export async function fetchDatasetVersions(id: string) {
  const res = await apiClient.get(`/datasets/${id}/versions`);
  return res.data;
}

export async function fetchCleaningLogs(id: string) {
  const res = await apiClient.get(`/datasets/${id}/logs`);
  return res.data;
}

export async function runEDA(versionId: string, columns?: string[]): Promise<EDAResponse> {
  const res = await apiClient.post('/analysis/eda', {
    dataset_version_id: versionId,
    target_columns: columns,
  });
  return res.data;
}

export async function runCorrelation(versionId: string, xCol: string, yCol: string, method: string = 'pearson'): Promise<CorrelationResult> {
  const res = await apiClient.post('/analysis/correlation', {
    dataset_version_id: versionId,
    x_column: xCol,
    y_column: yCol,
    method,
  });
  return res.data;
}

export async function runGroupComparison(
  versionId: string,
  groupCol: string,
  targetCol: string,
  bins?: number[],
  binLabels?: string[],
  testType: string = 'auto'
): Promise<GroupComparisonResult> {
  const res = await apiClient.post('/analysis/group-comparison', {
    dataset_version_id: versionId,
    group_column: groupCol,
    target_column: targetCol,
    bins,
    bin_labels: binLabels,
    test_type: testType,
  });
  return res.data;
}

export async function createSession(title: string, datasetId?: string): Promise<AnalysisSession> {
  const res = await apiClient.post('/sessions', { title, dataset_id: datasetId });
  return res.data;
}

export async function downloadReportPdf(sessionId: string) {
  const res = await apiClient.post(`/reports/${sessionId}/pdf`, null, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `StudyMetrics_Report_${sessionId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadReportExcel(sessionId: string) {
  const res = await apiClient.post(`/reports/${sessionId}/excel`, null, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `StudyMetrics_Data_${sessionId}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
