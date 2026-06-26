// Phase 30 MES Bridge Service

export function generateWorkOrderNo(count: number, year = new Date().getFullYear()) {
  return `MO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export function generateLotNo(index: number, year = new Date().getFullYear()) {
  return `LOT-${year}-${String(index + 1).padStart(3, "0")}`;
}

export function canReleaseWorkOrder(input: { hasHighRisk: boolean; hasExpiredDocument: boolean }) {
  return !input.hasHighRisk && !input.hasExpiredDocument;
}

export function canCompleteWorkOrder(openDeviationCount: number) {
  return openDeviationCount === 0;
}

export function getMesStatusColor(status: string) {
  if (status === "COMPLETED") return "GOOD";
  if (status === "QC_HOLD" || status === "CANCELLED") return "RISK";
  if (status === "RELEASED" || status === "IN_PRODUCTION") return "WATCH";
  return "READY";
}
