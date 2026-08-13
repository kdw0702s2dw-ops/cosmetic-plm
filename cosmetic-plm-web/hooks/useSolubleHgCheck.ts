"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { LOSS_RATE_PRESETS } from "@/services/sprint2/insolubleHgService";
import {
  calcHeader, deleteSolubleHgSheet, fetchSolubleHgSheets, saveSolubleHgSheet,
  fetchSolubleHgReferenceLines, addSolubleHgReferenceLine, saveSolubleHgReferenceLine, deleteSolubleHgReferenceLine,
  type SolubleHgHeaderInput, type SolubleHgSheet, type SolubleHgReferenceLine,
} from "@/services/sprint2/solubleHgService";
import { downloadSolubleHgExcel, printSolubleHgSheet } from "@/services/sprint2/solubleHgDocService";

const emptyHeaderInput: SolubleHgHeaderInput = {
  component1_raw_code: "", component1_weight: 0,
  component2_raw_code: "", component2_weight: 0,
  component3_raw_code: "", component3_weight: 0,
  total_weight: 0, cutting_line_no: "", cutting_area_a4_weight: 0, a4_10x10_weight: 0,
  loss_rate_preset_key: LOSS_RATE_PRESETS[0].key, loss_rate: LOSS_RATE_PRESETS[0].rate,
  manual_notice_coat_amount: null,
};

export function useSolubleHgCheck() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);
  const [formula, setFormula] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  const [headerInput, setHeaderInput] = useState<SolubleHgHeaderInput>(emptyHeaderInput);
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<SolubleHgSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const headerResult = useMemo(() => calcHeader(headerInput), [headerInput]);

  // "10×10㎠ 도포량 기준(부자재 제외)" 참고값 - 처방 선택/이력 불러오기와 무관하게 화면을 열 때마다
  // 마지막으로 저장된 줄들이 항상 그대로 채워져 있어야 해서(매번 찾아 입력하는 비효율 방지), 별도 전역
  // 목록으로 관리한다(불용성 HG와는 별도 데이터). 여러 줄을 추가할 수 있고, 입력 즉시 로컬 상태에
  // 반영하며 타이핑이 멈추면(0.6초) 줄 단위로 자동 DB 저장한다.
  const [referenceLines, setReferenceLines] = useState<SolubleHgReferenceLine[]>([]);
  const [referenceSettingsLoading, setReferenceSettingsLoading] = useState(true);
  const [referenceLineBusy, setReferenceLineBusy] = useState(false);
  const referenceSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchSolubleHgReferenceLines()
      .then((rows) => { if (!cancelled) setReferenceLines(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReferenceSettingsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function updateReferenceLine(id: string, key: "label" | "coat_amount_10x10_g" | "thickness_mm", value: string) {
    setReferenceLines((prev) => {
      const next = prev.map((row) => {
        if (row.id !== id) return row;
        const updated: SolubleHgReferenceLine = key === "label"
          ? { ...row, label: value === "" ? null : value }
          : { ...row, [key]: value === "" ? null : Number(value) };
        const timers = referenceSaveTimers.current;
        const existing = timers.get(id);
        if (existing) clearTimeout(existing);
        timers.set(id, setTimeout(() => {
          saveSolubleHgReferenceLine(updated).catch(() => {
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
      const created = await addSolubleHgReferenceLine(maxSortOrder + 1);
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
    // 순서(0..n-1)로 다시 번호를 매겨 전부 저장한다.
    const renumbered = reordered.map((row, i) => ({ ...row, sort_order: i }));

    setReferenceLines(renumbered);
    setReferenceLineBusy(true);
    try {
      await Promise.all(renumbered.map((row) => saveSolubleHgReferenceLine(row)));
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
      await deleteSolubleHgReferenceLine(id);
      setReferenceLines((prev) => prev.filter((row) => row.id !== id));
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
      setHistory(await fetchSolubleHgSheets(formulaCode, revision));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function updateNumericField(key: keyof Omit<SolubleHgHeaderInput, "component1_raw_code" | "component2_raw_code" | "component3_raw_code" | "cutting_line_no" | "loss_rate_preset_key">, value: string) {
    setHeaderInput((prev) => ({ ...prev, [key]: value === "" ? 0 : Number(value) }));
  }
  function updateTextField(key: "component1_raw_code" | "component2_raw_code" | "component3_raw_code" | "cutting_line_no", value: string) {
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

  function buildCurrentSheet(): SolubleHgSheet {
    if (!formula) throw new Error("처방을 먼저 선택하세요.");
    return {
      formula_code: formula.formula_code,
      revision: formula.revision,
      formula_name: formula.formula_name,
      confirmed_code: formula.confirmed_code,
      note,
      ...headerInput,
      ...headerResult,
    };
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const sheet = buildCurrentSheet();
      const saved = await saveSolubleHgSheet(sheet);
      setMessage("저장 완료");
      await loadHistory(saved.formula_code, saved.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  }

  function loadFromHistory(sheet: SolubleHgSheet) {
    setHeaderInput({
      component1_raw_code: sheet.component1_raw_code, component1_weight: sheet.component1_weight,
      component2_raw_code: sheet.component2_raw_code, component2_weight: sheet.component2_weight,
      component3_raw_code: sheet.component3_raw_code, component3_weight: sheet.component3_weight,
      total_weight: sheet.total_weight, cutting_line_no: sheet.cutting_line_no,
      cutting_area_a4_weight: sheet.cutting_area_a4_weight, a4_10x10_weight: sheet.a4_10x10_weight,
      loss_rate_preset_key: sheet.loss_rate_preset_key, loss_rate: sheet.loss_rate,
      manual_notice_coat_amount: sheet.manual_notice_coat_amount ?? null,
    });
    setNote(sheet.note || "");
    setMessage(`불러옴: ${new Date(sheet.created_at || "").toLocaleString("ko-KR")}`);
  }

  async function removeHistory(id: string) {
    if (!confirm("이 계산 이력을 삭제하시겠습니까?")) return;
    try {
      await deleteSolubleHgSheet(id);
      if (formula) await loadHistory(formula.formula_code, formula.revision);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 오류");
    }
  }

  function printCurrent() {
    try { printSolubleHgSheet(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelCurrent() {
    try { await downloadSolubleHgExcel(buildCurrentSheet()); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }
  function printHistoryItem(sheet: SolubleHgSheet) {
    try { printSolubleHgSheet(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "PDF 저장 오류"); }
  }
  async function downloadExcelHistoryItem(sheet: SolubleHgSheet) {
    try { await downloadSolubleHgExcel(sheet); } catch (e) { setMessage(e instanceof Error ? e.message : "엑셀 다운로드 오류"); }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    headerInput, updateNumericField, updateTextField, selectLossRatePreset, updateCustomLossRate, updateManualNoticeCoatAmount, headerResult,
    referenceLines, referenceSettingsLoading, referenceLineBusy, updateReferenceLine, addReferenceLine, removeReferenceLine, moveReferenceLine,
    note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
