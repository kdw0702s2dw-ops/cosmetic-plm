// Data Import & Validation Pack Service

export function validateFormulaTotal(totalPercent: number) {
  return Math.abs(totalPercent - 100) < 0.0001 ? "PASS" : "BLOCKED";
}

export function validateCompositionTotal(totalPercent: number) {
  return Math.abs(totalPercent - 100) < 0.0001 ? "PASS" : "ERROR";
}

export function validateCasFormat(casNo: string) {
  return /^\\d{2,7}-\\d{2}-\\d$/.test(casNo);
}

export function getImportStatus(blockerRows: number, errorRows: number, warningRows: number) {
  if (blockerRows > 0) return "BLOCKED";
  if (errorRows > 0) return "ERROR";
  if (warningRows > 0) return "WARNING";
  return "PASS";
}

export function canImport(status: string, approvalStatus: string) {
  return status === "PASS" && approvalStatus === "APPROVED";
}
