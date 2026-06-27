export type AutopilotStatus = "READY" | "RUNNING" | "COMPLETED" | "NEEDS_REVIEW" | "FAILED";
export type AutopilotStepStatus = "TODO" | "RUNNING" | "DONE" | "SKIPPED" | "FAILED";

export type AutopilotRun = {
  id?: string;
  run_code: string;
  title: string;
  request_text: string;
  target_product_type: string | null;
  target_claim: string | null;
  target_cost_per_kg: number | null;
  target_country: string | null;
  generated_formula_code: string | null;
  generated_revision: string | null;
  status: AutopilotStatus;
  result_json: Record<string, unknown>;
  created_at?: string | null;
};

export type AutopilotStep = {
  id?: string;
  run_code: string;
  step_no: number;
  step_key: string;
  step_name: string;
  status: AutopilotStepStatus;
  message: string | null;
  output_json: Record<string, unknown>;
  created_at?: string | null;
};
