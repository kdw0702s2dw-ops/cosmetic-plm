export type FormulaStatus = "DRAFT" | "REVIEW" | "APPROVED" | "LOCKED" | "ARCHIVED";

export type FormulaHeaderLive = {
  id?: string;
  formula_code: string;
  formula_name: string;
  revision: string;
  status: FormulaStatus;
  product_type: string | null;
  customer: string | null;
  target_country: string | null;
  claim: string | null;
  created_by: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FormulaLineLive = {
  id?: string;
  formula_code: string;
  revision: string;
  line_no: number;
  phase: string;
  raw_code: string;
  raw_name: string | null;
  inci_en: string | null;
  inci_kr: string | null;
  percentage: number;
  function_en: string | null;
  note: string | null;
};

export type RawMaterialLookup = {
  raw_code: string;
  raw_name: string;
  inci_kr: string | null;
  inci_en: string | null;
  supplier: string | null;
  cas_no: string | null;
  ec_no: string | null;
};

export type FormulaSummaryLive = {
  formula_code: string;
  revision: string;
  formula_name: string;
  status: FormulaStatus;
  total_percent: number;
  line_count: number;
  ingredient_count: number;
  validation_status: "PASS" | "FAIL";
};

export type FormulaHistoryLive = {
  id?: string;
  formula_code: string;
  revision: string;
  action: string;
  payload: Record<string, unknown> | null;
  created_by: string | null;
  created_at?: string | null;
};
