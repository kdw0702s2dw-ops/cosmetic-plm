"use client";

import { useMemo, useState } from "react";
import {
  calcHeader, calcScenarioRow, deleteProductionQtySheet, fetchProductionQtySheets, saveProductionQtySheet,
  searchProductionFormulas, type ProductionQtyHeaderInput, type ProductionQtySheet, type ScenarioRowInput,
} from "@/services/sprint2/productionQtyService";
import { downloadProductionQtyExcel, printProductionQtySheet } from "@/services/sprint2/productionQtyDocService";

const emptyHeaderInput: ProductionQtyHeaderInput = {
  manufacture_qty_kg: 0, loss_percent: 0, coat_max_10x10: 0, coating_length_cm: 0, coating_width_cm: 0, coating_loss_m: 0,
};

export function useProductionQtyCheck() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [headerInput, setHeaderInput] = useState<ProductionQtyHeaderInput>(emptyHeaderInput);
  const [scenarioRows, setScenarioRows] = useState<ScenarioRowInput[]>([{ molded_size_m: 0, cutting_line_qty: 0 }]);
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<ProductionQtySheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const headerResult = useMemo(() => calcHeader(headerInput), [headerInput]);
  const scenarioResults = useMemo(
    () => scenarioRows.map((r) => calcScenarioRow(r, headerResult.actual_qty_m)),
    [scenarioRows, headerResult.actual_qty_m]
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
    await loadHistory(f.formula_code, f.revision);
  }

  async function loadHistory(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      setHistory(await fetchProductionQtySheets(formulaCode, revision));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function updateHeaderField(key: keyof ProductionQtyHeaderInput, value: string) {
    setHeaderInput((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
  }

  function updateScenarioRow(index: number, patch: Partial<ScenarioRowInput>) {
    setScenarioRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addScenarioRow() {
    setScenarioRows((prev) => [...prev, { molded_size_m: 0, cutting_line_qty: 0 }]);
  }
  function removeScenarioRow(index: number) {
    setScenarioRows((prev) => prev.filter((_, i) => i !== index));
  }

  function buildCurrentSheet(): ProductionQtySheet {
    if (!formula) throw new Error("처방을 먼저 선택하세요.");
    return {
      formula_code: formula.formula_code,
      revision: formula.revision,
      formula_name: formula.formula_name,
      confirmed_code: formula.confirmed_code,
      note,
      ...headerInput,
      ...headerResult,
      scenario_rows: scenarioResults,
    };
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const sheet = buildCurrentSheet();
      const saved = await saveProductionQtySheet(sheet);
      setMessage("저장 완료");
      await loadHistory(saved.formula_code, saved.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  function loadFromHistory(sheet: ProductionQtySheet) {
    setHeaderInput({
      manufacture_qty_kg: sheet.manufacture_qty_kg,
      loss_percent: sheet.loss_percent,
      coat_max_10x10: sheet.coat_max_10x10,
      coating_length_cm: sheet.coating_length_cm,
      coating_width_cm: sheet.coating_width_cm,
      coating_loss_m: sheet.coating_loss_m,
    });
    setScenarioRows(sheet.scenario_rows.map((r) => ({ molded_size_m: r.molded_size_m, cutting_line_qty: r.cutting_line_qty })));
    setNote(sheet.note || "");
    setMessage(`불러옴: ${new Date(sheet.created_at || "").toLocaleString("ko-KR")}`);
  }

  async function removeHistory(id: string) {
    if (!confirm("이 계산 이력을 삭제하시겠습니까?")) return;
    try {
      await deleteProductionQtySheet(id);
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function printCurrent() {
    try { printProductionQtySheet(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelCurrent() {
    try { await downloadProductionQtyExcel(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }
  function printHistoryItem(sheet: ProductionQtySheet) {
    try { printProductionQtySheet(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelHistoryItem(sheet: ProductionQtySheet) {
    try { await downloadProductionQtyExcel(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    headerInput, updateHeaderField, headerResult,
    scenarioRows, scenarioResults, updateScenarioRow, addScenarioRow, removeScenarioRow,
    note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
