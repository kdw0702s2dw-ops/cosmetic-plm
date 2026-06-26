// Real DB Operation Pack Service

export function canExecuteImport(validationStatus: string, approvalStatus: string) {
  return validationStatus === "PASS" && approvalStatus === "APPROVED";
}

export function getConnectionStatus(hasTable: boolean, rowCount: number) {
  if (!hasTable) return "NEEDS_SCHEMA";
  return rowCount >= 0 ? "CONNECTED" : "ERROR";
}

export function getOperationMetricStatus(value: number, warning: number, risk: number) {
  if (value >= risk) return "RISK";
  if (value >= warning) return "WATCH";
  return "GOOD";
}

export function getCorrectionSeverity(issueType: string) {
  if (issueType === "Composition" || issueType === "Regulation") return "BLOCKER";
  if (issueType === "Duplicate" || issueType === "Reference") return "HIGH";
  return "MEDIUM";
}

export function buildSearchIndexName(tableName: string) {
  return `idx_${tableName.replace(/^enterprise_/, "")}_search`;
}
