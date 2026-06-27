export type AiResearchMode =
  | "NEW_FORMULA"
  | "OPTIMIZE_COST"
  | "SUBSTITUTE_RAW"
  | "REGULATION_CHECK"
  | "STABILITY_REVIEW"
  | "DOCUMENT_PLAN"
  | "LAUNCH_PLAN";

export type AiResearchStatus = "DRAFT" | "GENERATED" | "REVIEW" | "APPLIED" | "ARCHIVED";

export type AiResearchProject = {
  id?: string;
  project_code: string;
  title: string;
  mode: AiResearchMode;
  target_product_type: string | null;
  target_claim: string | null;
  target_cost_per_kg: number | null;
  target_country: string | null;
  prompt: string;
  status: AiResearchStatus;
  result_json: Record<string, unknown>;
  created_by: string | null;
  created_at?: string | null;
};

export type AiGeneratedFormulaLine = {
  line_no: number;
  phase: string;
  raw_code: string;
  raw_name: string;
  inci_en: string;
  inci_kr: string;
  percentage: number;
  function_en: string;
  reason: string;
};

export type AiResearchAction = {
  id?: string;
  project_code: string;
  priority: "P0" | "P1" | "P2";
  category: "Formula" | "Cost" | "Regulation" | "Stability" | "Document" | "Launch";
  message: string;
  action: string;
  status: "OPEN" | "DONE" | "HOLD";
};
