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

// 저장은 항상 새 이력 행 INSERT (원장 성격 - 덮어쓰기 없음). 예전엔 같은 처방(formula_code+revision)
// 내에서 Lot No.가 유일하도록 DB UNIQUE 제약이 걸려 있었지만, "추가 제조 건을 같은 Lot No.로도 등록할
// 수 있게 해달라"는 요청으로 그 제약을 제거했다(마이그레이션: drop_production_records_formula_lot_unique).
// 중복 여부 확인은 호출 측(useProductionRecord.save)이 저장 전에 사용자에게 먼저 물어보는 방식으로 처리한다.
export async function saveProductionRecord(record: ProductionRecord) {
  const { id, ...payload } = record;
  const { data, error } = await supabaseProductionFinal
    .from("plm_production_records")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductionRecord;
}

// 생산실적 수정 - 처방(formula_code/revision/formula_name/confirmed_code/product_name)은 바꿀 수
// 없다. 처방 자체를 바꿔야 하면 기존 실적을 삭제하고 새로 등록하도록 한다. Lot No. 중복 여부는(신규
// 등록과 마찬가지로) 더 이상 DB가 막지 않고, 호출 측(ProductionRecordListPanel.saveEdit)이 저장 전에
// 사용자에게 먼저 확인을 받는다.
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
  if (error) throw error;
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
  return attachLiveProductNames((data || []) as ProductionRecord[]);
}

// 생산실적에는 저장 시점의 제품명 스냅샷(product_name)이 남아있지만, 처방관리에서 "제품명(컨펌 후
// 확정)"을 생산실적 등록 "이후"에 입력/수정하면 이미 등록된 생산실적에는 그 값이 반영되지 않는
// 문제가 있었다("전체 목록/월별·연도별 집계의 제품명이 처방관리의 제품명(컨펌 후 확정)에 기입된
// 내용을 따라가게 해달라" 요청사항). 그래서 조회 시마다 plm_formulas에서 해당 처방(formula_code+
// revision)의 "현재" 제품명을 다시 가져와 있으면 그 값으로 덮어쓰고, 처방이 이미 삭제됐거나 제품명이
// 아직 비어있으면 저장된 스냅샷(product_name) -> formula_name 순으로 기존 동작대로 폴백한다.
async function attachLiveProductNames(records: ProductionRecord[]): Promise<ProductionRecord[]> {
  if (records.length === 0) return records;
  const codes = Array.from(new Set(records.map((r) => r.formula_code)));
  const { data, error } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, product_name")
    .in("formula_code", codes);
  if (error || !data) return records; // 보강 조회가 실패해도 기존 스냅샷 표시는 그대로 유지
  const liveMap = new Map<string, string | null | undefined>();
  for (const f of data as { formula_code: string; revision: string; product_name?: string | null }[]) {
    liveMap.set(`${f.formula_code}__${f.revision}`, f.product_name);
  }
  return records.map((r) => {
    const live = liveMap.get(`${r.formula_code}__${r.revision}`);
    return live ? { ...r, product_name: live } : r;
  });
}

export async function deleteProductionRecord(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_production_records").delete().eq("id", id);
  if (error) throw error;
}
