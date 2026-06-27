export type SmartDocumentPayload = {
  formula_code: string;
  revision: string;
  formula_name?: string;
  total_percent?: number;
  estimated_cost_per_kg?: number;
  estimated_ph?: number;
  estimated_viscosity_cps?: number;
  formula_score?: number;
  inci_list?: string;
};

export type SmartBatchScale = 30 | 50 | 100 | 300 | 500 | 1000;
