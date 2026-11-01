"use client";

import { useEffect, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  deleteProductionRecord, fetchProductionRecords, saveProductionRecord, updateProductionRecord,
  type ProductionRecord,
} from "@/services/sprint2/productionRecordService";
import { downloadProductionRecordsExcel } from "@/services/sprint2/productionRecordDocService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { fetchUserDisplayNames } from "@/services/sprint1/authRbacService";
import { parseDecimal } from "@/lib/parseDecimal";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// "저장 이력" 표에서 바로 수정하는 기능용 - 처방관리 전체 목록(ProductionRecordListPanel)의 수정 폼과
// 같은 필드 구성(처방 자체는 수정 대상에서 제외)이지만, 여기는 화면이 달라 타입/상태를 별도로 둔다.
export type ProductionRecordEditDraft = {
  lot_no: string;
  target_qty_kg: string;
  production_date: string;
  exp_date: string;
  coating_qty: string;
  molded_qty: string;
  shipped_qty_ea: string;
  shipped_qty_pack: string;
  note: string;
};

function draftFromRecord(r: ProductionRecord): ProductionRecordEditDraft {
  return {
    lot_no: r.lot_no,
    target_qty_kg: r.target_qty_kg != null ? String(r.target_qty_kg) : "",
    production_date: r.production_date,
    exp_date: r.exp_date || "",
    coating_qty: r.coating_qty != null ? String(r.coating_qty) : "",
    molded_qty: r.molded_qty != null ? String(r.molded_qty) : "",
    shipped_qty_ea: r.shipped_qty_ea != null ? String(r.shipped_qty_ea) : "",
    shipped_qty_pack: r.shipped_qty_pack != null ? String(r.shipped_qty_pack) : "",
    note: r.note || "",
  };
}

export function useProductionRecord() {
  const auth = useSprint1Auth();

  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [targetQtyKg, setTargetQtyKg] = useState(0);
  const [lotNo, setLotNo] = useState("");
  const [coatingQty, setCoatingQty] = useState<string>("");
  const [moldedQty, setMoldedQty] = useState<string>("");
  const [shippedQtyEa, setShippedQtyEa] = useState<string>("");
  const [shippedQtyPack, setShippedQtyPack] = useState<string>("");
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

  async function selectFormula(f: any) {
    setFormula(f);
    setMessage("");
    cancelEdit(); // 처방을 바꾸면 이전 처방의 이력을 수정하던 상태가 남아있으면 안 되므로 초기화
    await loadHistory(f.formula_code, f.revision);
  }

  async function loadHistory(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      setHistory(await fetchProductionRecords(formulaCode, revision));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTargetQtyKg(0);
    setLotNo("");
    setCoatingQty("");
    setMoldedQty("");
    setShippedQtyEa("");
    setShippedQtyPack("");
    setProductionDate(today());
    setExpDate("");
    setNote("");
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
        coating_qty: coatingQty === "" ? null : Number(coatingQty),
        molded_qty: moldedQty === "" ? null : Number(moldedQty),
        shipped_qty_ea: shippedQtyEa === "" ? null : Number(shippedQtyEa),
        shipped_qty_pack: shippedQtyPack === "" ? null : Number(shippedQtyPack),
        production_date: productionDate,
        exp_date: expDate === "" ? null : expDate,
        note,
        created_by: auth.profile?.email || undefined,
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

  function startEdit(r: ProductionRecord) {
    setEditingId(r.id || null);
    setEditDraft(draftFromRecord(r));
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
        target_qty_kg: editDraft.target_qty_kg === "" ? 0 : Number(editDraft.target_qty_kg),
        production_date: editDraft.production_date,
        exp_date: editDraft.exp_date === "" ? null : editDraft.exp_date,
        coating_qty: editDraft.coating_qty === "" ? null : Number(editDraft.coating_qty),
        molded_qty: editDraft.molded_qty === "" ? null : Number(editDraft.molded_qty),
        shipped_qty_ea: editDraft.shipped_qty_ea === "" ? null : Number(editDraft.shipped_qty_ea),
        shipped_qty_pack: editDraft.shipped_qty_pack === "" ? null : Number(editDraft.shipped_qty_pack),
        note: editDraft.note || null,
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
      await downloadProductionRecordsExcel(formula, history);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류");
    }
  }

  return {
    auth,
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    targetQtyKg, updateTargetQtyKg, lotNo, setLotNo, coatingQty, setCoatingQty, moldedQty, setMoldedQty,
    shippedQtyEa, setShippedQtyEa, shippedQtyPack, setShippedQtyPack,
    productionDate, setProductionDate, expDate, setExpDate, note, setNote,
    history, loading, saving, message, save, removeHistory, downloadExcel,
    resolveCreatedBy,
    editingId, editDraft, savingEdit, startEdit, cancelEdit, updateEditDraft, saveEdit,
  };
}
