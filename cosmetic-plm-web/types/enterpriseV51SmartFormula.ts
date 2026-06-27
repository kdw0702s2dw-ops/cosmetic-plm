export type SmartFormulaResult = {
  total_percent: number;
  water_adjustment: number;
  estimated_cost_per_kg: number;
  estimated_ph: number;
  estimated_viscosity_cps: number;
  formula_score: number;
  stability_score: number;
  cost_score: number;
  regulation_score: number;
  inci_list: string;
  alerts: string[];
  recommendations: string[];
  batch_100kg: Array<{
    raw_code: string;
    raw_name: string;
    percentage: number;
    required_kg: number;
  }>;
};

export type SmartFormulaCountry = "KR" | "EU" | "CN" | "US" | "JP";
