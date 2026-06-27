import type { FormulaCostLine, FormulaCostSummary, CostOptimizationItem } from "@/types/goldFormulaCost";

export function calculateFormulaCost(input: {
  formulaCode: string;
  revision: string;
  lines: any[];
  targetCostPerKg?: number | null;
}) {
  const baseLines = input.lines.map((line) => {
    const unitPrice = Number(line.unit_price || 0);
    const percentage = Number(line.percentage || 0);
    const costPerKg = Number(((unitPrice * percentage) / 100).toFixed(4));

    return {
      formula_code: input.formulaCode,
      revision: input.revision,
      line_no: Number(line.line_no),
      phase: line.phase || "",
      raw_code: line.raw_code,
      raw_name: line.raw_name || "",
      inci_en: line.inci_en || "",
      percentage,
      unit_price: line.unit_price === null || line.unit_price === undefined ? null : unitPrice,
      cost_per_kg: costPerKg,
      cost_contribution_percent: 0,
      status: !line.unit_price ? "NO_PRICE" : "GOOD",
    } as FormulaCostLine;
  });

  const totalCostPerKg = Number(baseLines.reduce((sum, line) => sum + Number(line.cost_per_kg || 0), 0).toFixed(4));

  const lines = baseLines.map((line) => ({
    ...line,
    cost_contribution_percent: totalCostPerKg > 0 ? Number(((line.cost_per_kg / totalCostPerKg) * 100).toFixed(2)) : 0,
    status: line.unit_price === null || line.unit_price === 0 ? "NO_PRICE" as const : line.cost_per_kg / Math.max(totalCostPerKg, 1) > 0.25 ? "WATCH" as const : "GOOD" as const,
  }));

  const target = input.targetCostPerKg ?? null;
  const gap = target === null ? null : Number((totalCostPerKg - target).toFixed(4));

  const summary: FormulaCostSummary = {
    formula_code: input.formulaCode,
    revision: input.revision,
    total_cost_per_kg: totalCostPerKg,
    cost_10kg: Number((totalCostPerKg * 10).toFixed(2)),
    cost_100kg: Number((totalCostPerKg * 100).toFixed(2)),
    cost_500kg: Number((totalCostPerKg * 500).toFixed(2)),
    cost_1000kg: Number((totalCostPerKg * 1000).toFixed(2)),
    target_cost_per_kg: target,
    gap_per_kg: gap,
    status: target !== null && gap !== null && gap > 0 ? "OVER_TARGET" : lines.some((line) => line.status === "NO_PRICE") ? "NO_PRICE" : "GOOD",
  };

  const topCostLines = [...lines].sort((a, b) => b.cost_per_kg - a.cost_per_kg).slice(0, 10);

  const recommendations: CostOptimizationItem[] = topCostLines.map((line, index) => ({
    formula_code: input.formulaCode,
    revision: input.revision,
    raw_code: line.raw_code,
    raw_name: line.raw_name,
    current_cost_per_kg: line.cost_per_kg,
    recommendation: line.status === "NO_PRICE"
      ? "원료 단가를 먼저 입력하세요."
      : "동일 기능 원료 중 저가 공급사 또는 대체 원료 검토",
    expected_saving_per_kg: line.status === "NO_PRICE" ? 0 : Number((line.cost_per_kg * 0.1).toFixed(4)),
    priority: index < 3 ? "P0" : index < 6 ? "P1" : "P2",
  }));

  return { lines, summary, recommendations };
}
