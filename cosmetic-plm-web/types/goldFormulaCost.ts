export type CostStatus = "GOOD" | "WATCH" | "OVER_TARGET" | "NO_PRICE";

export type FormulaCostLine = {
  formula_code: string;
  revision: string;
  line_no: number;
  phase: string;
  raw_code: string;
  raw_name: string | null;
  inci_en: string | null;
  percentage: number;
  unit_price: number | null;
  cost_per_kg: number;
  cost_contribution_percent: number;
  status: CostStatus;
};

export type FormulaCostSummary = {
  formula_code: string;
  revision: string;
  total_cost_per_kg: number;
  cost_10kg: number;
  cost_100kg: number;
  cost_500kg: number;
  cost_1000kg: number;
  target_cost_per_kg: number | null;
  gap_per_kg: number | null;
  status: CostStatus;
  created_at?: string | null;
};

export type CostOptimizationItem = {
  id?: string;
  formula_code: string;
  revision: string;
  raw_code: string;
  raw_name: string | null;
  current_cost_per_kg: number;
  recommendation: string;
  expected_saving_per_kg: number;
  priority: "P0" | "P1" | "P2";
};
