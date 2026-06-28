"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type {
  V60FormulaInsight,
  V60CompareResult,
  V60CompatibilityResult,
  V60CostSimulation,
} from "@/types/enterpriseV60Intelligence";

export async function fetchV60FormulaOptions() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(150);

  if (error) throw error;
  return data || [];
}

export async function fetchV60FormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function enrichLines(lines: any[]) {
  const enriched = [];
  for (const line of lines) {
    const { data: raw } = await supabaseProductionFinal
      .from("enterprise_raw_material_master")
      .select("*")
      .eq("raw_code", line.raw_code)
      .maybeSingle();
    enriched.push({ ...line, raw_master: raw || {} });
  }
  return enriched;
}

export async function analyzeV60Formula(formula: any): Promise<V60FormulaInsight> {
  const lines = await fetchV60FormulaLines(formula.formula_code, formula.revision);
  const enriched = await enrichLines(lines);

  const total = Number(enriched.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const estimatedCost = Math.round(enriched.reduce((sum, x) => {
    return sum + (Number(x.percentage || 0) / 100) * Number(x.raw_master?.unit_price || 0);
  }, 0));

  const inciList = enriched
    .slice()
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .map((x) => x.inci_kr || x.inci_en || x.raw_name)
    .filter(Boolean)
    .join(", ");

  const alerts: string[] = [];
  const recommendations: string[] = [];

  if (Math.abs(total - 100) > 0.001) alerts.push(`처방 총합이 ${total}%입니다.`);
  if (estimatedCost === 0) alerts.push("단가 정보가 부족합니다.");
  if (estimatedCost > 3500) recommendations.push("고가 원료 대체 또는 함량 조정을 검토하세요.");

  const hasOil = enriched.some((x) => /oil|squalane|triglyceride|butter/i.test(String(x.inci_en || "")));
  const hasEmulsifier = enriched.some((x) => /stearate|polysorbate|lecithin|emuls/i.test(String(x.inci_en || x.function_en || "")));
  if (hasOil && !hasEmulsifier) alerts.push("오일성 원료가 있으나 유화 안정화 성분이 부족할 수 있습니다.");

  const highElectrolyte = enriched.some((x) => /sodium chloride|magnesium|zinc|salt/i.test(String(x.inci_en || "")));
  const carbomer = enriched.some((x) => /carbomer/i.test(String(x.inci_en || "")));
  if (highElectrolyte && carbomer) alerts.push("전해질과 카보머 조합은 점도 저하 가능성이 있습니다.");

  const costScore = estimatedCost === 0 ? 55 : estimatedCost <= 2500 ? 100 : estimatedCost <= 3500 ? 80 : 55;
  const stabilityScore = alerts.length === 0 ? 100 : alerts.length <= 2 ? 78 : 55;
  const compatibilityScore = carbomer && highElectrolyte ? 55 : 90;
  const regulationScore = enriched.some((x) => /retinol|salicylic|hydroquinone|triclosan/i.test(String(x.inci_en || ""))) ? 65 : 95;
  const totalScore = Math.round((costScore + stabilityScore + compatibilityScore + regulationScore) / 4);

  const insight: V60FormulaInsight = {
    formula_code: formula.formula_code,
    revision: formula.revision,
    formula_name: formula.formula_name,
    total_percent: total,
    raw_count: enriched.length,
    estimated_cost_per_kg: estimatedCost,
    inci_list: inciList,
    intelligence_score: totalScore,
    stability_score: stabilityScore,
    cost_score: costScore,
    compatibility_score: compatibilityScore,
    regulation_score: regulationScore,
    alerts,
    recommendations,
  };

  await supabaseProductionFinal.from("v60_cosmetic_intelligence_runs").insert({
    formula_code: formula.formula_code,
    revision: formula.revision,
    intelligence_score: totalScore,
    result_json: insight,
    created_by: "v6.0 Cosmetic Intelligence Suite",
  });

  return insight;
}

export async function compareV60Formulas(base: any, target: any): Promise<V60CompareResult> {
  const baseLines = await fetchV60FormulaLines(base.formula_code, base.revision);
  const targetLines = await fetchV60FormulaLines(target.formula_code, target.revision);

  const baseMap = new Map(baseLines.map((x) => [x.raw_code, x]));
  const targetMap = new Map(targetLines.map((x) => [x.raw_code, x]));

  const added = targetLines.filter((x) => !baseMap.has(x.raw_code));
  const removed = baseLines.filter((x) => !targetMap.has(x.raw_code));
  const changed = targetLines
    .filter((x) => baseMap.has(x.raw_code))
    .map((x) => {
      const old = baseMap.get(x.raw_code);
      return { ...x, old_percentage: Number(old?.percentage || 0), diff: Number((Number(x.percentage || 0) - Number(old?.percentage || 0)).toFixed(4)) };
    })
    .filter((x) => Math.abs(x.diff) > 0.001);

  const baseInsight = await analyzeV60Formula(base);
  const targetInsight = await analyzeV60Formula(target);

  const result: V60CompareResult = {
    base_formula: `${base.formula_code}/${base.revision}`,
    target_formula: `${target.formula_code}/${target.revision}`,
    added,
    removed,
    changed,
    cost_difference: targetInsight.estimated_cost_per_kg - baseInsight.estimated_cost_per_kg,
    summary: `추가 ${added.length}개, 삭제 ${removed.length}개, 변경 ${changed.length}개, 원가 차이 ${targetInsight.estimated_cost_per_kg - baseInsight.estimated_cost_per_kg}원`,
  };

  await supabaseProductionFinal.from("v60_formula_compare_runs").insert({
    base_formula_code: base.formula_code,
    base_revision: base.revision,
    target_formula_code: target.formula_code,
    target_revision: target.revision,
    result_json: result,
    created_by: "v6.0 Formula Compare",
  });

  return result;
}

export async function runV60Compatibility(formula: any): Promise<V60CompatibilityResult> {
  const lines = await fetchV60FormulaLines(formula.formula_code, formula.revision);
  const messages: string[] = [];
  let score = 100;

  const names = lines.map((x) => `${x.inci_en || ""} ${x.raw_name || ""}`.toLowerCase()).join(" | ");

  if (names.includes("carbomer") && (names.includes("sodium chloride") || names.includes("magnesium"))) {
    messages.push("카보머와 전해질 조합은 점도 저하 가능성이 있습니다.");
    score -= 25;
  }
  if (names.includes("niacinamide") && names.includes("citric acid")) {
    messages.push("나이아신아마이드와 낮은 pH 조합은 사용감/안정성 확인이 필요합니다.");
    score -= 10;
  }
  if (names.includes("retinol") && names.includes("ascorbic")) {
    messages.push("레티놀과 강한 산성 비타민C 조합은 안정성 확인이 필요합니다.");
    score -= 25;
  }

  const status = score < 65 ? "Conflict" : score < 85 ? "Warning" : "Compatible";
  const result: V60CompatibilityResult = { status, score, messages: messages.length ? messages : ["중요한 상용성 경고가 없습니다."] };

  await supabaseProductionFinal.from("v60_compatibility_runs").insert({
    formula_code: formula.formula_code,
    revision: formula.revision,
    status,
    score,
    result_json: result,
    created_by: "v6.0 Compatibility Engine",
  });

  return result;
}

export async function simulateV60Cost(formula: any, sellingPrice = 12000, priceIncreaseRate = 0): Promise<V60CostSimulation> {
  const insight = await analyzeV60Formula(formula);
  const simulatedCost = Math.round(insight.estimated_cost_per_kg * (1 + priceIncreaseRate / 100));
  const marginRate = sellingPrice ? Number((((sellingPrice - simulatedCost) / sellingPrice) * 100).toFixed(2)) : 0;

  const result = {
    base_cost: insight.estimated_cost_per_kg,
    simulated_cost: simulatedCost,
    difference: simulatedCost - insight.estimated_cost_per_kg,
    margin_rate: marginRate,
    selling_price: sellingPrice,
  };

  await supabaseProductionFinal.from("v60_cost_simulation_runs").insert({
    formula_code: formula.formula_code,
    revision: formula.revision,
    base_cost: result.base_cost,
    simulated_cost: result.simulated_cost,
    margin_rate: result.margin_rate,
    result_json: result,
    created_by: "v6.0 Cost Simulation",
  });

  return result;
}

export async function recommendV60Formula(prompt: string) {
  const lower = prompt.toLowerCase();
  const isSerum = lower.includes("세럼") || lower.includes("앰플");
  const isBarrier = lower.includes("장벽") || lower.includes("민감");
  const isBrightening = lower.includes("미백") || lower.includes("브라이트닝");

  const recommendations = [
    isSerum ? "가벼운 수상 베이스를 권장합니다." : "크림 제형은 유화 안정화 시스템을 우선 검토하세요.",
    isBarrier ? "판테놀, 세라마이드NP, 스쿠알란 조합을 추천합니다." : "기본 보습제로 글리세린/부틸렌글라이콜을 추천합니다.",
    isBrightening ? "나이아신아마이드 2~5% 범위 검토를 추천합니다." : "컨셉 성분은 0.5~3% 범위에서 시작하세요.",
    "Smart Formula Engine에서 총합, 원가, pH, 점도를 검토하세요.",
  ];

  const result = { prompt, recommendations, created_at: new Date().toISOString() };

  await supabaseProductionFinal.from("v60_ai_recommendation_runs").insert({
    prompt,
    result_json: result,
    created_by: "v6.0 AI Recommendation",
  });

  return result;
}
