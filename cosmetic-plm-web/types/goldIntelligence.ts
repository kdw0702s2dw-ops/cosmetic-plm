export type IntelligenceStatus = "PASS" | "WATCH" | "FAIL" | "BLOCK";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IntelligenceFormula = {
  formula_code: string;
  revision: string;
  formula_name: string;
  status: string;
  total_percent: number;
  line_count: number;
  validation_status: string;
};

export type StabilityRisk = {
  id?: string;
  formula_code: string;
  revision: string;
  area: "pH" | "Viscosity" | "Temperature" | "FreezeThaw" | "Oxidation" | "Separation" | "Color" | "Odor" | "Packaging";
  risk_level: RiskLevel;
  message: string;
  recommendation: string;
};

export type RegulationRisk = {
  id?: string;
  formula_code: string;
  revision: string;
  country: "KR" | "EU" | "US" | "CN" | "JP" | "ASEAN";
  raw_code: string | null;
  risk_level: RiskLevel;
  message: string;
  recommendation: string;
};

export type FormulaScore = {
  formula_code: string;
  revision: string;
  validation_score: number;
  cost_score: number;
  stability_score: number;
  regulation_score: number;
  document_score: number;
  overall_score: number;
  status: IntelligenceStatus;
};

export type IntelligenceRecommendation = {
  id?: string;
  formula_code: string;
  revision: string;
  category: "Validation" | "Cost" | "Stability" | "Regulation" | "Document" | "Launch";
  priority: "P0" | "P1" | "P2";
  message: string;
  action: string;
};
