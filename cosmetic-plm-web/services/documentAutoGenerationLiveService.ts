// Document Auto Generation Live Pack Service

export function getDocumentStatus(input: { hasFormulaFail: boolean; hasRegRisk: boolean }) {
  if (input.hasFormulaFail || input.hasRegRisk) return "REVIEW";
  return "GENERATED";
}

export function getDocumentFormat(documentType: string) {
  if (["Formula Sheet", "Ingredient Composition", "Full Ingredient List"].includes(documentType)) return "XLSX_READY";
  if (["Customer Summary", "Development Report"].includes(documentType)) return "PDF_READY";
  return "CSV";
}

export function canApproveDocument(status: string, blockerCount: number) {
  return blockerCount === 0 && (status === "GENERATED" || status === "REVIEW");
}

export function canLockDocument(status: string) {
  return status === "APPROVED";
}

export function buildDocumentNo(prefix: string, sequence: number) {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}
