"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  calcHeader, calcSummaryRows, deleteInsolubleHgSheet, fetchInsolubleHgSheets, saveInsolubleHgSheet,
  fetchInsolubleHgReferenceLines, addInsolubleHgReferenceLine, saveInsolubleHgReferenceLine, deleteInsolubleHgReferenceLine,
  LOSS_RATE_PRESETS, type InsolubleHgHeaderInput, type InsolubleHgSheet, type InsolubleHgReferenceLine,
} from "@/services/sprint2/insolubleHgService";
import { downloadInsolubleHgExcel, printInsolubleHgSheet } from "@/services/sprint2/insolubleHgDocService";

const emptyHeaderInput: InsolubleHgHeaderInput = {
  fabric_material_code: "", fabric_standard_weight: 0, film_material_code: "", film_standard_weight: 0, total_weight: 0,
  cutting_line_no: "", cutting_area_a4_weight: 0, a4_10x10_weight: 0,
  loss_rate_preset_key: LOSS_RATE_PRESETS[0].key, loss_rate: LOSS_RATE_PRESETS[0].rate,
  manual_notice_coat_amount: null, half_cut_width_cm: 0, half_cut_height_cm: 0,
};

export function useInsolubleHgCheck() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [headerInput, setHeaderInput] = useState<InsolubleHgHeaderInput>(emptyHeaderInput);
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<InsolubleHgSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const headerResult = useMemo(() => calcHeader(headerInput), [headerInput]);
  const summaryRows = useMemo(
    () => calcSummaryRows(headerResult.cutting_line_coat_amount, headerResult.nonwoven_weight, headerResult.film_weight_full_cut),
    [headerResult.cutting_line_coat_amount, headerResult.nonwoven_weight, headerResult.film_weight_full_cut]
  );

  // "10×10㎠ 도포량 기준(부자재 제외)" 참고값 - 처방 선택/이력 불러오기와 무관하게 화면을 열 때마다
  // 마지막으로 저장된 줄들이 항상 그대로 채워져 있어야 해서(매번 찾아 입력하는 비효율 방지), 별도 전역
  // 목록으로 관리한다. 여러 줄을 추가할 수 있고, 입력 즉시 로컬 상태에 반영하며 타이핑이 멈추면(0.6초)
  // 줄 단위로 자동 DB 저장한다.
  const [referenceLines, setReferenceLines] = useState<InsolubleHgReferenceLine[]>([]);
  const [referenceSettingsLoading, setReferenceSettingsLoading] = useState(true);
  const [referenceLineBusy, setReferenceLineBusy] = useState(false);
  const referenceSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // "10×10㎠ 도포량 기준" 목록 중 하나를 선택하면, 그 도포량(g)에 원단/필름 관리기준 중량을
  // 더한 값을 "입력값 - 나머지"의 총중량에 자동으로 채워 넣는다. 선택 상태는 화면 세션에서만
  // 유지되며(별도 저장 없음), 선택된 이후 원단/필름 중량이나 기준값이 바뀌면 총중량도 함께 갱신된다.
  const [selectedReferenceLineId, setSelectedReferenceLineId] = useState<string | null>(null);

  function selectReferenceLine(id: string | null) {
    setSelectedReferenceLineId((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    let cancelled = false;
    fetchInsolubleHgReferenceLines()
      .then((rows) => { if (!cancelled) setReferenceLines(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReferenceSettingsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedReferenceLineId) return;
    const line = referenceLines.find((r) => r.id === selectedReferenceLineId);
    if (!line || line.coat_amount_10x10_g === null || line.coat_amount_10x10_g === undefined) return;
    const sum = Number(line.coat_amount_10x10_g) + Number(headerInput.fabric_standard_weight || 0) + Number(headerInput.film_standard_weight || 0);
    setHeaderInput((prev) => (prev.total_weight === sum ? prev : { ...prev, total_weight: sum }));
  }, [selectedReferenceLineId, referenceLines, headerInput.fabric_standard_weight, headerInput.film_standard_weight]);

  function updateReferenceLine(id: string, key: "label" | "coat_amount_10x10_g" | "thickness_mm", value: string) {
    setReferenceLines((prev) => {
      const next = prev.map((row) => {
        if (row.id !== id) return row;
        const updated: InsolubleHgReferenceLine = key === "label"
          ? { ...row, label: value === "" ? null : value }
          : { ...row, [key]: value === "" ? null : Number(value) };
        const timers = referenceSaveTimers.current;
        const existing = timers.get(id);
        if (existing) clearTimeout(existing);
        timers.set(id, setTimeout(() => {
          saveInsolubleHgReferenceLine(updated).catch(() => {
            setMessage("10×10㎠ 도포량 기준 저장 오류");
          });
        }, 600));
        return updated;
      });
      return next;
    });
  }

  async function addReferenceLine() {
    if (referenceLineBusy) return;
    setReferenceLineBusy(true);
    try {
      // 줄 개수(length)를 기준으로 sort_order를 정하면, 클릭이 겹치거나 기존 값에 결측/중복이
      // 있을 때 같은 sort_order가 중복 부여되어 순서 이동이 저장 후 원상복구되는 문제가 있었다.
      // 항상 "현재 가장 큰 sort_order + 1"로 계산해 중복을 방지한다.
      const maxSortOrder = referenceLines.reduce((max, r) => Math.max(max, r.sort_order ?? -1), -1);
      const created = await addInsolubleHgReferenceLine(maxSortOrder + 1);
      setReferenceLines((prev) => [...prev, created]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "10×10㎠ 도포량 기준 줄 추가 오류");
    } finally {
      setReferenceLineBusy(false);
    }
  }

  async function moveReferenceLine(id: string, direction: "up" | "down") {
    if (referenceLineBusy) return;
    const idx = referenceLines.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= referenceLines.length) return;

    const reordered = referenceLines.slice();
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    // 기존에 sort_order가 중복/결측되어 있어도 항상 바로잡히도록, 이동 후 전체 줄을 화면
    // 순서(0..n-1)로 다시 번호를 매겨 전부 저장한다. (단순히 두 줄의 sort_order만 맞바꾸면,
    // 두 줄이 이미 같은 sort_order를 갖고 있던 경우 저장해도 값이 그대로라 새로고침 시 원위치된다.)
    const renumbered = reordered.map((row, i) => ({ ...row, sort_order: i }));

    setReferenceLines(renumbered);
    setReferenceLineBusy(true);
    try {
      await Promise.all(renumbered.map((row) => saveInsolubleHgReferenceLine(row)));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "10×10㎠ 도포량 기준 순서 변경 오류");
    } finally {
      setReferenceLineBusy(false);
    }
  }

  async function removeReferenceLine(id: string) {
    if (!confirm("이 기준값 줄을 삭제하시겠습니까?")) return;
    try {
      const timers = referenceSaveTimers.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      timers.delete(id);
      await deleteInsolubleHgReferenceLine(id);
      setReferenceLines((prev) => prev.filter((row) => row.id !== id));
      setSelectedReferenceLineId((prev) => (prev === id ? null : prev));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "10×10㎠ 도포량 기준 줄 삭제 오류");
    }
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

  async function selectFormula(f: any) {
    setFormula(f);
    setMessage("");
    await loadHistory(f.formula_code, f.revision);
  }

  async function loadHistory(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      setHistory(await fetchInsolubleHgSheets(formulaCode, revision));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function updateHeaderField(key: keyof Omit<InsolubleHgHeaderInput, "cutting_line_no" | "loss_rate_preset_key" | "fabric_material_code" | "film_material_code">, value: string) {
    setHeaderInput((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
  }
  function setCuttingLineNo(value: string) {
    setHeaderInput((prev) => ({ ...prev, cutting_line_no: value }));
  }
  function updateTextField(key: "fabric_material_code" | "film_material_code", value: string) {
    setHeaderInput((prev) => ({ ...prev, [key]: value }));
  }

  function selectLossRatePreset(key: string) {
    if (key === "custom") {
      setHeaderInput((prev) => ({ ...prev, loss_rate_preset_key: null }));
      return;
    }
    const preset = LOSS_RATE_PRESETS.find((p) => p.key === key);
    setHeaderInput((prev) => ({ ...prev, loss_rate_preset_key: key, loss_rate: preset ? preset.rate : prev.loss_rate }));
  }
  function updateCustomLossRate(value: string) {
    setHeaderInput((prev) => ({ ...prev, loss_rate_preset_key: null, loss_rate: value === "" ? 0 : Number(value) / 100 }));
  }
  function updateManualNoticeCoatAmount(value: string) {
    setHeaderInput((prev) => ({ ...prev, manual_notice_coat_amount: value === "" ? null : Number(value) }));
  }

  function buildCurrentSheet(): InsolubleHgSheet {
    if (!formula) throw new Error("처방을 먼저 선택하세요.");
    return {
      formula_code: formula.formula_code,
      revision: formula.revision,
      formula_name: formula.formula_name,
      confirmed_code: formula.confirmed_code,
      note,
      ...headerInput,
      ...headerResult,
      summary_rows: summaryRows,
    };
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const sheet = buildCurrentSheet();
      const saved = await saveInsolubleHgSheet(sheet);
      setMessage("저장 완료");
      await loadHistory(saved.formula_code, saved.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  function loadFromHistory(sheet: InsolubleHgSheet) {
    setSelectedReferenceLineId(null);
    setHeaderInput({
      fabric_material_code: sheet.fabric_material_code || "",
      fabric_standard_weight: sheet.fabric_standard_weight,
      film_material_code: sheet.film_material_code || "",
      film_standard_weight: sheet.film_standard_weight,
      total_weight: sheet.total_weight,
      cutting_line_no: sheet.cutting_line_no,
      cutting_area_a4_weight: sheet.cutting_area_a4_weight,
      a4_10x10_weight: sheet.a4_10x10_weight,
      loss_rate_preset_key: sheet.loss_rate_preset_key,
      loss_rate: sheet.loss_rate,
      manual_notice_coat_amount: sheet.manual_notice_coat_amount ?? null,
      half_cut_width_cm: sheet.half_cut_width_cm,
      half_cut_height_cm: sheet.half_cut_height_cm,
    });
    setNote(sheet.note || "");
    setMessage(`불러옴: ${new Date(sheet.created_at || "").toLocaleString("ko-KR")}`);
  }

  async function removeHistory(id: string) {
    if (!confirm("이 계산 이력을 삭제하시겠습니까?")) return;
    try {
      await deleteInsolubleHgSheet(id);
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function printCurrent() {
    try { printInsolubleHgSheet(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelCurrent() {
    try { await downloadInsolubleHgExcel(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }
  function printHistoryItem(sheet: InsolubleHgSheet) {
    try { printInsolubleHgSheet(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelHistoryItem(sheet: InsolubleHgSheet) {
    try { await downloadInsolubleHgExcel(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    headerInput, updateHeaderField, updateTextField, setCuttingLineNo, selectLossRatePreset, updateCustomLossRate, updateManualNoticeCoatAmount, headerResult,
    referenceLines, referenceSettingsLoading, referenceLineBusy, updateReferenceLine, addReferenceLine, removeReferenceLine, moveReferenceLine,
    selectedReferenceLineId, selectReferenceLine,
    summaryRows,
    note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
