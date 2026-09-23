"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type FunctionalClaim = "해당없음" | "주름기능성" | "미백기능성" | "이중기능성";
export type TestProgressStatus = "해당없음" | "진행중" | "완료";

export const FUNCTIONAL_CLAIM_OPTIONS: FunctionalClaim[] = ["해당없음", "주름기능성", "미백기능성", "이중기능성"];
export const TEST_PROGRESS_OPTIONS: TestProgressStatus[] = ["해당없음", "진행중", "완료"];

export type ShipmentRecord = {
  id: string;
  shipment_date: string | null; // YYYY-MM-DD
  customer: string | null;
  quantity: number | null;
  product_code: string | null;
  product_name: string | null;
  lot_exp: string | null;
  functional_claim: FunctionalClaim;
  heavy_metal_status: TestProgressStatus;
  microbial_status: TestProgressStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ShipmentRecordInput = Partial<Omit<ShipmentRecord, "id" | "created_at" | "updated_at">>;

const emptyDraft: ShipmentRecordInput = {
  shipment_date: null,
  customer: "",
  quantity: null,
  product_code: "",
  product_name: "",
  lot_exp: "",
  functional_claim: "해당없음",
  heavy_metal_status: "해당없음",
  microbial_status: "해당없음",
  note: "",
};

export function newShipmentDraft(): ShipmentRecordInput {
  return { ...emptyDraft };
}

// 전체 출고 기록을 최신 출고일 순으로 조회한다. 검색(출고일/고객사/수량/제품코드/제품명/LOT(EXP))은
// 화면에서 이 목록을 대상으로 클라이언트 사이드로 필터링한다 - 원료관리 서류 현황과 동일한 패턴.
export async function fetchShipmentRecords(): Promise<ShipmentRecord[]> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_shipment_records")
    .select("*")
    .order("shipment_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ShipmentRecord[];
}

export async function addShipmentRecord(input: ShipmentRecordInput, createdBy?: string): Promise<ShipmentRecord> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_shipment_records")
    .insert({ ...input, created_by: createdBy ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as ShipmentRecord;
}

export async function updateShipmentRecord(id: string, patch: ShipmentRecordInput): Promise<ShipmentRecord> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_shipment_records")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ShipmentRecord;
}

export async function deleteShipmentRecord(id: string): Promise<void> {
  const { error } = await supabaseProductionFinal.from("plm_shipment_records").delete().eq("id", id);
  if (error) throw error;
}
