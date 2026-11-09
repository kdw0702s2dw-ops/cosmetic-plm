"use client";

import { useEffect, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  deleteProductionRecord, fetchProductionRecords, saveProductionRecord, updateProductionRecord,
  type ProductionRecord, type FunctionalClaim, type TestProgressStatus,
} from "@/services/sprint2/productionRecordService";
import { downloadProductionRecordsExcel } from "@/services/sprint2/productionRecordDocService";
import {
  fetchLotShipmentsForFormula, saveLotShipment, type ProductionLotShipment,
} from "@/services/sprint2/productionLotShipmentService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { fetchUserDisplayNames } from "@/services/sprint1/authRbacService";
import { parseDecimal } from "@/lib/parseDecimal";
import { todayLocalStr } from "@/lib/localDate";

function today() {
  return todayLocalStr();
}

function fmtQty(v: number | null | undefined): string {
  return v === null || v === undefined ? "0" : String(v);
}

// "저장 이력" 표에서 바로 수정하는 기능용 - 처방관리 전체 목록(ProductionRecordListPanel)의 수정 폼과
// 같은 필드 구성(처방 자체는 수정 대상에서 제외)이지만, 여기는 화면이 달라 타입/상태를 별도로 둔다.
export type ProductionRecordEditDraft = {
  lot_no: string; // 화면 표시명 "제품(Lot No.)"
  mfg_lot_no: string; // 화면 표시명 "제조(Lot No.)"
  target_qty_kg: string;
  production_date: string;
  exp_date: string;
  coating_qty: string;
  molded_qty: string;
  shipped_qty_ea: string;
  shipped_qty_pack: string;
  functional_claim: FunctionalClaim;
  heavy_metal_status: TestProgressStatus;
  microbial_status: TestProgressStatus;
  note: string;
};

// 출고수량(EA/PACK)은 더 이상 이 행 자신의 값이 아니라 Lot 전체 공통 값
// (plm_production_lot_shipments)을 우선 사용한다 - 같은 Lot의 다른 행에서 수정됐어도 이 폼이
// 항상 최신 공통 값을 보여주도록. 아직 Lot 출고 레코드가 없는 극히 예외적인 경우에만(백필 이전
// 데이터가 남아있는 경우 등) 행 자신의 값으로 대체한다.
function draftFromRecord(r: ProductionRecord, lotShipment?: ProductionLotShipment): ProductionRecordEditDraft {
  return {
    lot_no: r.lot_no,
    mfg_lot_no: r.mfg_lot_no || "",
    target_qty_kg: r.target_qty_kg != null ? String(r.target_qty_kg) : "",
    production_date: r.production_date,
    exp_date: r.exp_date || "",
    coating_qty: r.coating_qty != null ? String(r.coating_qty) : "",
    molded_qty: r.molded_qty != null ? String(r.molded_qty) : "",
    shipped_qty_ea: lotShipment
      ? (lotShipment.shipped_qty_ea != null ? String(lotShipment.shipped_qty_ea) : "")
      : (r.shipped_qty_ea != null ? String(r.shipped_qty_ea) : ""),
    shipped_qty_pack: lotShipment
      ? (lotShipment.shipped_qty_pack != null ? String(lotShipment.shipped_qty_pack) : "")
      : (r.shipped_qty_pack != null ? String(r.shipped_qty_pack) : ""),
    functional_claim: r.functional_claim || "해당없음",
    heavy_metal_status: r.heavy_metal_status || "해당없음",
    microbial_status: r.microbial_status || "해당없음",
    note: r.note || "",
  };
}

// refreshToken: 생산실적 관리 화면 상단 "새로고침" 버튼과 연동(다른 하위 도구들과 동일한 패턴) -
// 값이 바뀌면 현재 선택된 처방의 이력을 다시 불러온다. 처방을 아직 선택하지 않았으면 아무 일도 하지 않는다.
export function useProductionRecord(refreshToken?: number) {
  const auth = useSprint1Auth();

  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [targetQtyKg, setTargetQtyKg] = useState(0);
  const [lotNo, setLotNo] = useState(""); // 제품(Lot No.)
  const [mfgLotNo, setMfgLotNo] = useState(""); // 제조(Lot No.)
  const [coatingQty, setCoatingQty] = useState<string>("");
  const [moldedQty, setMoldedQty] = useState<string>("");
  const [shippedQtyEa, setShippedQtyEa] = useState<string>("");
  const [shippedQtyPack, setShippedQtyPack] = useState<string>("");
  const [functionalClaim, setFunctionalClaim] = useState<FunctionalClaim>("해당없음");
  const [heavyMetalStatus, setHeavyMetalStatus] = useState<TestProgressStatus>("해당없음");
  const [microbialStatus, setMicrobialStatus] = useState<TestProgressStatus>("해당없음");
  const [productionDate, setProductionDate] = useState(today());
  const [expDate, setExpDate] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ProductionRecordEditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Lot(제품(Lot No.)) 단위 완제품 총 출고 수량 - lot_no -> 공통 출고 레코드 맵. 같은 Lot으로
  // 추가 생산이 등록돼도 출고 수량은 Lot당 1개 값만 관리되도록 한다(services/sprint2/productionLotShipmentService).
  const [lotShipments, setLotShipments] = useState<Map<string, ProductionLotShipment>>(new Map());
  const [lotShipmentNotice, setLotShipmentNotice] = useState("");
  // updateLotNo가 출고수량을 자동으로 채워 넣은 Lot No.(원본) - Lot No.를 더 고치거나 지워서 이
  // 값과 더 이상 일치하지 않게 되면, 남아있는 자동 채움 값이 엉뚱한(또는 존재하지 않는) Lot에
  // 그대로 저장되는 사고를 막기 위해 비워야 한다.
  const [filledShipmentLot, setFilledShipmentLot] = useState<string | null>(null);

  // "등록자"(created_by, 이메일로 저장됨)를 표에는 이름으로 보여주기 위한 이메일->이름 맵. 화면
  // 진입 시 한 번만 불러온다(사용자 목록이 자주 바뀌지 않으므로 매 조회마다 다시 불러올 필요 없음).
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchUserDisplayNames().then(setDisplayNames).catch(() => {});
  }, []);
  function resolveCreatedBy(email?: string): string {
    if (!email) return "-";
    return displayNames[email] || email;
  }

  async function search() {
    setSearching(true);
    try {
      setFormulas(await searchProductionFormulas(keyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setSearching(false);
    }
  }

  function updateTargetQtyKg(value: string) {
    setTargetQtyKg(parseDecimal(value));
  }

  // 같은 처방 내에 이미 존재하는 Lot No.를 입력하면(같은 Lot으로 추가 생산 등), 출고수량
  // 입력란에 그 Lot의 기존 공통 값을 자동으로 불러와 보여준다 - 입력칸이 빈 채로 저장돼서 기존
  // 값이 0/빈 값으로 덮어써지는 사고를 막기 위함. 그대로 저장하면 기존 값이 유지되고, 값을
  // 고쳐서 저장하면 그 Lot 전체(다른 행 포함)의 출고수량이 함께 바뀐다.
  function updateLotNo(value: string) {
    setLotNo(value);
    const trimmed = value.trim();
    const existing = trimmed ? lotShipments.get(trimmed) : undefined;
    if (existing) {
      setShippedQtyEa(existing.shipped_qty_ea != null ? String(existing.shipped_qty_ea) : "");
      setShippedQtyPack(existing.shipped_qty_pack != null ? String(existing.shipped_qty_pack) : "");
      setFilledShipmentLot(trimmed);
      setLotShipmentNotice(
        `이미 등록된 Lot No.입니다. 출고수량(EA/PACK)은 이 Lot의 모든 생산실적 행에 공통으로 적용되는 값이라, 기존 값(${fmtQty(existing.shipped_qty_ea)} EA / ${fmtQty(existing.shipped_qty_pack)} PACK)을 불러왔습니다. 그대로 저장하면 기존 값이 유지되고, 값을 바꿔서 저장하면 이 Lot 전체의 출고수량이 변경됩니다.`
      );
    } else {
      // 직전까지 다른 Lot에서 자동으로 채워진 값이 남아있으면(Lot No.를 더 고치거나 지워서 더 이상
      // 그 Lot과 일치하지 않게 됨) 비운다 - 그대로 두면 엉뚱한 Lot에 그 값이 저장될 수 있다.
      if (filledShipmentLot) {
        setShippedQtyEa("");
        setShippedQtyPack("");
        setFilledShipmentLot(null);
      }
      setLotShipmentNotice("");
    }
  }

  async function selectFormula(f: any) {
    setFormula(f);
    setMessage("");
    cancelEdit(); // 처방을 바꾸면 이전 처방의 이력을 수정하던 상태가 남아있으면 안 되므로 초기화
    await loadHistory(f.formula_code, f.revision);
  }

  async function loadHistory(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      const [records, shipments] = await Promise.all([
        fetchProductionRecords(formulaCode, revision),
        fetchLotShipmentsForFormula(formulaCode, revision),
      ]);
      setHistory(records);
      setLotShipments(shipments);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTargetQtyKg(0);
    setLotNo("");
    setMfgLotNo("");
    setCoatingQty("");
    setMoldedQty("");
    setShippedQtyEa("");
    setShippedQtyPack("");
    setFunctionalClaim("해당없음");
    setHeavyMetalStatus("해당없음");
    setMicrobialStatus("해당없음");
    setProductionDate(today());
    setExpDate("");
    setNote("");
    setLotShipmentNotice("");
    setFilledShipmentLot(null);
  }

  async function save() {
    if (!formula) { setMessage("처방을 먼저 선택하세요."); return; }
    const trimmedLot = lotNo.trim();
    if (!trimmedLot) { setMessage("Lot No.를 입력하세요."); return; }
    // 예전엔 같은 처방 내 Lot No. 중복을 그냥 막았지만, "추가 제조 건을 같은 Lot No.로도 등록하게
    // 해달라"는 요청으로 더 이상 막지 않는다 - 대신 중복이면 한 번 확인을 받고, 확인하면 그대로
    // 진행한다(삭제 확인(removeHistory)과 동일한 confirm() 패턴).
    if (history.some((h) => h.lot_no === trimmedLot)) {
      if (!confirm("이미 사용 중인 Lot No.입니다 (같은 처방 내 중복). 그래도 등록하시겠습니까?")) return;
    }

    setSaving(true);
    setMessage("");
    try {
      const saved = await saveProductionRecord({
        formula_code: formula.formula_code,
        revision: formula.revision,
        formula_name: formula.formula_name,
        confirmed_code: formula.confirmed_code,
        product_name: formula.product_name || undefined,
        target_qty_kg: targetQtyKg,
        lot_no: trimmedLot,
        mfg_lot_no: mfgLotNo.trim() === "" ? null : mfgLotNo.trim(),
        coating_qty: coatingQty === "" ? null : Number(coatingQty),
        molded_qty: moldedQty === "" ? null : Number(moldedQty),
        shipped_qty_ea: shippedQtyEa === "" ? null : Number(shippedQtyEa),
        shipped_qty_pack: shippedQtyPack === "" ? null : Number(shippedQtyPack),
        functional_claim: functionalClaim,
        heavy_metal_status: heavyMetalStatus,
        microbial_status: microbialStatus,
        production_date: productionDate,
        exp_date: expDate === "" ? null : expDate,
        note,
        created_by: auth.profile?.email || undefined,
      });
      // 생산실적 행 저장과 별도로, 이 Lot의 "총 출고 수량"을 Lot 단위 테이블에 1개 값으로
      // upsert한다 - 같은 Lot에 추가 생산이 여러 번 등록돼도 출고 수량은 항상 Lot당 1개로 유지된다.
      await saveLotShipment({
        formulaCode: saved.formula_code,
        revision: saved.revision,
        lotNo: trimmedLot,
        shippedQtyEa: shippedQtyEa === "" ? null : Number(shippedQtyEa),
        shippedQtyPack: shippedQtyPack === "" ? null : Number(shippedQtyPack),
        updatedBy: auth.profile?.email || undefined,
      });
      setMessage("저장 완료");
      resetForm();
      await loadHistory(saved.formula_code, saved.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  async function removeHistory(id: string) {
    if (!confirm("이 생산실적을 삭제하시겠습니까?")) return;
    try {
      await deleteProductionRecord(id);
      if (editingId === id) cancelEdit();
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  useEffect(() => {
    if (refreshToken && formula) loadHistory(formula.formula_code, formula.revision);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  function startEdit(r: ProductionRecord) {
    setEditingId(r.id || null);
    setEditDraft(draftFromRecord(r, lotShipments.get(r.lot_no)));
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function updateEditDraft(patch: Partial<ProductionRecordEditDraft>) {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveEdit() {
    if (!editingId || !editDraft || !formula) return;
    const trimmedLot = editDraft.lot_no.trim();
    if (!trimmedLot) { setMessage("Lot No.를 입력하세요."); return; }
    if (!editDraft.production_date) { setMessage("생산일자를 입력하세요."); return; }

    // 생산실적 전체 목록(ProductionRecordListPanel)과 동일한 패턴 - Lot No.를 실제로 다른 값으로 바꿀
    // 때만 중복 확인을 받는다(바꾸지 않았으면 추가 제조로 이미 허용된 중복이라 다시 물을 필요 없음).
    // 여기 history는 이미 선택한 처방(formula_code+revision) 범위로 조회돼 있어(fetchProductionRecords)
    // 전체 목록 화면과 달리 검색 필터나 행 수 상한에 걸리지 않고 전부 들어있다.
    const editingRecord = history.find((h) => h.id === editingId);
    if (editingRecord && trimmedLot !== editingRecord.lot_no) {
      const isDup = history.some((h) => h.id !== editingId && h.lot_no === trimmedLot);
      if (isDup && !confirm("이미 사용 중인 Lot No.입니다 (같은 처방 내 중복). 그래도 저장하시겠습니까?")) return;
    }

    setSavingEdit(true);
    setMessage("");
    try {
      await updateProductionRecord(editingId, {
        lot_no: trimmedLot,
        mfg_lot_no: editDraft.mfg_lot_no.trim() === "" ? null : editDraft.mfg_lot_no.trim(),
        target_qty_kg: editDraft.target_qty_kg === "" ? 0 : Number(editDraft.target_qty_kg),
        production_date: editDraft.production_date,
        exp_date: editDraft.exp_date === "" ? null : editDraft.exp_date,
        coating_qty: editDraft.coating_qty === "" ? null : Number(editDraft.coating_qty),
        molded_qty: editDraft.molded_qty === "" ? null : Number(editDraft.molded_qty),
        shipped_qty_ea: editDraft.shipped_qty_ea === "" ? null : Number(editDraft.shipped_qty_ea),
        shipped_qty_pack: editDraft.shipped_qty_pack === "" ? null : Number(editDraft.shipped_qty_pack),
        functional_claim: editDraft.functional_claim,
        heavy_metal_status: editDraft.heavy_metal_status,
        microbial_status: editDraft.microbial_status,
        note: editDraft.note || null,
      });
      // 이 폼은 "이 Lot 전체 공통" 출고 수량을 수정하는 것이므로, 수정 저장 시에도 Lot 단위
      // 테이블을 함께 갱신한다 - 같은 Lot의 다른 생산실적 행에도 이 값이 그대로 반영된다.
      await saveLotShipment({
        formulaCode: formula.formula_code,
        revision: formula.revision,
        lotNo: trimmedLot,
        shippedQtyEa: editDraft.shipped_qty_ea === "" ? null : Number(editDraft.shipped_qty_ea),
        shippedQtyPack: editDraft.shipped_qty_pack === "" ? null : Number(editDraft.shipped_qty_pack),
        updatedBy: auth.profile?.email || undefined,
      });
      setMessage("수정 완료");
      cancelEdit();
      await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "수정 오류");
    } finally {
      setSavingEdit(false);
    }
  }

  async function downloadExcel() {
    if (!formula) return;
    try {
      await downloadProductionRecordsExcel(formula, history, lotShipments);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류");
    }
  }

  return {
    auth,
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    targetQtyKg, updateTargetQtyKg, lotNo, setLotNo, updateLotNo, lotShipmentNotice, lotShipments, mfgLotNo, setMfgLotNo, coatingQty, setCoatingQty, moldedQty, setMoldedQty,
    shippedQtyEa, setShippedQtyEa, shippedQtyPack, setShippedQtyPack,
    functionalClaim, setFunctionalClaim, heavyMetalStatus, setHeavyMetalStatus, microbialStatus, setMicrobialStatus,
    productionDate, setProductionDate, expDate, setExpDate, note, setNote,
    history, loading, saving, message, save, removeHistory, downloadExcel,
    resolveCreatedBy,
    editingId, editDraft, savingEdit, startEdit, cancelEdit, updateEditDraft, saveEdit,
  };
}
