"use client";

import { useEffect, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  deleteProductionRecord, fetchProductionRecords, saveProductionRecord, type ProductionRecord,
} from "@/services/sprint2/productionRecordService";
import { downloadProductionRecordsExcel } from "@/services/sprint2/productionRecordDocService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { fetchUserDisplayNames } from "@/services/sprint1/authRbacService";
import { parseDecimal } from "@/lib/parseDecimal";

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
  const [shippedQtyEa, setShippedQtyEa] = useState<string>("");
  const [shippedQtyPack, setShippedQtyPack] = useState<string>("");
  const [productionDate, setProductionDate] = useState(today());
  const [expDate, setExpDate] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
    shippedQtyEa, setShippedQtyEa, shippedQtyPack, setShippedQtyPack,
    productionDate, setProductionDate, expDate, setExpDate, note, setNote,
    history, loading, saving, message, save, removeHistory, downloadExcel,
    resolveCreatedBy,
  };
}
