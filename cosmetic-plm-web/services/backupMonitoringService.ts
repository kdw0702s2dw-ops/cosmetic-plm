// Phase 23 Backup / Monitoring / Error Center Service

export function getMonitoringSummary<T extends { status: string }>(items: T[]) {
  return {
    total: items.length,
    pass: items.filter((item) => item.status === "PASS").length,
    warn: items.filter((item) => item.status === "WARN").length,
    fail: items.filter((item) => item.status === "FAIL").length,
  };
}

export function getErrorSummary<T extends { severity: string; status: string }>(items: T[]) {
  return {
    total: items.length,
    open: items.filter((item) => item.status !== "RESOLVED").length,
    critical: items.filter((item) => item.severity === "CRITICAL" && item.status !== "RESOLVED").length,
    high: items.filter((item) => item.severity === "HIGH" && item.status !== "RESOLVED").length,
  };
}

export function createBackupTimestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function canOperateNormally(errors: { severity: string; status: string }[]) {
  return !errors.some((item) => item.severity === "CRITICAL" && item.status !== "RESOLVED");
}
