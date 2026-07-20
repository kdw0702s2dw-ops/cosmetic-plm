"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type ProductionQtyHeaderInput = {
  manufacture_qty_kg: number;
  loss_percent: number;
  coat_max_10x10: number;
  coating_length_cm: number;
  coating_width_cm: number;
  coating_loss_m: number;
};

export type ProductionQtyHeaderResult = {
  usable_weight_g: number;
  m_per_ea: number;
  coating_fabric_count: number;
  theoretical_qty_m: number;
  actual_qty_m: number;
};

export type ScenarioRowInput = {
  molded_size_m: number;
  cutting_line_qty: number;
};

export type ScenarioRow = ScenarioRowInput & { sample_qty: number };

export type ProductionQtySheet = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  note?: string;
  created_by?: string;
  created_at?: string;
} & ProductionQtyHeaderInput &
  Partial<ProductionQtyHeaderResult> & {
    scenario_rows: ScenarioRow[];
  };

// 첨부 시트("확인사항 210106 업데이트")의 수식을 그대로 재현한다. 반올림/단순화 없이 그대로 연쇄 계산.
// 순수사용가능중량(g) = (제조량 - 제조량*로스%/100) * 1000
// (m)/1EA = 코팅길이 / 100
// 코팅원단총수(개) = 순수사용가능중량 / ((코팅폭*코팅길이*도포량Max)/100)
// 이론적수량(m) = 코팅원단총수 * (m)/1EA
// 실제수량(m) = 이론적수량 - 코팅로스
export function calcHeader(input: ProductionQtyHeaderInput): ProductionQtyHeaderResult {
  const usable_weight_g = (input.manufacture_qty_kg - (input.manufacture_qty_kg * input.loss_percent) / 100) * 1000;
  const m_per_ea = input.coating_length_cm / 100;
  const coating_fabric_count = usable_weight_g / ((input.coating_width_cm * input.coating_length_cm * input.coat_max_10x10) / 100);
  const theoretical_qty_m = coating_fabric_count * m_per_ea;
  const actual_qty_m = theoretical_qty_m - input.coating_loss_m;
  return { usable_weight_g, m_per_ea, coating_fabric_count, theoretical_qty_m, actual_qty_m };
}

// 원단(m) = 실제수량(m) (헤더 계산값을 그대로 참조)
// 샘플수량 = 원단(m) * 칼선수량 / 성형품사이즈(m)
export function calcScenarioRow(row: ScenarioRowInput, actualQtyM: number): ScenarioRow {
  const sample_qty = (actualQtyM * row.cutting_line_qty) / row.molded_size_m;
  return { ...row, sample_qty };
}

// 문서관리와 동일한 처방 검색(코드/명/고객사/제품유형) - documentPdfService.fetchDocumentFormulas와 동일 쿼리 재사용
export async function searchProductionFormulas(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,product_type.ilike.%${k}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// 저장은 항상 새 이력 행 INSERT (덮어쓰기 없음 - 실험일지류와 동일하게 이력이 쌓이는 구조)
export async function saveProductionQtySheet(sheet: ProductionQtySheet) {
  const { id, ...payload } = sheet;
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_qty_sheets")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductionQtySheet;
}

export async function fetchProductionQtySheets(formulaCode: string, revision: string): Promise<ProductionQtySheet[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_qty_sheets")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ProductionQtySheet[];
}

export async function deleteProductionQtySheet(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_production_qty_sheets").delete().eq("id", id);
  if (error) throw error;
}
