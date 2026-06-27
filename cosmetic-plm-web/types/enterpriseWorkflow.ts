export type WorkflowStatus = "READY" | "IN_PROGRESS" | "DONE" | "WATCH" | "BLOCK";

export type WorkflowStep = {
  step_no: number;
  step_key: string;
  title: string;
  description: string;
  href: string;
  status: WorkflowStatus;
  count: number;
  action_label: string;
};

export type WorkflowSummary = {
  formula_count: number;
  validation_count: number;
  cost_count: number;
  intelligence_count: number;
  document_count: number;
  release_ready_count: number;
  batch_count: number;
  ai_run_count: number;
};
