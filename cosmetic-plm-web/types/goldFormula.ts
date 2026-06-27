export type FormulaStatus = "DRAFT" | "REVIEW" | "APPROVED" | "LOCKED" | "ARCHIVED";

export type FormulaHeader = {
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

export type FormulaLine = {
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

export type FormulaValidation = {
  totalPercent: number;
  lineCount: number;
  isValid100: boolean;
  message: string;
};
