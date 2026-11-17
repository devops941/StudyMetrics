export interface DatasetMetadata {
  id: string;
  original_name: string;
  storage_key: string;
  checksum: string;
  file_size: number;
  source_type: 'upload' | 'synthetic';
  row_count: number;
  column_count: number;
  columns: string[];
  sheet_names?: string[];
  status: string;
  owner_id: string;
  created_at?: string;
}

export interface DescriptiveStat {
  column: string;
  n_valid: number;
  n_missing: number;
  mean: number | null;
  std: number | null;
  median: number | null;
  iqr: number | null;
  min: number | null;
  max: number | null;
  skewness: number | null;
}

export interface EDAResponse {
  statistics: DescriptiveStat[];
  histograms: Record<string, { counts: number[]; bin_edges: number[]; bin_labels: string[] }>;
  boxplots: Record<string, { min: number; q1: number; median: number; q3: number; max: number; outliers: number[] }>;
}

export interface CorrelationResult {
  method: 'pearson' | 'spearman';
  x: string;
  y: string;
  n: number;
  estimate: number;
  p_value: number;
  confidence_interval?: [number, number] | null;
  t_statistic?: number | null;
  is_statistically_significant: boolean;
  causality_note: string;
  interpretation: string;
  slope?: number | null;
  intercept?: number | null;
  r_squared?: number | null;
  std_err?: number | null;
  scatter_points?: Array<{ x: number; y: number }>;
}

export interface GroupSummary {
  group_name: string;
  n: number;
  mean: number;
  std: number;
  median: number;
  iqr: number;
  min?: number;
  max?: number;
  q25?: number;
  q75?: number;
}

export interface PairwiseContrast {
  comparison: string;
  group_a: string;
  group_b: string;
  diff: number;
  p_value: number;
  cohens_d: number;
  significant: boolean;
}

export interface GroupComparisonResult {
  test_name: string;
  groups: GroupSummary[];
  test_statistic: number;
  p_value: number;
  degrees_of_freedom?: number;
  effect_size?: { metric: string; value: number };
  is_significant: boolean;
  assumptions_note: string;
  interpretation: string;
  pairwise_contrasts?: PairwiseContrast[];
}

export interface AnalysisSession {
  id: string;
  title: string;
  dataset_id?: string;
  active_version_id?: string;
  status: string;
  settings: {
    score_max: number;
    significance_level: number;
    attendance_threshold: number;
  };
}
