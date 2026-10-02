"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type UnifiedBomRow = {
  id?: string;
  formula_code?: string;
  revision?: string;
  row_no?: number;
  level_label?: string; // 내용: 완제품/충전품/절단품/코팅품/처방/부자재 (고정값 아님 - 자유 입력)
  item_code?: string; // 품번 (직접 타이핑, 자동 생성 없음)
  item_name?: string; // 품명
  change_note?: string; // 변경사항
  spec?: string; // 규격
};

// "내용" 칸 입력 보조용 추천 목록 - datalist로 추천만 하고 자유 입력도 그대로 허용한다.
export const UNIFIED_BOM_LEVEL_OPTIONS = ["완제품", "충전품", "절단품", "코팅품", "처방", "부자재"];

export async function fetchUnifiedBomRows(formulaCode: string, revision: string): Promise<UnifiedBomRow[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("row_no", { ascending: true });

  if (error) throw error;
  return (data || []) as UnifiedBomRow[];
}

// 통합 BOM은 생산 BOM 전개와 동일하게 고유키가 없는 자유 행이라, 현재 처방분을 전부 지우고
// 화면에 있는 순서 그대로 row_no(1,2,3...)를 다시 매겨서 넣는다. 행 순서를 바꾸면 그 순서가 그대로 저장됨.
export async function saveUnifiedBomRows(formulaCode: string, revision: string, rows: UnifiedBomRow[]): Promise<UnifiedBomRow[]> {
  const { error: delError } = await supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (delError) throw delError;

  const clean = rows.filter((r) => r.level_label || r.item_code || r.item_name || r.change_note || r.spec);
  if (clean.length === 0) return [];

  const payload = clean.map((r, i) => ({
    formula_code: formulaCode,
    revision,
    row_no: i + 1,
    level_label: r.level_label || null,
    item_code: r.item_code || null,
    item_name: r.item_name || null,
    change_note: r.change_note || null,
    spec: r.spec || null,
  }));

  const { data, error } = await supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .insert(payload)
    .select();

  if (error) throw error;
  return (data || []) as UnifiedBomRow[];
}
