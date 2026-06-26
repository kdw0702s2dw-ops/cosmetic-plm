// Phase 24 Enterprise v1.0 Stabilization Service

export function getStabilizationSummary<T extends { status: string; priority?: string }>(items: T[]) {
  return {
    total: items.length,
    stable: items.filter((item) => item.status === "STABLE").length,
    locked: items.filter((item) => item.status === "LOCKED").length,
    watch: items.filter((item) => item.status === "WATCH").length,
    fixRequired: items.filter((item) => item.status === "FIX_REQUIRED").length,
    p0Open: items.filter((item) => item.priority === "P0" && item.status !== "LOCKED").length,
  };
}

export function canLockV1Baseline<T extends { status: string; priority?: string }>(items: T[]) {
  return !items.some((item) => item.priority === "P0" && item.status === "FIX_REQUIRED");
}

export function getPostGoLiveProgress<T extends { status: string }>(items: T[]) {
  const done = items.filter((item) => item.status === "DONE").length;
  return {
    total: items.length,
    done,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
}
