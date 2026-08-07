"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export const LOSS_RATE_PRESETS = [
  { key: "general", label: "일반성형", rate: 0.1 },
  { key: "square_patch", label: "사각패치", rate: 0.03 },
] as const;
export type LossRatePresetKey = (typeof LOSS_RATE_PRESETS)[number]["key"] | "custom";

export type InsolubleHgHeaderInput = {
  fabric_material_code: string;
  fabric_standard_weight: number;
  film_material_code: string;
  film_standard_weight: number;
  total_weight: number;
  cutting_line_no: string;
  cutting_area_a4_weight: number;
  a4_10x10_weight: number;
  loss_rate_preset_key: string | null;
  loss_rate: number;
  manual_notice_coat_amount: number | null;
  half_cut_width_cm: number;
  half_cut_height_cm: number;
};

export type InsolubleHgHeaderResult = {
  total_weight_max: number;
  coat_amount: number;
  coat_amount_max: number;
  area_ratio: number;
  cutting_line_coat_amount: number;
  loss_adjusted_coat_amount: number;
  nonwoven_weight: number;
  film_weight_full_cut: number;
  dcap_weight_full_cut: number;
  film_weight_half_cut: number;
  dcap_weight_half_cut: number;
};

export type SummaryRow = { loss_rate: number; loss_adjusted_coat_amount: number; dcap_weight: number; weight_97pct: number };

// 첨부 시트("51554 약손명가")의 수식을 그대로 재현한다. 반올림/단순화 없이 그대로 연쇄 계산.
export function calcHeader(input: InsolubleHgHeaderInput): InsolubleHgHeaderResult {
  const total_weight_max = input.total_weight + 0.5;
  const coat_amount = input.total_weight - (input.fabric_standard_weight + input.film_standard_weight);
  const coat_amount_max = total_weight_max - (input.fabric_standard_weight + input.film_standard_weight);
  const area_ratio = input.cutting_area_a4_weight / input.a4_10x10_weight;
  const cutting_line_coat_amount = coat_amount * area_ratio;
  const loss_adjusted_coat_amount = cutting_line_coat_amount - cutting_line_coat_amount * input.loss_rate;
  const nonwoven_weight = input.fabric_standard_weight * area_ratio;
  const film_weight_full_cut = input.film_standard_weight * area_ratio;
  const dcap_weight_full_cut = loss_adjusted_coat_amount + nonwoven_weight + film_weight_full_cut;
  const film_weight_half_cut = (input.film_standard_weight * input.half_cut_width_cm * input.half_cut_height_cm) / 100;
  const dcap_weight_half_cut = loss_adjusted_coat_amount + nonwoven_weight + film_weight_half_cut;
  return {
    total_weight_max, coat_amount, coat_amount_max, area_ratio, cutting_line_coat_amount, loss_adjusted_coat_amount,
    nonwoven_weight, film_weight_full_cut, dcap_weight_full_cut, film_weight_half_cut, dcap_weight_half_cut,
  };
}

// 하단 비교표: 로스율 10%/15%를 각각 적용했을 때의 결과를 실시간으로 계산 (시트의 정적 숫자를 재현하는 게 아님)
const SUMMARY_LOSS_RATES = [0.1, 0.15];
export function calcSummaryRows(cuttingLineCoatAmount: number, nonwovenWeight: number, filmWeightFullCut: number): SummaryRow[] {
  return SUMMARY_LOSS_RATES.map((rate) => {
    const loss_adjusted_coat_amount = cuttingLineCoatAmount - cuttingLineCoatAmount * rate;
    const dcap_weight = loss_adjusted_coat_amount + nonwovenWeight + filmWeightFullCut;
    const weight_97pct = dcap_weight * 0.97;
    return { loss_rate: rate, loss_adjusted_coat_amount, dcap_weight, weight_97pct };
  });
}

export type InsolubleHgSheet = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  note?: string;
  created_by?: string;
  created_at?: string;
} & InsolubleHgHeaderInput &
  Partial<InsolubleHgHeaderResult> & {
    summary_rows: SummaryRow[];
  };

export async function saveInsolubleHgSheet(sheet: InsolubleHgSheet) {
  const { id, ...payload } = sheet;
  const { data, error } = await supabaseProductionFinal
    .from("plm_insoluble_hg_sheets")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as InsolubleHgSheet;
}

export async function fetchInsolubleHgSheets(formulaCode: string, revision: string): Promise<InsolubleHgSheet[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_insoluble_hg_sheets")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as InsolubleHgSheet[];
}

export async function deleteInsolubleHgSheet(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_insoluble_hg_sheets").delete().eq("id", id);
  if (error) throw error;
}

// "10×10㎠ 도포량 기준(부자재 제외)" 참고값 - 처방/이력과 무관하게 여러 줄을 저장할 수 있는 전역 기준값 목록.
// 매번 계산할 때마다 새로 찾아 입력하지 않도록, 화면을 열 때 항상 마지막 저장된 줄들이 그대로 채워져 있게 한다.
export type InsolubleHgReferenceLine = {
  id: string;
  label: string | null;
  coat_amount_10x10_g: number | null;
  thickness_mm: number | null;
  sort_order: number;
};

export async function fetchInsolubleHgReferenceLines(): Promise<InsolubleHgReferenceLine[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_insoluble_hg_reference_settings")
    .select("id, label, coat_amount_10x10_g, thickness_mm, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as InsolubleHgReferenceLine[];
}

export async function addInsolubleHgReferenceLine(sortOrder: number): Promise<InsolubleHgReferenceLine> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_insoluble_hg_reference_settings")
    .insert({ label: null, coat_amount_10x10_g: null, thickness_mm: null, sort_order: sortOrder })
    .select("id, label, coat_amount_10x10_g, thickness_mm, sort_order")
    .single();
  if (error) throw error;
  return data as InsolubleHgReferenceLine;
}

export async function saveInsolubleHgReferenceLine(line: InsolubleHgReferenceLine) {
  const { id, ...rest } = line;
  const { error } = await supabaseProductionFinal
    .from("plm_insoluble_hg_reference_settings")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInsolubleHgReferenceLine(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_insoluble_hg_reference_settings").delete().eq("id", id);
  if (error) throw error;
}
