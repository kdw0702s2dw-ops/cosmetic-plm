export type DocumentType =
  | "FORMULA_SHEET"
  | "INGREDIENT_COMPOSITION"
  | "FULL_INGREDIENT_LIST"
  | "PRODUCT_SPEC"
  | "COA"
  | "TEST_REQUEST"
  | "BOM"
  | "MANUFACTURING_SHEET"
  | "CUSTOMER_SUMMARY";

export type DocumentStatus = "DRAFT" | "GENERATED" | "REVIEW" | "APPROVED" | "LOCKED";

export type GoldDocument = {
  id?: string;
  document_code: string;
  formula_code: string;
  revision: string;
  document_type: DocumentType;
  title: string;
  format: "CSV" | "HTML" | "PDF_READY" | "EXCEL_READY" | "WORD_READY";
  status: DocumentStatus;
  content_json: Record<string, unknown>;
  created_by: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FormulaDocumentSource = {
  header: any | null;
  lines: any[];
  validation: any | null;
  cost: any | null;
  score: any | null;
  stability: any[];
  regulation: any[];
  recommendations: any[];
};
