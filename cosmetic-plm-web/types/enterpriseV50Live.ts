export type LiveFormulaSummary = {
  formula_code: string;
  revision: string;
  formula_name: string;
  status: string | null;
  product_type: string | null;
  customer: string | null;
  target_country: string | null;
  claim: string | null;
  total_percent: number | null;
};

export type LiveFormulaLine = {
  id?: string;
  formula_code: string;
  revision: string;
  line_no: number;
  phase: string | null;
  raw_code: string;
  raw_name: string | null;
  inci_en: string | null;
  inci_kr: string | null;
  percentage: number;
  function_en: string | null;
  note?: string | null;
};

export type LiveRawMaterial = {
  raw_code: string;
  raw_name: string;
  inci_en?: string | null;
  inci_kr?: string | null;
  supplier?: string | null;
  unit_price?: number | null;
  cas_no?: string | null;
  ec_no?: string | null;
};

export type LiveDashboard = {
  formula_count: number;
  raw_count: number;
  document_count: number;
  batch_count: number;
  sample_count: number;
  ai_count: number;
};
