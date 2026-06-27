"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveFormula,
  cloneFormula,
  deleteLine,
  fetchFormulaSummaries,
  fetchHeader,
  fetchHistory,
  fetchLines,
  lockFormula,
  saveHeader,
  saveLine,
  searchRawMaterialsForFormula,
} from "@/services/gold-formula-live/formulaLiveCrudService";
import type { FormulaHeaderLive, FormulaHistoryLive, FormulaLineLive, FormulaSummaryLive, RawMaterialLookup } from "@/types/goldFormulaLive";

const emptyHeader: FormulaHeaderLive = {
  formula_code: "",
  formula_name: "",
  revision: "R0",
  status: "DRAFT",
  product_type: "Cream",
  customer: "",
  target_country: "KR",
  claim: "",
  created_by: "R&D",
};

const emptyLine: FormulaLineLive = {
  formula_code: "",
  revision: "R0",
  line_no: 1,
  phase: "A",
  raw_code: "",
  raw_name: "",
  inci_en: "",
  inci_kr: "",
  percentage: 0,
  function_en: "",
  note: "",
};

export function useGoldFormulaLiveCrud() {
  const [summaries, setSummaries] = useState<FormulaSummaryLive[]>([]);
  const [header, setHeader] = useState<FormulaHeaderLive>(emptyHeader);
  const [lines, setLines] = useState<FormulaLineLive[]>([]);
  const [lineForm, setLineForm] = useState<FormulaLineLive>(emptyLine);
  const [history, setHistory] = useState<FormulaHistoryLive[]>([]);
  const [rawResults, setRawResults] = useState<RawMaterialLookup[]>([]);
  const [search, setSearch] = useState("");
  const [rawSearch, setRawSearch] = useState("");
  const [newRevision, setNewRevision] = useState("R1");
  const [message, setMessage] = useState("Formula Live CRUD Pack 02-B 준비 완료");
  const [loading, setLoading] = useState(false);

  const totalPercent = useMemo(
    () => Number(lines.reduce((sum, item) => sum + Number(item.percentage || 0), 0).toFixed(4)),
    [lines]
  );
  const isValid100 = Math.abs(totalPercent - 100) < 0.0001;

  async function loadSummaries(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchFormulaSummaries(keyword);
      setSummaries(data);
      setMessage(`Formula Summary ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Summary 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      const [h, l, hist] = await Promise.all([
        fetchHeader(formulaCode, revision),
        fetchLines(formulaCode, revision),
        fetchHistory(formulaCode, revision),
      ]);
      if (h) setHeader(h);
      setLines(l);
      setHistory(hist);
      setLineForm({ ...emptyLine, formula_code: formulaCode, revision, line_no: l.length + 1 });
      setMessage(`${formulaCode} / ${revision} 열기 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 열기 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentHeader() {
    setLoading(true);
    try {
      const saved = await saveHeader(header);
      setHeader(saved);
      await loadSummaries(search);
      setMessage(`${saved.formula_code} Header 저장 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Header 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentLine() {
    if (!header.formula_code || !header.revision || !lineForm.raw_code) {
      setMessage("Header와 raw_code가 필요합니다.");
      return;
    }
    setLoading(true);
    try {
      await saveLine({ ...lineForm, formula_code: header.formula_code, revision: header.revision });
      await openFormula(header.formula_code, header.revision);
      setMessage("Line 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Line 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeLine(line: FormulaLineLive) {
    if (!confirm(`${line.line_no}번 라인을 삭제할까요?`)) return;
    setLoading(true);
    try {
      await deleteLine(line);
      await openFormula(line.formula_code, line.revision);
      setMessage("Line 삭제 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Line 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function searchRaw() {
    setLoading(true);
    try {
      const data = await searchRawMaterialsForFormula(rawSearch);
      setRawResults(data);
      setMessage(`원료 검색 ${data.length}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 검색 오류");
    } finally {
      setLoading(false);
    }
  }

  function applyRawMaterial(raw: RawMaterialLookup) {
    setLineForm({
      ...lineForm,
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      inci_kr: raw.inci_kr,
      inci_en: raw.inci_en,
    });
    setMessage(`${raw.raw_code} 원료를 라인에 적용했습니다.`);
  }

  async function cloneCurrentFormula() {
    setLoading(true);
    try {
      await cloneFormula(header.formula_code, header.revision, newRevision);
      await loadSummaries(search);
      await openFormula(header.formula_code, newRevision);
      setMessage(`${header.formula_code} ${header.revision} → ${newRevision} 복제 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "복제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function approveCurrentFormula() {
    setLoading(true);
    try {
      await approveFormula(header.formula_code, header.revision);
      await openFormula(header.formula_code, header.revision);
      await loadSummaries(search);
      setMessage("처방 승인 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "승인 오류");
    } finally {
      setLoading(false);
    }
  }

  async function lockCurrentFormula() {
    setLoading(true);
    try {
      await lockFormula(header.formula_code, header.revision);
      await openFormula(header.formula_code, header.revision);
      await loadSummaries(search);
      setMessage("처방 잠금 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "잠금 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummaries("");
  }, []);

  return {
    summaries,
    header,
    setHeader,
    lines,
    lineForm,
    setLineForm,
    history,
    rawResults,
    search,
    setSearch,
    rawSearch,
    setRawSearch,
    newRevision,
    setNewRevision,
    message,
    loading,
    totalPercent,
    isValid100,
    loadSummaries,
    openFormula,
    saveCurrentHeader,
    saveCurrentLine,
    removeLine,
    searchRaw,
    applyRawMaterial,
    cloneCurrentFormula,
    approveCurrentFormula,
    lockCurrentFormula,
  };
}
