export type BatchStatus = "PLANNED" | "IN_PROGRESS" | "QC_HOLD" | "COMPLETED" | "RELEASED" | "CANCELED";
export type SampleStatus = "REQUESTED" | "FORMULATING" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type FinalStatus = "PASS" | "WATCH" | "BLOCK" | "RELEASED";

export type ManufacturingBatch = {
  id?: string;
  batch_no: string;
  formula_code: string;
  revision: string;
  batch_size_kg: number;
  status: BatchStatus;
  operator_name: string | null;
  equipment: string | null;
  note: string | null;
  created_at?: string | null;
};

export type ManufacturingMaterial = {
  id?: string;
  batch_no: string;
  line_no: number;
  phase: string | null;
  raw_code: string;
  raw_name: string | null;
  percentage: number;
  required_kg: number;
  checked: boolean;
};

export type ManufacturingStep = {
  id?: string;
  batch_no: string;
  step_no: number;
  step_name: string;
  instruction: string;
  status: "TODO" | "DONE" | "HOLD";
};

export type SampleRequest = {
  id?: string;
  sample_code: string;
  formula_code: string;
  revision: string;
  customer: string | null;
  purpose: string | null;
  due_date: string | null;
  status: SampleStatus;
  note: string | null;
  created_at?: string | null;
};

export type ExecutiveKpi = {
  formulas: number;
  raw_materials: number;
  documents: number;
  batches: number;
  samples: number;
  ai_runs: number;
  open_actions: number;
  release_ready: number;
};
