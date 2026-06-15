export type AttentionLabel = "Focused" | "Distracted" | "Impulsive";

export interface FeatureScores {
  response_length:   number;
  sentiment:         number;
  topic_shift_score: number;
  engagement_score:  number;
  latency_score:     number;
}

export interface AnalyzeRequest {
  teacher_prompt:            string;
  student_response:          string;
  response_latency:          number;
  previous_attention_state?: AttentionLabel | null;
  current_bas:               number;
  bas_history:               number[];
}

export interface AnalyzeResponse {
  features:                  FeatureScores;
  attention_state:           AttentionLabel;
  confidence:                number;
  reward:                    number;
  current_bas:               number;
  bas_history:               number[];
  previous_attention_state:  AttentionLabel | null;
  intervention:              string;
  rationale:                 string;
  tier:                      string;
}

export interface DatasetRecord {
  id:                number;
  teacher_prompt:    string;
  student_response:  string;
  response_latency:  number;
  attention_label:   AttentionLabel;
}

export interface DatasetStats {
  total:         number;
  focused:       number;
  distracted:    number;
  impulsive:     number;
  avg_latency:   number;
  avg_resp_len:  number;
}

export interface DatasetResponse {
  records: DatasetRecord[];
  stats:   DatasetStats;
  total:   number;
  offset:  number;
  limit:   number;
}

export interface SimulateResponse {
  phenotype:    string;
  sequence:     AttentionLabel[];
  bas_history:  number[];
  rewards:      number[];
  final_bas:    number;
  mean_bas:     number;
  min_bas:      number;
  max_bas:      number;
  iiv:          number;
  n_focused:    number;
  n_distracted: number;
  n_impulsive:  number;
}

export interface InterventionResponse {
  intervention: string;
  rationale:    string;
  tier:         string;
  label:        string;
}

export interface ResultsData {
  accuracy:     number;
  precision:    number;
  recall:       number;
  f1:           number;
  dataset_size: number;
  per_class: Record<string, { precision: number; recall: number; f1: number }>;
  confusion_matrix: number[][];
  label_names: string[];
}
