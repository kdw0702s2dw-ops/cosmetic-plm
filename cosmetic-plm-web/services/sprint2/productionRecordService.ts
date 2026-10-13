"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type ProductionRecord = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  product_name?: string; // 처방 컨펌 후 확정된 제품명(plm_formulas.product_name) 저장 시점 스냅샷 - 미입력이면 화면에서 formula_name으로 대체 표시
  target_qty_kg: number;
  lot_no: string;
  coating_qty: number | null; // 코팅량 (단위: m)
  molded_qty: number | null; // 성형품 수량 (단위: EA)
  shipped_qty_ea: number | null; // 완제품 출고 수량 (단위: EA)
  shipped_qty_pack: number | null; // 완제품 출고 수량 (단위: PACK)
  production_date: string; // YYYY-MM-DD
  exp_date?: string | null; // YYYY-MM-DD
  note?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string; // 수정 기능 추가 후부터 기록 - 신규 등록 시점엔 비어있음
};

// 저장은 항상 새 이력 행 INSERT (원장 성격 - 덮어쓰기 없음). Lot No.는 같은 처방(formula_code+revision)
// 내에서만 유일하도록 DB UNIQUE(formula_code, revision, lot_no) 제약이 걸려 있음 - 위반 시 23505.
export async function saveProductionRecord(record: ProductionRecord) {
  const { id, ...payload } = record;
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_records")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 Lot No.입니다 (같은 처방 내에서 중복될 수 없습니다).");
    }
    throw error;
  }
  return data as ProductionRecord;
}

// 생산실적 수정 - 처방(formula_code/revision/formula_name/confirmed_code/product_name)은 바꿀 수
// 없다. Lot No. 유일성 제약이 처방 단위라 처방을 바꾸면 그 제약의 의미가 달라지므로, 처방 자체를
// 바꿔야 하면 기존 실적을 삭제하고 새로 등록하도록 한다. Lot No.를 다른 값으로 바꾸면 같은 처방 내
// 중복 여부를 UNIQUE 제약이 그대로 검사한다(위반 시 23505 - 신규 등록과 동일한 메시지로 안내).
export type ProductionRecordEditablePatch = Partial<
  Pick<
    ProductionRecord,
    "lot_no" | "target_qty_kg" | "production_date" | "exp_date" | "coating_qty" | "molded_qty" | "shipped_qty_ea" | "shipped_qty_pack"
  >
> & {
  // note는 ProductionRecord 상에서는 string만 허용하는 선택 필드지만(신규 등록 시엔 빈 문자열로 저장),
  // 수정 화면에서 기존 비고를 "지워서" null로 명시 저장할 수 있어야 하므로 패치 타입에서만 null을 허용한다.
  note?: string | null;
};

export async function updateProductionRecord(id: string, patch: ProductionRecordEditablePatch) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_records")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 Lot No.입니다 (같은 처방 내에서 중복될 수 없습니다).");
    }
    throw error;
  }
  return data as ProductionRecord;
}

export async function fetchProductionRecords(formulaCode: string, revision: string): Promise<ProductionRecord[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_records")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("production_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ProductionRecord[];
}

export type ProductionRecordListFilter = {
  keyword?: string; // 확정코드/제품명/처방코드/처방명/Lot No.
  dateFrom?: string; // 생산일자 기준
  dateTo?: string;
};

// 처방 선택 없이 전체 생산실적을 조회 (전체 목록 화면, 월별/연도별 집계 화면 공용).
export async function fetchAllProductionRecords(filter: ProductionRecordListFilter = {}): Promise<ProductionRecord[]> {
  let q = supabaseProductionFinal
    .from("plm_production_records")
    .select("*")
    .order("production_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);

  if (filter.dateFrom) q = q.gte("production_date", filter.dateFrom);
  if (filter.dateTo) q = q.lte("production_date", filter.dateTo);
  if (filter.keyword?.trim()) {
    const k = filter.keyword.trim();
    // 화면 표시는 확정코드/제품명 위주로 바뀌었지만, 두 값이 아직 없는(처방 컨펌 전) 예전 실적도
    // 놓치지 않도록 처방코드/처방명까지 함께 매칭한다.
    q = q.or(
      `confirmed_code.ilike.%${k}%,product_name.ilike.%${k}%,formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,lot_no.ilike.%${k}%`
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ProductionRecord[];
}

export async function deleteProductionRecord(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_production_records").delete().eq("id", id);
  if (error) throw error;
}
