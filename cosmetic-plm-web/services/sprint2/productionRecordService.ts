"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type ProductionRecord = {
  id?: string;
  formula_code: string;
  revision: string;
  formula_name?: string;
  confirmed_code?: string;
  target_qty_kg: number;
  lot_no: string;
  coating_qty: number | null;
  molded_qty: number | null;
  production_date: string; // YYYY-MM-DD
  note?: string;
  created_by?: string;
  created_at?: string;
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

export async function deleteProductionRecord(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_production_records").delete().eq("id", id);
  if (error) throw error;
}
