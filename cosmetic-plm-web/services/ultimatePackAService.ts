// Phase 46~50 Ultimate Pack A Service

export function calculateOpportunityScore(inputs: { marketFit: number; patentSpace: number; regulationFit: number; costFit: number }) {
  return Math.round(inputs.marketFit * 0.3 + inputs.patentSpace * 0.2 + inputs.regulationFit * 0.25 + inputs.costFit * 0.25);
}

export function calculateLaunchScore(inputs: { stability: number; regulation: number; cost: number; market: number }) {
  return Math.round(inputs.stability * 0.3 + inputs.regulation * 0.3 + inputs.cost * 0.2 + inputs.market * 0.2);
}

export function getFactoryRisk(batchKg: number) {
  if (batchKg >= 3000) return "HIGH";
  if (batchKg >= 1000) return "MEDIUM";
  return "LOW";
}

export function getDataQualityStatus(errorCount: number, warningCount: number) {
  if (errorCount > 0) return "RISK";
  if (warningCount > 0) return "WATCH";
  return "GOOD";
}

export function getDecisionStatus(aiRisk: string) {
  if (aiRisk === "HIGH") return "HOLD";
  if (aiRisk === "MEDIUM") return "WATCH";
  return "GO";
}
