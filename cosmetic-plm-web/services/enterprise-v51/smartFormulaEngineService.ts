"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { SmartFormulaResult, SmartFormulaCountry } from "@/types/enterpriseV51SmartFormula";

export async function fetchSmartFormulaLines(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchSmartFormulaOptions() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function updateSmartFormulaLinePercent(id: string, percentage: number) {
  const { error } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .update({ percentage })
    .eq("id", id);

  if (error) throw error;
}

export async function runSmartFormulaEngine(
  formulaCode: string,
  revision: string,
  countries: SmartFormulaCountry[] = ["KR", "EU", "CN", "US", "JP"]
): Promise<SmartFormulaResult> {
  const lines = await fetchSmartFormulaLines(formulaCode, revision);

  const enriched = [];
  for (const line of lines) {
    const { data: raw } = await supabaseProductionFinal
      .from("enterprise_raw_material_master")
      .select("unit_price, function_en, cas_no, ec_no")
      .eq("raw_code", line.raw_code)
      .maybeSingle();

    enriched.push({ ...line, raw_master: raw || {} });
  }

  const total = Number(enriched.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const water = enriched.find((x) => String(x.inci_en || "").toLowerCase() === "water" || String(x.raw_name || "").includes("정제수"));
  const waterAdjustment = Number((100 - total).toFixed(4));

  const estimatedCost = Math.round(
    enriched.reduce((sum, x) => {
      const unitPrice = Number(x.raw_master?.unit_price || 0);
      return sum + (Number(x.percentage || 0) / 100) * unitPrice;
    }, 0)
  );

  const acid = enriched.some((x) => String(x.inci_en || "").toLowerCase().includes("citric"));
  const niacinamide = enriched.some((x) => String(x.inci_en || "").toLowerCase().includes("niacinamide"));
  const carbomerPct = enriched
    .filter((x) => String(x.inci_en || "").toLowerCase().includes("carbomer"))
    .reduce((sum, x) => sum + Number(x.percentage || 0), 0);
  const gumPct = enriched
    .filter((x) => String(x.inci_en || "").toLowerCase().includes("xanthan") || String(x.inci_en || "").toLowerCase().includes("cellulose"))
    .reduce((sum, x) => sum + Number(x.percentage || 0), 0);

  const estimatedPh = Number((acid ? (niacinamide ? 5.8 : 5.4) : (niacinamide ? 6.2 : 5.8)).toFixed(2));
  const estimatedViscosity = Math.round(3500 + carbomerPct * 42000 + gumPct * 18000);

  const alerts: string[] = [];
  const recommendations: string[] = [];

  if (Math.abs(total - 100) > 0.001) {
    alerts.push(`처방 총합이 ${total}%입니다. 100% 보정이 필요합니다.`);
    if (water) recommendations.push(`정제수 함량을 ${Number((Number(water.percentage) + waterAdjustment).toFixed(4))}%로 조정하면 총합 100%가 됩니다.`);
  }
  if (estimatedCost === 0) alerts.push("원료 단가 정보가 부족하여 원가 계산 정확도가 낮습니다.");
  if (estimatedCost > 2500) recommendations.push(`예상 원가 ${estimatedCost.toLocaleString()}원/kg입니다. 고가 원료 대체를 검토하세요.`);
  if (estimatedPh < 4.8 || estimatedPh > 7.2) alerts.push(`예상 pH ${estimatedPh}입니다. 피부 사용감 및 안정성 확인이 필요합니다.`);
  if (estimatedViscosity > 60000) alerts.push(`예상 점도 ${estimatedViscosity.toLocaleString()} cps입니다. 충진성과 사용감을 확인하세요.`);

  const riskKeywords = ["retinol", "salicylic", "hydroquinone", "triclosan"];
  const risky = enriched.filter((x) => riskKeywords.some((k) => String(x.inci_en || "").toLowerCase().includes(k)));
  if (risky.length > 0) alerts.push(`규제 검토 필요 성분 후보: ${risky.map((x) => x.inci_en).join(", ")}`);

  const inciList = enriched
    .slice()
    .sort((a, b) => Number(b.percentage || 0) - Number(a.percentage || 0))
    .map((x) => x.inci_kr || x.inci_en || x.raw_name)
    .filter(Boolean)
    .join(", ");

  const totalScore = Math.abs(total - 100) < 0.001 ? 25 : 10;
  const costScore = estimatedCost === 0 ? 10 : estimatedCost <= 2500 ? 25 : estimatedCost <= 3500 ? 18 : 10;
  const stabilityScore = alerts.length === 0 ? 25 : alerts.length <= 2 ? 18 : 10;
  const regulationScore = risky.length === 0 ? 25 : 10;
  const formulaScore = totalScore + costScore + stabilityScore + regulationScore;

  const batch100kg = enriched.map((x) => ({
    raw_code: x.raw_code,
    raw_name: x.raw_name,
    percentage: Number(x.percentage || 0),
    required_kg: Number((Number(x.percentage || 0) * 100 / 100).toFixed(4)),
  }));

  const result: SmartFormulaResult = {
    total_percent: total,
    water_adjustment: waterAdjustment,
    estimated_cost_per_kg: estimatedCost,
    estimated_ph: estimatedPh,
    estimated_viscosity_cps: estimatedViscosity,
    formula_score: formulaScore,
    stability_score: stabilityScore,
    cost_score: costScore,
    regulation_score: regulationScore,
    inci_list: inciList,
    alerts,
    recommendations,
    batch_100kg: batch100kg,
  };

  await supabaseProductionFinal
    .from("v51_smart_formula_runs")
    .insert({
      formula_code: formulaCode,
      revision,
      target_countries: countries,
      total_percent: total,
      estimated_cost_per_kg: estimatedCost,
      estimated_ph: estimatedPh,
      estimated_viscosity_cps: estimatedViscosity,
      formula_score: formulaScore,
      result_json: result,
      created_by: "v5.1 Smart Formula Engine",
    });

  return result;
}

export async function applySmartWaterAdjustment(formulaCode: string, revision: string) {
  const lines = await fetchSmartFormulaLines(formulaCode, revision);
  const total = Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const diff = Number((100 - total).toFixed(4));
  const water = lines.find((x) => String(x.inci_en || "").toLowerCase() === "water" || String(x.raw_name || "").includes("정제수"));

  if (!water?.id) throw new Error("정제수 라인을 찾을 수 없습니다.");

  const next = Number((Number(water.percentage || 0) + diff).toFixed(4));
  await updateSmartFormulaLinePercent(water.id, next);
  return { water, next };
}
