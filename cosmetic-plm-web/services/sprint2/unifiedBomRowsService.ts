"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type UnifiedBomRow = {
  id?: string;
  formula_code?: string;
  revision?: string;
  lot_no?: string | null; // 생산실적관리(plm_production_records)의 Lot No.와 연동. null = Lot 미지정(레거시 자료).
  row_no?: number;
  level_label?: string; // 내용: 완제품/충전품/절단품/코팅품/처방/부자재 (고정값 아님 - 자유 입력)
  item_code?: string; // 품번 (직접 타이핑, 자동 생성 없음)
  item_name?: string; // 품명
  change_note?: string; // 변경사항
  spec?: string; // 규격
};

// "내용" 칸 입력 보조용 추천 목록 - datalist로 추천만 하고 자유 입력도 그대로 허용한다.
export const UNIFIED_BOM_LEVEL_OPTIONS = ["완제품", "충전품", "절단품", "코팅품", "처방", "부자재"];

// lotNo가 undefined면 Lot 구분 없이(이 컬럼이 생기기 전 쿼리와 동일하게) 전부 조회하지 않고, 반드시
// null(미지정 레거시 자료) 또는 실제 Lot No. 중 하나로 명시해서 호출해야 한다 - 같은 처방 안에서도
// Lot마다 완전히 다른 BOM 내용이 섞여 나오면 안 되므로. null은 .is()로, 문자열은 .eq()로 비교.
export async function fetchUnifiedBomRows(formulaCode: string, revision: string, lotNo: string | null): Promise<UnifiedBomRow[]> {
  let q = supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("row_no", { ascending: true });
  q = lotNo === null ? q.is("lot_no", null) : q.eq("lot_no", lotNo);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as UnifiedBomRow[];
}

// 통합 BOM은 생산 BOM 전개와 동일하게 고유키가 없는 자유 행이라, 현재 처방+Lot 분을 전부 지우고
// 화면에 있는 순서 그대로 row_no(1,2,3...)를 다시 매겨서 넣는다. 행 순서를 바꾸면 그 순서가 그대로 저장됨.
// 삭제 범위도 조회와 동일하게 lot_no까지 반드시 맞춰야 한다 - 안 그러면 같은 처방의 다른 Lot 자료까지
// 같이 지워진다.
export async function saveUnifiedBomRows(formulaCode: string, revision: string, lotNo: string | null, rows: UnifiedBomRow[]): Promise<UnifiedBomRow[]> {
  let delQ = supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .delete()
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  delQ = lotNo === null ? delQ.is("lot_no", null) : delQ.eq("lot_no", lotNo);
  const { error: delError } = await delQ;
  if (delError) throw delError;

  const clean = rows.filter((r) => r.level_label || r.item_code || r.item_name || r.change_note || r.spec);
  if (clean.length === 0) return [];

  const payload = clean.map((r, i) => ({
    formula_code: formulaCode,
    revision,
    lot_no: lotNo,
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

// Lot 선택 목록에서 "기존 자료(Lot 미지정)" 항목을 보여줄지 판단하기 위한 존재 여부 확인 -
// lot_no 컬럼이 생기기 전에 저장된 레거시 행이 이 처방+Revision에 있는지만 가볍게 확인한다.
export async function hasLegacyUnifiedBomRows(formulaCode: string, revision: string): Promise<boolean> {
  const { count, error } = await supabaseProductionFinal
    .from("plm_unified_bom_rows")
    .select("id", { count: "exact", head: true })
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .is("lot_no", null);
  if (error) throw error;
  return (count || 0) > 0;
}
