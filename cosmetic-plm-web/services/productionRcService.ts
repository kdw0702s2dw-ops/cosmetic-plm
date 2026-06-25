// Phase 20 Production Release Candidate Service
// Utility functions for production readiness and release candidate management.

export type ReadinessStatus = "PASS" | "WARN" | "FAIL";

export function getReadinessSummary(items: { status: ReadinessStatus }[]) {
  return {
    pass: items.filter((item) => item.status === "PASS").length,
    warn: items.filter((item) => item.status === "WARN").length,
    fail: items.filter((item) => item.status === "FAIL").length,
    total: items.length,
  };
}

export function canGoLive(items: { status: ReadinessStatus }[]) {
  return items.every((item) => item.status !== "FAIL");
}

export function createReleaseVersionLabel(prefix = "Enterprise RC") {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix} ${today}`;
}

export function lockReadyModules<T extends { status: string }>(items: T[]) {
  return items.map((item) =>
    item.status === "READY" ? { ...item, status: "LOCKED" } : item
  );
}
