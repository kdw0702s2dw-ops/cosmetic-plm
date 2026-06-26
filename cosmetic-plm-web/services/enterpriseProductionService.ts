// Enterprise Production Pack Service

export function getProductionReadiness(input: {
  liveCrud: number;
  totalCrud: number;
  healthRisk: number;
}) {
  if (input.healthRisk > 0) return "WATCH";
  if (!input.totalCrud) return "RISK";
  return input.liveCrud / input.totalCrud >= 0.5 ? "GOOD" : "WATCH";
}

export function buildProductionHealth(area: string, status: string, message: string, action: string) {
  return { id: `health-${Date.now()}`, area, status, message, action };
}

export function canUseForWork(status: string) {
  return status === "GOOD" || status === "WATCH";
}
