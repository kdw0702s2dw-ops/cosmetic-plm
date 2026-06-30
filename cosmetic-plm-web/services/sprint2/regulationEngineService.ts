"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type RegulationRegion = "KR" | "EU" | "CN" | "US" | "JP" | "ASEAN";

export async function fetchRegulationRules(region: RegulationRegion | "ALL" = "ALL") {
  let q = supabaseProductionFinal.from("plm_regulatory_rules").select("*").eq("is_active", true).order("region").order("ingredient_keyword");
  if (region !== "ALL") q = q.eq("region", region);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchRegulationAlerts(region: RegulationRegion | "ALL" = "ALL") {
  let q = supabaseProductionFinal.from("plm_regulatory_alerts").select("*").order("created_at", { ascending: false }).limit(300);
  if (region !== "ALL") q = q.eq("region", region);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchRegulationFormulas(keyword = "") {
  let q = supabaseProductionFinal.from("plm_formulas").select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,product_type.ilike.%${k}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchFormulaLinesForRegulation(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal.from("plm_formula_lines").select("*").eq("formula_code", formulaCode).eq("revision", revision).order("line_no");
  if (error) throw error;
  return data || [];
}

function includesAny(line: any, value: any) {
  const keyword = String(value || "").trim().toLowerCase();
  if (!keyword) return false;
  const text = [line.raw_name, line.inci_kr, line.inci_en, line.cas_no, line.function_kr, line.function_en].join(" ").toLowerCase();
  return text.includes(keyword);
}

function matchRule(rule: any, line: any) {
  return includesAny(line, rule.ingredient_keyword) || includesAny(line, rule.ingredient_name_kr) || includesAny(line, rule.ingredient_name_en);
}

function buildIssue(rule: any, percent: number) {
  const max = rule.max_percent === null || rule.max_percent === undefined ? null : Number(rule.max_percent);
  if (rule.allowed_status === "BANNED") return { isAlert: true, issue: "사용금지 또는 사용불가 검토 대상입니다.", action: "해당 국가 출시 처방에서 제외하거나 대체 원료를 검토하세요." };
  if (rule.allowed_status === "REVIEW_REQUIRED") return { isAlert: true, issue: "별도 규제/신원료/라벨 검토가 필요합니다.", action: "규제 담당자 확인 후 출시 국가별 사용 가능 여부를 확정하세요." };
  if (rule.allowed_status === "LIMITED" && max !== null && percent > max) return { isAlert: true, issue: `허용 기준 ${max}% 초과 가능성이 있습니다.`, action: `최종 함량이 기준(${max}%) 이하가 되도록 함량 조정을 검토하세요.` };
  if (rule.allowed_status === "LIMITED") return { isAlert: true, issue: `제한성분입니다. 기준 ${max ?? "-"}% 이내 여부를 확인하세요.`, action: "제한기준과 실제 최종함량을 확인하세요." };
  return { isAlert: false, issue: "", action: "" };
}

export async function validateFormulaRegulation(formula: any, regions: RegulationRegion[]) {
  const [lines, rules] = await Promise.all([fetchFormulaLinesForRegulation(formula.formula_code, formula.revision), fetchRegulationRules("ALL")]);
  const activeRules = rules.filter((r: any) => regions.includes(r.region));
  const alerts: any[] = [];

  for (const line of lines) {
    for (const rule of activeRules) {
      if (!matchRule(rule, line)) continue;
      const percent = Number(line.percentage || 0);
      const found = buildIssue(rule, percent);
      if (!found.isAlert) continue;
      alerts.push({
        formula_code: formula.formula_code,
        revision: formula.revision,
        formula_name: formula.formula_name,
        region: rule.region,
        rule_code: rule.rule_code,
        warning_level: rule.warning_level,
        ingredient_keyword: rule.ingredient_keyword,
        raw_name: line.raw_name,
        inci_kr: line.inci_kr,
        inci_en: line.inci_en,
        cas_no: line.cas_no,
        formula_percent: percent,
        max_percent: rule.max_percent,
        issue: found.issue,
        action_suggestion: found.action,
        status: "OPEN",
      });
    }
  }

  await supabaseProductionFinal.from("plm_regulatory_alerts").delete().eq("formula_code", formula.formula_code).eq("revision", formula.revision).in("region", regions);
  if (alerts.length > 0) {
    const { error } = await supabaseProductionFinal.from("plm_regulatory_alerts").insert(alerts);
    if (error) throw error;
  }
  return alerts;
}

export async function validateAllRecentFormulas(regions: RegulationRegion[]) {
  const formulas = await fetchRegulationFormulas("");
  const results = [];
  for (const formula of formulas.slice(0, 50)) {
    const alerts = await validateFormulaRegulation(formula, regions);
    results.push({ formula, alerts });
  }
  return results;
}

export async function updateRegulationAlertStatus(id: string, status: "OPEN" | "CONFIRMED" | "RESOLVED" | "IGNORED") {
  const { data, error } = await supabaseProductionFinal.from("plm_regulatory_alerts").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
