"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { DataRepairPreview, DataRepairResult } from "@/types/enterpriseV51DataRepair";

async function fetchAll(table: string) {
  const { data, error } = await supabaseProductionFinal.from(table).select("*").limit(5000);
  if (error) throw error;
  return data || [];
}

export async function fetchV51DataRepairPreview(): Promise<DataRepairPreview> {
  const [raws, formulas, lines] = await Promise.all([
    fetchAll("enterprise_raw_material_master"),
    fetchAll("gold_formula_headers"),
    fetchAll("gold_formula_lines"),
  ]);

  const rawCodes = new Set(raws.map((x: any) => x.raw_code).filter(Boolean));
  const lineGroups = new Map<string, any[]>();

  lines.forEach((line: any) => {
    const key = `${line.formula_code}__${line.revision}`;
    lineGroups.set(key, [...(lineGroups.get(key) || []), line]);
  });

  let wrong_total_formulas = 0;
  for (const [, group] of lineGroups) {
    const total = Number(group.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
    if (Math.abs(total - 100) > 0.001) wrong_total_formulas += 1;
  }

  return {
    wrong_total_formulas,
    orphan_lines: lines.filter((x: any) => !rawCodes.has(x.raw_code)).length,
    missing_inci_raws: raws.filter((x: any) => !x.inci_en && !x.inci_kr).length,
    missing_price_raws: raws.filter((x: any) => x.unit_price === null || x.unit_price === undefined || Number(x.unit_price) === 0).length,
  };
}

export async function repairWrongTotalsByWater(): Promise<DataRepairResult> {
  const lines = await fetchAll("gold_formula_lines");
  const groups = new Map<string, any[]>();

  lines.forEach((line: any) => {
    const key = `${line.formula_code}__${line.revision}`;
    groups.set(key, [...(groups.get(key) || []), line]);
  });

  let affected = 0;

  for (const [, group] of groups) {
    const total = Number(group.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
    const diff = Number((100 - total).toFixed(4));
    if (Math.abs(diff) <= 0.001) continue;

    const water = group.find((x: any) =>
      String(x.inci_en || "").toLowerCase() === "water" ||
      String(x.raw_name || "").includes("정제수") ||
      String(x.raw_name || "").toLowerCase().includes("water")
    );

    if (!water?.id) continue;

    const next = Number((Number(water.percentage || 0) + diff).toFixed(4));
    if (next < 0) continue;

    const { error } = await supabaseProductionFinal
      .from("gold_formula_lines")
      .update({ percentage: next, note: "v5.1 데이터 보정: 정제수 자동보정" })
      .eq("id", water.id);

    if (!error) affected += 1;
  }

  return {
    action: "정제수 자동보정",
    affected,
    message: `${affected}개 처방의 총합을 정제수 기준으로 보정했습니다.`,
  };
}

export async function createPlaceholderRawMaterialsForOrphans(): Promise<DataRepairResult> {
  const [raws, lines] = await Promise.all([
    fetchAll("enterprise_raw_material_master"),
    fetchAll("gold_formula_lines"),
  ]);

  const rawCodes = new Set(raws.map((x: any) => x.raw_code).filter(Boolean));
  const orphanCodes = Array.from(new Set(lines.filter((x: any) => !rawCodes.has(x.raw_code)).map((x: any) => x.raw_code).filter(Boolean)));

  if (orphanCodes.length === 0) {
    return { action: "누락 원료 임시 생성", affected: 0, message: "누락 원료가 없습니다." };
  }

  const inserts = orphanCodes.map((code) => {
    const ref = lines.find((x: any) => x.raw_code === code);
    return {
      raw_code: code,
      raw_name: ref?.raw_name || `임시원료 ${code}`,
      inci_en: ref?.inci_en || "",
      inci_kr: ref?.inci_kr || "",
      supplier: "미등록",
      unit_price: 0,
      note: "v5.1 데이터 보정: 처방 참조 누락으로 임시 생성",
    };
  });

  const { error } = await supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .insert(inserts);

  if (error) throw error;

  return {
    action: "누락 원료 임시 생성",
    affected: inserts.length,
    message: `${inserts.length}개 누락 원료를 임시 생성했습니다. 이후 원료마스터에서 INCI/CAS/단가를 보완하세요.`,
  };
}

export async function fillMissingPricesWithZero(): Promise<DataRepairResult> {
  const { data, error } = await supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .update({ unit_price: 0 })
    .or("unit_price.is.null")
    .select("raw_code");

  if (error) throw error;

  return {
    action: "단가 NULL 보정",
    affected: data?.length || 0,
    message: `단가 NULL 원료 ${data?.length || 0}건을 0으로 보정했습니다. 실제 단가는 추후 입력이 필요합니다.`,
  };
}

export async function saveDataRepairActivity(results: DataRepairResult[]) {
  const eventCode = `DATA-REPAIR-${Date.now().toString().slice(-8)}`;

  const { error } = await supabaseProductionFinal.from("enterprise_activity_events").insert({
    event_code: eventCode,
    area: "Data Repair",
    action: "AUTO_REPAIR",
    title: "v5.1 데이터 보정 실행",
    description: results.map((x) => `${x.action}: ${x.affected}건`).join(" / "),
    href: "/enterprise-v5/data-repair",
    created_by: "v5.1 Data Repair Assistant",
  });

  if (error) throw error;
  return eventCode;
}
