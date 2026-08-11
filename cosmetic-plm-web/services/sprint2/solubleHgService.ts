"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type SolubleHgHeaderInput = {
  component1_raw_code: string;
  component1_weight: number;
  component2_raw_code: string;
  component2_weight: number;
  component3_raw_code: string;
  component3_weight: number;
  total_weight: number;
  cutting_line_no: string;
  cutting_area_a4_weight: number;
  a4_10x10_weight: number;
  loss_rate_preset_key: string | null;
  loss_rate: number;
  manual_notice_coat_amount: number | null;
};

export type SolubleHgHeaderResult = {
  total_weight_max: number;
  coat_amount: number;
  coat_amount_max: number;
  area_ratio: number;
  cutting_line_coat_amount: number;
  loss_adjusted_coat_amount: number;
  standard_coating_amount: number;
  component1_material_weight: number;
  component2_material_weight: number;
  component3_material_weight: number;
  total_material_weight: number;
  min_total_weight: number;
  max_total_weight: number;
};

// 첨부 시트("41432 Taiki")의 수식을 그대로 재현한다. 반올림/단순화 없이 그대로 연쇄 계산.
// 관리기준 합계는 필름1+원단+필름2 세 값만 더한다(시트의 SUM(D14:F16) 표기와 달리, 실제 캐시값은
// D열 3칸 합으로만 재현되어야 일치함 - E/F열은 시각적 중복 표시).
export function calcHeader(input: SolubleHgHeaderInput): SolubleHgHeaderResult {
  const standardSum = input.component1_weight + input.component2_weight + input.component3_weight;
  const total_weight_max = input.total_weight + 0.6;
  const coat_amount = input.total_weight - standardSum;
  const coat_amount_max = total_weight_max - standardSum;
  const area_ratio = input.cutting_area_a4_weight / input.a4_10x10_weight;
  const cutting_line_coat_amount = coat_amount * area_ratio;
  const loss_adjusted_coat_amount = cutting_line_coat_amount - cutting_line_coat_amount * input.loss_rate;
  const standard_coating_amount = loss_adjusted_coat_amount * 1.078;
  const component1_material_weight = input.component1_weight * area_ratio;
  const component2_material_weight = input.component2_weight * area_ratio;
  const component3_material_weight = input.component3_weight * area_ratio;
  const total_material_weight = component1_material_weight + component2_material_weight + component3_material_weight;
  const min_total_weight = loss_adjusted_coat_amount + total_material_weight;
  const max_total_weight = standard_coating_amount + total_material_weight;
  return {
    total_weight_max, coat_amount, coat_amount_max, area_ratio, cutting_line_coat_amount, loss_adjusted_coat_amount,
    standard_coating_amount, component1_material_weight, component2_material_weight, component3_material_weight,
    total_material_weight, min_total_weight, max_total_weight,
  };
}

export type SolubleHgSheet = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  note?: string;
  created_by?: string;
  created_at?: string;
} & SolubleHgHeaderInput &
  Partial<SolubleHgHeaderResult>;

export async function saveSolubleHgSheet(sheet: SolubleHgSheet) {
  const { id, ...payload } = sheet;
  const { data, error } = await supabaseProductionFinal
    .from("plm_soluble_hg_sheets")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as SolubleHgSheet;
}

export async function fetchSolubleHgSheets(formulaCode: string, revision: string): Promise<SolubleHgSheet[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_soluble_hg_sheets")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as SolubleHgSheet[];
}

export async function deleteSolubleHgSheet(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_soluble_hg_sheets").delete().eq("id", id);
  if (error) throw error;
}

// "10×10㎠ 도포량 기준(부자재 제외)" 참고값 - 처방/이력과 무관하게 여러 줄을 저장할 수 있는 전역 기준값 목록.
// 불용성 HG와는 별도 데이터로 관리한다(공정이 달라 기준값이 다를 수 있음). 매번 계산할 때마다 새로 찾아
// 입력하지 않도록, 화면을 열 때 항상 마지막 저장된 줄들이 그대로 채워져 있게 한다.
export type SolubleHgReferenceLine = {
  id: string;
  label: string | null;
  coat_amount_10x10_g: number | null;
  thickness_mm: number | null;
  sort_order: number;
};

export async function fetchSolubleHgReferenceLines(): Promise<SolubleHgReferenceLine[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_soluble_hg_reference_settings")
    .select("id, label, coat_amount_10x10_g, thickness_mm, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as SolubleHgReferenceLine[];
}

export async function addSolubleHgReferenceLine(sortOrder: number): Promise<SolubleHgReferenceLine> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_soluble_hg_reference_settings")
    .insert({ label: null, coat_amount_10x10_g: null, thickness_mm: null, sort_order: sortOrder })
    .select("id, label, coat_amount_10x10_g, thickness_mm, sort_order")
    .single();
  if (error) throw error;
  return data as SolubleHgReferenceLine;
}

export async function saveSolubleHgReferenceLine(line: SolubleHgReferenceLine) {
  const { id, ...rest } = line;
  const { error } = await supabaseProductionFinal
    .from("plm_soluble_hg_reference_settings")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSolubleHgReferenceLine(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_soluble_hg_reference_settings").delete().eq("id", id);
  if (error) throw error;
}
