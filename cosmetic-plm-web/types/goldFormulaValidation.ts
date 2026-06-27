export type ValidationSeverity = "INFO" | "WARNING" | "ERROR" | "BLOCKER";
export type ValidationStatus = "PASS" | "FAIL" | "WATCH";

export type FormulaValidationRun = {
  id?: string;
  formula_code: string;
  revision: string;
  total_percent: number;
  validation_status: ValidationStatus;
  issue_count: number;
  blocker_count: number;
  created_by: string | null;
  created_at?: string | null;
};

export type FormulaValidationIssue = {
  id?: string;
  run_id?: string | null;
  formula_code: string;
  revision: string;
  issue_type:
    | "TOTAL_PERCENT"
    | "DUPLICATE_RAW"
    | "PHASE"
    | "PERCENTAGE_RANGE"
    | "PROHIBITED_RAW"
    | "MISSING_INCI"
    | "MISSING_RAW"
    | "DOCUMENT";
  severity: ValidationSeverity;
  message: string;
  action: string;
  raw_code?: string | null;
  line_no?: number | null;
  created_at?: string | null;
};

export type FormulaLineForValidation = {
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

export type RawMaterialRule = {
  raw_code: string;
  raw_name: string;
  inci_en: string | null;
  inci_kr: string | null;
  cas_no: string | null;
  document_status: string | null;
};
