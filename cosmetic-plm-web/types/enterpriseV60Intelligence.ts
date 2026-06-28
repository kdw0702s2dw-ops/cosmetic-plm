export type V60FormulaInsight = {
  formula_code: string;
  revision: string;
  formula_name?: string;
  total_percent: number;
  raw_count: number;
  estimated_cost_per_kg: number;
  inci_list: string;
  intelligence_score: number;
  stability_score: number;
  cost_score: number;
  compatibility_score: number;
  regulation_score: number;
  alerts: string[];
  recommendations: string[];
};

export type V60CompareResult = {
  base_formula: string;
  target_formula: string;
  added: any[];
  removed: any[];
  changed: any[];
  cost_difference: number;
  summary: string;
};

export type V60CompatibilityResult = {
  status: "Compatible" | "Warning" | "Conflict";
  score: number;
  messages: string[];
};

export type V60CostSimulation = {
  base_cost: number;
  simulated_cost: number;
  difference: number;
  margin_rate: number;
  selling_price: number;
};
