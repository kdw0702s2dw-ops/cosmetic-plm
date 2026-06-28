"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { DataQualityIssue, DataQualitySummary } from "@/types/enterpriseV51DataQuality";

async function fetchAll(table: string) {
  const { data, error } = await supabaseProductionFinal.from(table).select("*").limit(5000);
  if (error) throw error;
  return data || [];
}

function issue(area: string, count: number, status: "정상" | "주의" | "오류", message: string): DataQualityIssue {
  return { area, count, status, message };
}

export async function fetchV51DataQuality(): Promise<DataQualitySummary> {
  const [raws, formulas, lines] = await Promise.all([
    fetchAll("enterprise_raw_material_master"),
    fetchAll("gold_formula_headers"),
    fetchAll("gold_formula_lines"),
  ]);

  const rawCodes = new Set(raws.map((x: any) => x.raw_code).filter(Boolean));
  const rawCodeCounts = new Map<string, number>();
  raws.forEach((x: any) => rawCodeCounts.set(x.raw_code, (rawCodeCounts.get(x.raw_code) || 0) + 1));

  const formulaKeys = new Set(formulas.map((x: any) => `${x.formula_code}__${x.revision}`));
  const lineGroups = new Map<string, any[]>();
  lines.forEach((line: any) => {
    const key = `${line.formula_code}__${line.revision}`;
    lineGroups.set(key, [...(lineGroups.get(key) || []), line]);
  });

  let wrongTotal = 0;
  for (const [, group] of lineGroups) {
    const total = Number(group.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
    if (Math.abs(total - 100) > 0.001) wrongTotal += 1;
  }

  const duplicateRawCodes = Array.from(rawCodeCounts.values()).filter((v) => v > 1).length;
  const missingInci = raws.filter((x: any) => !x.inci_en && !x.inci_kr).length;
  const missingCas = raws.filter((x: any) => !x.cas_no).length;
  const missingPrice = raws.filter((x: any) => x.unit_price === null || x.unit_price === undefined || Number(x.unit_price) === 0).length;
  const orphanLines = lines.filter((x: any) => !rawCodes.has(x.raw_code)).length;
  const formulaWithoutLines = formulas.filter((f: any) => !lineGroups.has(`${f.formula_code}__${f.revision}`)).length;

  const issues: DataQualityIssue[] = [
    issue("원료코드 중복", duplicateRawCodes, duplicateRawCodes === 0 ? "정상" : "오류", "동일 원료코드가 중복되면 처방 참조 오류가 발생할 수 있습니다."),
    issue("INCI 누락", missingInci, missingInci === 0 ? "정상" : "주의", "INCI 국문/영문 정보가 없으면 전성분 생성 정확도가 낮아집니다."),
    issue("CAS No. 누락", missingCas, missingCas === 0 ? "정상" : "주의", "CAS No. 누락 원료는 규제 검토 정확도가 낮아질 수 있습니다."),
    issue("단가 누락", missingPrice, missingPrice === 0 ? "정상" : "주의", "단가가 없으면 원가 계산 정확도가 낮아집니다."),
    issue("없는 원료 참조", orphanLines, orphanLines === 0 ? "정상" : "오류", "처방 원료라인이 원료 마스터에 없는 원료코드를 참조하고 있습니다."),
    issue("원료 없는 처방", formulaWithoutLines, formulaWithoutLines === 0 ? "정상" : "주의", "처방 Header는 있으나 원료라인이 없습니다."),
    issue("총합 100% 오류", wrongTotal, wrongTotal === 0 ? "정상" : "오류", "처방 총합이 100%가 아닌 처방입니다."),
  ];

  const errorCount = issues.filter((x) => x.status === "오류").length;
  const warnCount = issues.filter((x) => x.status === "주의").length;
  const score = Math.max(0, 100 - errorCount * 18 - warnCount * 7);
  const status = errorCount > 0 ? "오류" : warnCount > 0 ? "주의" : "정상";
  return { score, status, issues };
}

export async function createV51DataQualitySnapshot(summary: DataQualitySummary) {
  const eventCode = `DATA-QUALITY-${Date.now().toString().slice(-8)}`;

  const { error } = await supabaseProductionFinal.from("enterprise_activity_events").insert({
    event_code: eventCode,
    area: "Data Quality",
    action: "QUALITY_CHECK",
    title: `v5.1 데이터 품질 점검: ${summary.status}`,
    description: `데이터 품질 점수 ${summary.score}점`,
    href: "/enterprise-v5/data-quality",
    created_by: "v5.1 Data Quality",
  });

  if (error) throw error;
  return eventCode;
}
