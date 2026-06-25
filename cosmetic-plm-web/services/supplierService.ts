export function calculateSupplierRisk(totalScore: number) {
  if (totalScore >= 80) return "LOW";
  if (totalScore >= 60) return "MEDIUM";
  return "HIGH";
}
