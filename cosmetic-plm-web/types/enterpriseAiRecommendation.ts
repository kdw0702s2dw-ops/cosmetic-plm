export type AiRecommendationType =
  | "SIMILAR_FORMULA"
  | "RAW_SUBSTITUTE"
  | "COST_OPTIMIZATION"
  | "STABILITY_PREDICTION"
  | "REGULATION_RISK"
  | "PH_RECOMMENDATION"
  | "PRESERVATIVE_SYSTEM"
  | "EMULSIFIER_SYSTEM";

export type AiRecommendationStatus = "OPEN" | "APPLIED" | "HOLD" | "REJECTED";

export type AiRecommendationRun = {
  id?: string;
  run_code: string;
  source_formula_code: string | null;
  source_revision: string | null;
  request_text: string;
  target_product_type: string | null;
  target_claim: string | null;
  target_cost_per_kg: number | null;
  target_country: string | null;
  result_json: Record<string, unknown>;
  status: "GENERATED" | "REVIEW" | "APPLIED" | "ARCHIVED";
  created_at?: string | null;
};

export type AiRecommendationItem = {
  id?: string;
  run_code: string;
  recommendation_type: AiRecommendationType;
  priority: "P0" | "P1" | "P2";
  title: string;
  message: string;
  expected_impact: string;
  status: AiRecommendationStatus;
};
