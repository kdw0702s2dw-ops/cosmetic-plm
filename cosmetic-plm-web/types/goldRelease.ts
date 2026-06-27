export type ReleaseStatus = "READY" | "WATCH" | "BLOCK" | "RELEASED";

export type GoldReleaseKpi = {
  total_formulas: number;
  approved_formulas: number;
  locked_formulas: number;
  generated_documents: number;
  approved_documents: number;
  ai_runs: number;
  open_ai_actions: number;
  avg_score: number;
};

export type GoldReleaseCandidate = {
  formula_code: string;
  revision: string;
  formula_name: string;
  formula_status: string;
  overall_score: number | null;
  score_status: string | null;
  document_count: number;
  approved_document_count: number;
  open_ai_actions: number;
  release_status: ReleaseStatus;
};

export type GoldReleaseChecklist = {
  id?: string;
  formula_code: string;
  revision: string;
  checklist_item: string;
  area: "Formula" | "Validation" | "Cost" | "Intelligence" | "Document" | "AI" | "Approval" | "Release";
  status: "PASS" | "WATCH" | "FAIL";
  action: string;
  created_at?: string | null;
};
