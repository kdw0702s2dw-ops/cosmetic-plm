// Phase 26 Formula Simulation Engine Service

export function predictScaleCost(baseCost: number, batchKg: number) {
  if (batchKg >= 500) return Math.round(baseCost * 0.88);
  if (batchKg >= 100) return Math.round(baseCost * 0.92);
  if (batchKg >= 10) return Math.round(baseCost * 0.96);
  return Math.round(baseCost);
}

export function calculateSimulationScore(input: {
  costScore: number;
  stabilityScore: number;
  regulationScore: number;
}) {
  return Math.round(input.stabilityScore * 0.35 + input.regulationScore * 0.35 + input.costScore * 0.3);
}

export function getRiskLevel(score: number) {
  if (score >= 85) return "LOW";
  if (score >= 70) return "MEDIUM";
  return "HIGH";
}

export function estimateScaleViscosity(targetViscosity: number, batchKg: number) {
  if (batchKg >= 500) return Math.round(targetViscosity * 0.9);
  if (batchKg >= 100) return Math.round(targetViscosity * 0.95);
  if (batchKg >= 10) return Math.round(targetViscosity * 0.98);
  return Math.round(targetViscosity * 1.02);
}
