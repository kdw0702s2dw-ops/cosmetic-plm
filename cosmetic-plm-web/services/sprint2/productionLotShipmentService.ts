import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// Lot(formula_code+revision+lot_no) 단위 완제품 총 출고 수량.
// DB 구조: supabase/migrations/39_add_production_lot_shipments.sql 참고.
//
// 배경: 동일 Lot No.로 추가 생산이 발생하면 생산실적(plm_production_records)에 행이
// 여러 개 생기는데, 출고 수량(shipped_qty_ea/pack)을 그 행들에 각각 똑같이 적으면
// "전체 목록"/"월별·연도별 집계"/엑셀 출력에서 합계를 낼 때 중복 합산된다. 그래서 출고
// 수량은 이 테이블에 Lot당 1개 값으로만 저장하고, 화면에서는 Lot No.로 조회해서 그 Lot의
// 모든 생산실적 행에 동일하게 표시한다. plm_production_records.shipped_qty_ea/pack 컬럼은
// 과거 데이터 호환을 위해 남아있지만, 이 기능을 쓰는 화면에서는 더 이상 그 값을 직접 쓰지 않는다.

export interface ProductionLotShipment {
  id: string;
  formula_code: string;
  revision: string;
  lot_no: string;
  shipped_qty_ea: number | null;
  shipped_qty_pack: number | null;
  note: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "plm_production_lot_shipments";

/** formula_code+revision+lot_no로 맵 키를 만든다 (lot_no가 formula/revision 간에 겹칠 수 있으므로 항상 3개를 함께 써야 함). */
export function buildLotShipmentKey(formulaCode: string, revision: string, lotNo: string): string {
  return `${formulaCode}__${revision}__${lotNo}`;
}

/** 특정 처방(formula_code+revision)의 Lot별 출고 수량을 lot_no -> ProductionLotShipment 맵으로 조회 (입력/수정 화면용). */
export async function fetchLotShipmentsForFormula(
  formulaCode: string,
  revision: string
): Promise<Map<string, ProductionLotShipment>> {
  const { data, error } = await supabaseProductionFinal
    .from(TABLE)
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision);
  if (error) {
    throw new Error(`Lot 출고 수량 조회 실패: ${error.message}`);
  }
  const map = new Map<string, ProductionLotShipment>();
  for (const row of (data ?? []) as ProductionLotShipment[]) {
    map.set(row.lot_no, row);
  }
  return map;
}

/**
 * 전체 Lot 출고 수량을 (formula_code+revision+lot_no) 복합 키 -> ProductionLotShipment 맵으로 조회.
 * "전체 목록"/"월별·연도별 집계"/엑셀 출력처럼 여러 처방에 걸친 생산실적을 한 번에 다루는 화면에서,
 * Lot당 중복 없이 1번씩만 더하기 위해 사용한다 (키는 buildLotShipmentKey로 생성).
 */
export async function fetchAllLotShipments(): Promise<Map<string, ProductionLotShipment>> {
  const { data, error } = await supabaseProductionFinal.from(TABLE).select("*");
  if (error) {
    throw new Error(`Lot 출고 수량 조회 실패: ${error.message}`);
  }
  const map = new Map<string, ProductionLotShipment>();
  for (const row of (data ?? []) as ProductionLotShipment[]) {
    map.set(buildLotShipmentKey(row.formula_code, row.revision, row.lot_no), row);
  }
  return map;
}

/** Lot의 총 출고 수량을 저장(없으면 생성, 있으면 덮어쓰기) - 이 Lot의 모든 생산실적 행에 공통으로 적용된다. */
export async function saveLotShipment(params: {
  formulaCode: string;
  revision: string;
  lotNo: string;
  shippedQtyEa: number | null;
  shippedQtyPack: number | null;
  note?: string | null;
  updatedBy?: string | null;
}): Promise<ProductionLotShipment> {
  const { formulaCode, revision, lotNo, shippedQtyEa, shippedQtyPack, note, updatedBy } = params;
  const { data, error } = await supabaseProductionFinal
    .from(TABLE)
    .upsert(
      {
        formula_code: formulaCode,
        revision,
        lot_no: lotNo,
        shipped_qty_ea: shippedQtyEa,
        shipped_qty_pack: shippedQtyPack,
        note: note ?? null,
        updated_by: updatedBy ?? null,
      },
      { onConflict: "formula_code,revision,lot_no" }
    )
    .select()
    .single();
  if (error) {
    throw new Error(`Lot 출고 수량 저장 실패: ${error.message}`);
  }
  return data as ProductionLotShipment;
}
