export type DocumentApprovalStatus = "DRAFT" | "REVIEW" | "APPROVED" | "REJECTED" | "LOCKED";
export type DocumentWorkflowStep = "R&D" | "QA" | "RA" | "QC" | "SALES" | "ADMIN";

export type GoldDocumentWorkflowTask = {
  id?: string;
  document_code: string;
  formula_code: string;
  revision: string;
  document_type: string;
  current_step: DocumentWorkflowStep;
  status: DocumentApprovalStatus;
  assignee: string | null;
  comment: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type GoldDocumentExportLog = {
  id?: string;
  document_code: string;
  export_format: "CSV" | "HTML" | "PDF_READY" | "EXCEL_READY" | "WORD_READY";
  file_name: string;
  exported_by: string | null;
  created_at?: string | null;
};
