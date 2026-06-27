export type AiCopilotCommandType =
  | "FORMULA_REVIEW"
  | "COST_OPTIMIZATION"
  | "STABILITY_REVIEW"
  | "REGULATION_REVIEW"
  | "DOCUMENT_PACKAGE"
  | "LAUNCH_READINESS";

export type AiCopilotStatus = "READY" | "RUNNING" | "COMPLETED" | "NEEDS_REVIEW" | "FAILED";

export type AiCopilotRun = {
  id?: string;
  run_code: string;
  formula_code: string;
  revision: string;
  command_type: AiCopilotCommandType;
  user_prompt: string;
  status: AiCopilotStatus;
  result_json: Record<string, unknown>;
  created_by: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AiCopilotAction = {
  id?: string;
  run_code: string;
  formula_code: string;
  revision: string;
  action_category: "Formula" | "Cost" | "Stability" | "Regulation" | "Document" | "Launch";
  priority: "P0" | "P1" | "P2";
  message: string;
  suggested_action: string;
  status: "OPEN" | "DONE" | "HOLD";
};
