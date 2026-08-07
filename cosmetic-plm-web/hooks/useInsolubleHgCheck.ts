"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import {
  calcHeader, calcSummaryRows, deleteInsolubleHgSheet, fetchInsolubleHgSheets, saveInsolubleHgSheet,
  fetchInsolubleHgReferenceSettings, saveInsolubleHgReferenceSettings,
  LOSS_RATE_PRESETS, type InsolubleHgHeaderInput, type InsolubleHgSheet, type InsolubleHgReferenceSettings,
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
  // 마지막으로 저장된 값이 항상 채워져 있어야 해서(매번 찾아 입력하는 비효율 방지), 별도 전역 설정으로
  // 관리한다. 입력 즉시 로컬 상태에 반영하고, 타이핑이 멈추면(0.6초) 자동으로 DB에 저장한다.
  const [referenceSettings, setReferenceSettings] = useState<InsolubleHgReferenceSettings>({
    coat_amount_10x10_g: null, thickness_mm: null,
  });
  const [referenceSettingsLoading, setReferenceSettingsLoading] = useState(true);
  const referenceSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInsolubleHgReferenceSettings()
      .then((s) => { if (!cancelled) setReferenceSettings(s); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReferenceSettingsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function updateReferenceSetting(key: keyof InsolubleHgReferenceSettings, value: string) {
    const num = value === "" ? null : Number(value);
    setReferenceSettings((prev) => {
      const next = { ...prev, [key]: num };
      if (referenceSaveTimer.current) clearTimeout(referenceSaveTimer.current);
      referenceSaveTimer.current = setTimeout(() => {
        saveInsolubleHgReferenceSettings(next).catch(() => {
          setMessage("10×10㎠ 도포량 기준 저장 오류");
        });
      }, 600);
      return next;
    });
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
    referenceSettings, referenceSettingsLoading, updateReferenceSetting,
    summaryRows,
    note, setNote,
    history, loading, saving, message, save, loadFromHistory, removeHistory,
    printCurrent, downloadExcelCurrent, printHistoryItem, downloadExcelHistoryItem,
  };
}
