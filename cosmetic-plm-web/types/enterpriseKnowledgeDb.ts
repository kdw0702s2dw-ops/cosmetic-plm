export type KnowledgeStatus = "ACTIVE" | "WATCH" | "RESTRICTED" | "ARCHIVED";

export type GlobalInci = {
  id?: string;
  inci_code: string;
  inci_en: string;
  inci_kr: string | null;
  inci_cn: string | null;
  inci_jp: string | null;
  function_en: string | null;
  cas_no: string | null;
  ec_no: string | null;
  category: string | null;
  notes: string | null;
};

export type RegulationRule = {
  id?: string;
  rule_code: string;
  country: string;
  keyword: string;
  risk_type: string;
  rule_summary: string;
  recommended_action: string;
};

export type FormulaLibraryItem = {
  id?: string;
  library_code: string;
  formula_name: string;
  product_type: string;
  claim: string | null;
  key_ingredients: string | null;
  notes: string | null;
};

export type CompatibilityRule = {
  id?: string;
  compat_code: string;
  ingredient_a: string;
  ingredient_b: string;
  status: "GOOD" | "WATCH" | "BAD";
  risk_summary: string;
  recommendation: string;
};
