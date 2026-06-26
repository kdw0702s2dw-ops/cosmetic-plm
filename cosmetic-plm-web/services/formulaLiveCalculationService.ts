// Formula Live Calculation Pack Service

export function calculateFormulaTotal(lines: { percentage: number }[]) {
  return Number(lines.reduce((sum, item) => sum + Number(item.percentage || 0), 0).toFixed(4));
}

export function calculateCostPerKg(percentage: number, unitPrice: number) {
  return Number((Number(unitPrice || 0) * Number(percentage || 0) / 100).toFixed(2));
}

export function calculateRequiredKg(batchKg: number, percentage: number) {
  return Number((Number(batchKg || 0) * Number(percentage || 0) / 100).toFixed(4));
}

export function calculateBreakdownContent(rawPercentage: number, compositionRatio: number) {
  return Number((Number(rawPercentage || 0) * Number(compositionRatio || 0) / 100).toFixed(6));
}

export function validateFormulaBeforeSave(input: { totalPercent: number; hasRegRisk: boolean; hasMissingRaw: boolean }) {
  if (Math.abs(input.totalPercent - 100) > 0.01) return "FAIL";
  if (input.hasRegRisk) return "FAIL";
  if (input.hasMissingRaw) return "WARNING";
  return "PASS";
}
