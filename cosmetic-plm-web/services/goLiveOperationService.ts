// Phase 22 Go-Live Operation Service

export type OperationMode = "PRE_GO_LIVE" | "LIVE" | "MAINTENANCE";

export function getOperationStatusSummary<T extends { status: string }>(items: T[]) {
  return {
    total: items.length,
    active: items.filter((item) => item.status === "ACTIVE").length,
    monitoring: items.filter((item) => item.status === "MONITORING").length,
    issue: items.filter((item) => item.status === "ISSUE").length,
  };
}

export function getIssueSummary<T extends { severity: string; status: string }>(items: T[]) {
  return {
    total: items.length,
    open: items.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length,
    critical: items.filter((item) => item.severity === "CRITICAL").length,
    high: items.filter((item) => item.severity === "HIGH").length,
  };
}

export function canActivateLiveMode(checks: { status: string }[]) {
  return !checks.some((item) => item.status === "ISSUE");
}
