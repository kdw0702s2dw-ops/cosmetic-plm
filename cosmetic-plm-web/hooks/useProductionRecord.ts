"use client";

import { useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  deleteProductionRecord, fetchProductionRecords, saveProductionRecord, type ProductionRecord,
} from "@/services/sprint2/productionRecordService";
import { downloadProductionRecordsExcel } from "@/services/sprint2/productionRecordDocService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";

function today() {
  return new Date().toISOString().slice(0, 10);
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
  const [productionDate, setProductionDate] = useState(today());
  const [expDate, setExpDate] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
    setTargetQtyKg(value === "" ? 0 : Number(value));
  }

  async function selectFormula(f: any) {
    setFormula(f);
    setMessage("");
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
    setProductionDate(today());
    setExpDate("");
    setNote("");
  }

  async function save() {
    if (!formula) { setMessage("처방을 먼저 선택하세요."); return; }
    const trimmedLot = lotNo.trim();
    if (!trimmedLot) { setMessage("Lot No.를 입력하세요."); return; }
    if (history.some((h) => h.lot_no === trimmedLot)) {
      setMessage("이미 사용 중인 Lot No.입니다 (같은 처방 내에서 중복될 수 없습니다).");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const saved = await saveProductionRecord({
        formula_code: formula.formula_code,
        revision: formula.revision,
        formula_name: formula.formula_name,
        confirmed_code: formula.confirmed_code,
        target_qty_kg: targetQtyKg,
        lot_no: trimmedLot,
        coating_qty: coatingQty === "" ? null : Number(coatingQty),
        molded_qty: moldedQty === "" ? null : Number(moldedQty),
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
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
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
    productionDate, setProductionDate, expDate, setExpDate, note, setNote,
    history, loading, saving, message, save, removeHistory, downloadExcel,
  };
}
