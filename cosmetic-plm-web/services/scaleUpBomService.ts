// Phase 27 Scale-Up & BOM Engine Service

export function getBatchType(batchKg: number) {
  if (batchKg < 10) return "Lab";
  if (batchKg < 100) return "Pilot";
  if (batchKg < 1000) return "Production";
  return "Mass";
}

export function calculateRequiredKg(batchKg: number, percentage: number) {
  return Number((batchKg * (percentage / 100)).toFixed(4));
}

export function calculatePurchaseKg(requiredKg: number, lossPercent: number, yieldPercent: number) {
  return Number((requiredKg * (1 + lossPercent / 100) / (yieldPercent / 100)).toFixed(4));
}

export function calculateBomAmount(purchaseKg: number, unitPrice: number) {
  return Math.round(purchaseKg * unitPrice);
}

export function getScaleUpRiskLevel(input: { batchKg: number; hasExpiredDoc: boolean; hasHighRegRisk: boolean }) {
  if (input.hasExpiredDoc || input.hasHighRegRisk) return "HIGH";
  if (input.batchKg >= 100) return "MEDIUM";
  return "LOW";
}
