"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { V50AiFormulaLine } from "@/types/enterpriseV50AiPro";

function buildAiFormula(prompt: string): V50AiFormulaLine[] {
  const text = prompt.toLowerCase();
  const isSerum = text.includes("세럼") || text.includes("앰플") || text.includes("serum") || text.includes("ampoule");

  const cream: V50AiFormulaLine[] = [
    { phase: "A", raw_code: "RM-00001", raw_name: "정제수", inci_en: "Water", inci_kr: "정제수", percentage: 68.5, function_en: "용제", reason: "기본 수상 베이스" },
    { phase: "A", raw_code: "RM-00002", raw_name: "글리세린", inci_en: "Glycerin", inci_kr: "글리세린", percentage: 5, function_en: "보습", reason: "기본 보습" },
    { phase: "A", raw_code: "RM-00003", raw_name: "부틸렌글라이콜", inci_en: "Butylene Glycol", inci_kr: "부틸렌글라이콜", percentage: 6, function_en: "보습/용제", reason: "보습 및 사용감" },
    { phase: "B", raw_code: "RM-00041", raw_name: "스쿠알란", inci_en: "Squalane", inci_kr: "스쿠알란", percentage: 8, function_en: "유연화", reason: "장벽감 및 보습막" },
    { phase: "B", raw_code: "RM-00078", raw_name: "세테아릴알코올", inci_en: "Cetearyl Alcohol", inci_kr: "세테아릴알코올", percentage: 3, function_en: "유화안정", reason: "크림 안정화" },
    { phase: "B", raw_code: "RM-00081", raw_name: "글리세릴스테아레이트", inci_en: "Glyceryl Stearate", inci_kr: "글리세릴스테아레이트", percentage: 2.5, function_en: "유화제", reason: "유화 시스템" },
    { phase: "C", raw_code: "RM-00022", raw_name: "판테놀", inci_en: "Panthenol", inci_kr: "판테놀", percentage: 2, function_en: "진정", reason: "민감성 진정" },
    { phase: "C", raw_code: "RM-00036", raw_name: "세라마이드엔피", inci_en: "Ceramide NP", inci_kr: "세라마이드엔피", percentage: 0.5, function_en: "장벽", reason: "장벽 케어" },
    { phase: "A", raw_code: "RM-00009", raw_name: "카보머", inci_en: "Carbomer", inci_kr: "카보머", percentage: 0.3, function_en: "점증", reason: "점도 형성" },
    { phase: "C", raw_code: "RM-00163", raw_name: "페녹시에탄올", inci_en: "Phenoxyethanol", inci_kr: "페녹시에탄올", percentage: 0.8, function_en: "방부", reason: "방부 시스템" },
    { phase: "C", raw_code: "RM-00164", raw_name: "에틸헥실글리세린", inci_en: "Ethylhexylglycerin", inci_kr: "에틸헥실글리세린", percentage: 0.7, function_en: "방부보조", reason: "방부 보조" },
    { phase: "C", raw_code: "RM-00112", raw_name: "시트릭애씨드", inci_en: "Citric Acid", inci_kr: "시트릭애씨드", percentage: 2.7, function_en: "pH 조절", reason: "약산성 조정" },
  ];

  const serum: V50AiFormulaLine[] = [
    { phase: "A", raw_code: "RM-00001", raw_name: "정제수", inci_en: "Water", inci_kr: "정제수", percentage: 77, function_en: "용제", reason: "수상 베이스" },
    { phase: "A", raw_code: "RM-00002", raw_name: "글리세린", inci_en: "Glycerin", inci_kr: "글리세린", percentage: 5, function_en: "보습", reason: "보습" },
    { phase: "A", raw_code: "RM-00003", raw_name: "부틸렌글라이콜", inci_en: "Butylene Glycol", inci_kr: "부틸렌글라이콜", percentage: 7, function_en: "보습/용제", reason: "사용감" },
    { phase: "A", raw_code: "RM-00024", raw_name: "나이아신아마이드", inci_en: "Niacinamide", inci_kr: "나이아신아마이드", percentage: 5, function_en: "브라이트닝", reason: "미백 컨셉" },
    { phase: "A", raw_code: "RM-00022", raw_name: "판테놀", inci_en: "Panthenol", inci_kr: "판테놀", percentage: 3, function_en: "진정", reason: "민감성 완화" },
    { phase: "A", raw_code: "RM-00019", raw_name: "소듐하이알루로네이트", inci_en: "Sodium Hyaluronate", inci_kr: "소듐하이알루로네이트", percentage: 0.2, function_en: "보습", reason: "보습 강화" },
    { phase: "A", raw_code: "RM-00098", raw_name: "잔탄검", inci_en: "Xanthan Gum", inci_kr: "잔탄검", percentage: 0.3, function_en: "점증", reason: "점도 안정화" },
    { phase: "C", raw_code: "RM-00163", raw_name: "페녹시에탄올", inci_en: "Phenoxyethanol", inci_kr: "페녹시에탄올", percentage: 0.8, function_en: "방부", reason: "방부" },
    { phase: "C", raw_code: "RM-00164", raw_name: "에틸헥실글리세린", inci_en: "Ethylhexylglycerin", inci_kr: "에틸헥실글리세린", percentage: 0.7, function_en: "방부보조", reason: "방부 보조" },
    { phase: "C", raw_code: "RM-00112", raw_name: "시트릭애씨드", inci_en: "Citric Acid", inci_kr: "시트릭애씨드", percentage: 1, function_en: "pH 조절", reason: "pH 조정" },
  ];

  let lines = isSerum ? serum : cream;

  if (text.includes("원가") || text.includes("저가") || text.includes("2500")) {
    lines = lines.map((x) => x.inci_en === "Squalane" ? { ...x, percentage: 5, reason: `${x.reason} / 원가 절감 조정` } : x);
    const total = lines.reduce((sum, x) => sum + x.percentage, 0);
    lines[0] = { ...lines[0], percentage: Number((lines[0].percentage + (100 - total)).toFixed(4)) };
  }

  return lines;
}

export async function previewV50AiFormula(prompt: string) {
  const lines = buildAiFormula(prompt);
  return {
    formula_name: prompt.includes("앰플") || prompt.includes("세럼") ? "AI 생성 앰플/세럼" : "AI 생성 장벽 크림",
    product_type: prompt.includes("앰플") || prompt.includes("세럼") ? "Serum" : "Cream",
    claim: prompt.includes("미백") ? "Brightening / Moisturizing" : "Sensitive / Barrier / Moisturizing",
    target_country: prompt.includes("중국") ? "KR,CN" : "KR",
    lines,
    total: Number(lines.reduce((sum, x) => sum + x.percentage, 0).toFixed(4)),
  };
}

export async function saveV50AiFormula(prompt: string) {
  const result = await previewV50AiFormula(prompt);
  const formulaCode = `AI-F-${Date.now().toString().slice(-6)}`;
  const revision = "R0";

  const { error: headerError } = await supabaseProductionFinal
    .from("gold_formula_headers")
    .insert({
      formula_code: formulaCode,
      formula_name: result.formula_name,
      revision,
      status: "DRAFT",
      product_type: result.product_type,
      customer: "AI Research",
      target_country: result.target_country,
      claim: result.claim,
      created_by: "AI 연구원",
    });

  if (headerError) throw headerError;

  const formulaLines = result.lines.map((line, idx) => ({
    formula_code: formulaCode,
    revision,
    line_no: idx + 1,
    phase: line.phase,
    raw_code: line.raw_code,
    raw_name: line.raw_name,
    inci_en: line.inci_en,
    inci_kr: line.inci_kr,
    percentage: line.percentage,
    function_en: line.function_en,
    note: line.reason,
  }));

  const { error: lineError } = await supabaseProductionFinal.from("gold_formula_lines").insert(formulaLines);
  if (lineError) throw lineError;

  await supabaseProductionFinal.from("v40_ai_autopilot_runs").insert({
    run_code: `V50-AI-${Date.now().toString().slice(-6)}`,
    title: result.formula_name,
    request_text: prompt,
    target_product_type: result.product_type,
    target_claim: result.claim,
    target_cost_per_kg: prompt.includes("2500") ? 2500 : null,
    target_country: result.target_country,
    generated_formula_code: formulaCode,
    generated_revision: revision,
    status: "COMPLETED",
    result_json: result,
  });

  return { formulaCode, revision, result };
}
