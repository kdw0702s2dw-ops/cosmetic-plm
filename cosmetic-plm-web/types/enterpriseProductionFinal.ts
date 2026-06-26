export type Status = "GOOD" | "WATCH" | "RISK";
export type CrudStatus = "LIVE" | "READY" | "NEEDS_TEST";
export type OutputFormat = "PDF" | "EXCEL" | "WORD" | "CSV";

export type ProductionModule =
  | "Formula"
  | "Ingredient"
  | "Supplier"
  | "Customer"
  | "Workflow"
  | "Approval"
  | "Document"
  | "Regulation"
  | "QMS"
  | "LIMS";

export type ProductionCrudRow = {
  id: string;
  module: ProductionModule;
  tableName: string;
  crudStatus: CrudStatus;
  operations: string;
  persistence: "Supabase DB" | "Local State";
  audit: "ON" | "OFF";
  nextAction: string;
};

export type ProductionDocumentRow = {
  id: string;
  documentType:
    | "Formula Sheet"
    | "Ingredient Composition"
    | "Full Ingredient List"
    | "Product Specification"
    | "Test Request"
    | "COA"
    | "MSDS"
    | "Customer Summary";
  format: OutputFormat;
  source: ProductionModule;
  status: "READY" | "GENERATED" | "NEEDS_REVIEW";
  fileName: string;
};

export type ProductionAiRow = {
  id: string;
  command: string;
  workflow: string;
  status: "READY" | "EXECUTED" | "HUMAN_REVIEW";
  confidence: number;
};

export type ProductionHealthRow = {
  id: string;
  area:
    | "Build"
    | "Deploy"
    | "Database"
    | "Security"
    | "Backup"
    | "Performance"
    | "Permission"
    | "User Readiness";
  status: Status;
  message: string;
  action: string;
};

export type ProductionFinalData = {
  crud: ProductionCrudRow[];
  documents: ProductionDocumentRow[];
  ai: ProductionAiRow[];
  health: ProductionHealthRow[];
};
