"use client";

import { useMemo, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines } from "@/services/sprint1/formulaCoreService";
import { fetchLatestStockByRawCodes, isStockManagedRawCode } from "@/services/sprint2/rawMaterialStockService";
import {
  calcShortageRows, deleteManufacturingQtyReviewSheet, fetchManufacturingQtyReviewSheets, saveManufacturingQtyReviewSheet,
  type ManufacturingQtyReviewSheet, type ShortageRow,
} from "@/services/sprint2/manufacturingQtyReviewService";
import { downloadManufacturingQtyReviewExcel, printManufacturingQtyReviewSheet } from "@/services/sprint2/manufacturingQtyReviewDocService";

export function useManufacturingQtyReview() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [targetQtyKg, setTargetQtyKg] = useState(0);
  const [lines, setLines] = useState<any[]>([]);
  const [latestStock, setLatestStock] = useState<Map<string, { closing_stock: number; ledger_date: string }>>(new Map());
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ManufacturingQtyReviewSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const shortageRows: ShortageRow[] = useMemo(
    () => calcShortageRows(lines, targetQtyKg, latestStock),
    [lines, targetQtyKg, latestStock]
  );

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

  async function selectFormula(f: any) {
    setFormula(f);
    setMessage("");
    setLoading(true);
    try {
      const formulaLines = await fetchSprint1FormulaLines(f.formula_code, f.revision);
      setLines(formulaLines);
      const targetedCodes = Array.from(new Set(formulaLines.map((l: any) => l.raw_code).filter(isStockManagedRawCode)));
      setLatestStock(await fetchLatestStockByRawCodes(targetedCodes));
      await loadHistory(f.formula_code, f.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(formulaCode: string, revision: string) {
    try {
      setHistory(await fetchManufacturingQtyReviewSheets(formulaCode, revision));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    }
  }

  function updateTargetQtyKg(value: string) {
    setTargetQtyKg(value === "" ? 0 : Number(value));
  }

  function buildCurrentSheet(): ManufacturingQtyReviewSheet {
    if (!formula) throw new Error("처방을 먼저 선택하세요.");
    return {
      formula_code: formula.formula_code,
      revision: formula.revision,
      formula_name: formula.formula_name,
      confirmed_code: formula.confirmed_code,
      target_qty_kg: targetQtyKg,
      shortage_rows: shortageRows,
      note,
    };
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const sheet = buildCurrentSheet();
      const saved = await saveManufacturingQtyReviewSheet(sheet);
      setMessage("저장 완료");
      await loadHistory(saved.formula_code, saved.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  function loadFromHistory(sheet: ManufacturingQtyReviewSheet) {
    setTargetQtyKg(sheet.target_qty_kg);
    setNote(sheet.note || "");
    setMessage(`불러옴: ${new Date(sheet.created_at || "").toLocaleString("ko-KR")}`);
  }

  async function removeHistory(id: string) {
    if (!confirm("이 검토 이력을 삭제하시겠습니까?")) return;
    try {
      await deleteManufacturingQtyReviewSheet(id);
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function printCurrent() {
    try { printManufacturingQtyReviewSheet(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelCurrent() {
    try { await downloadManufacturingQtyReviewExcel(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }
  function printHistoryItem(sheet: ManufacturingQtyReviewSheet) {
    try { printManufacturingQtyReviewSheet(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelHistoryItem(sheet: ManufacturingQtyReviewSheet) {
    try { await downloadManufacturingQtyReviewExcel(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    targetQtyKg, updateTargetQtyKg, shortageRows, note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
