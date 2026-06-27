"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addV50FormulaLine,
  createV50Formula,
  deleteV50FormulaLine,
  fetchV50Batches,
  fetchV50Dashboard,
  fetchV50Documents,
  fetchV50FormulaLines,
  fetchV50Formulas,
  fetchV50RawMaterials,
  updateV50FormulaLine,
} from "@/services/enterprise-v50/liveDataService";

export function useV50DashboardLive() {
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [message, setMessage] = useState("실시간 데이터 준비 완료");

  async function load() {
    try {
      setDashboard(await fetchV50Dashboard());
      setMessage("Supabase 실시간 데이터 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "데이터 조회 오류");
    }
  }

  useEffect(() => { load(); }, []);
  return { dashboard, message, load };
}

export function useV50FormulaLive() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [raws, setRaws] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [rawSearch, setRawSearch] = useState("");
  const [message, setMessage] = useState("처방 데이터 준비 완료");

  const total = useMemo(() => Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4)), [lines]);

  async function loadFormulas(keyword = search) {
    try {
      const data = await fetchV50Formulas(keyword);
      setFormulas(data);
      setMessage(`처방 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 조회 오류");
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    try {
      const data = await fetchV50FormulaLines(formula.formula_code, formula.revision);
      setLines(data);
      setMessage(`${formula.formula_code} 원료 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 조회 오류");
    }
  }

  async function loadRaws(keyword = rawSearch) {
    try {
      const data = await fetchV50RawMaterials(keyword);
      setRaws(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 검색 오류");
    }
  }

  async function createFormula() {
    try {
      const formula = await createV50Formula({
        formula_name: "신규 처방",
        product_type: "Cream",
        customer: "Internal",
        claim: "Moisturizing",
        target_country: "KR",
      });
      await loadFormulas();
      setSelected(formula);
      setLines([]);
      setMessage(`신규 처방 생성 완료: ${formula.formula_code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 생성 오류");
    }
  }

  async function addRaw(raw: any) {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }

    try {
      await addV50FormulaLine({
        formula_code: selected.formula_code,
        revision: selected.revision,
        line_no: lines.length + 1,
        phase: "A",
        raw_code: raw.raw_code,
        raw_name: raw.raw_name,
        inci_en: raw.inci_en || "",
        inci_kr: raw.inci_kr || "",
        percentage: 1,
        function_en: raw.function_en || "",
        note: "v5.0 화면에서 추가",
      });
      await openFormula(selected);
      setMessage(`${raw.raw_name} 추가 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 추가 오류");
    }
  }

  async function updatePercent(line: any, value: number) {
    if (!line.id) return;
    try {
      await updateV50FormulaLine(line.id, { percentage: value });
      if (selected) await openFormula(selected);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "함량 수정 오류");
    }
  }

  async function removeLine(line: any) {
    if (!line.id) return;
    try {
      await deleteV50FormulaLine(line.id);
      if (selected) await openFormula(selected);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제 오류");
    }
  }

  useEffect(() => { loadFormulas(""); loadRaws(""); }, []);

  return {
    formulas, selected, lines, raws, search, setSearch, rawSearch, setRawSearch,
    message, total, loadFormulas, openFormula, loadRaws, createFormula, addRaw, updatePercent, removeLine
  };
}

export function useV50DocsLive() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [message, setMessage] = useState("문서 데이터 준비 완료");

  async function load() {
    try {
      const data = await fetchV50Documents();
      setDocuments(data);
      setMessage(`문서 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 조회 오류");
    }
  }

  useEffect(() => { load(); }, []);
  return { documents, message, load };
}

export function useV50ManufacturingLive() {
  const [batches, setBatches] = useState<any[]>([]);
  const [message, setMessage] = useState("제조 데이터 준비 완료");

  async function load() {
    try {
      const data = await fetchV50Batches();
      setBatches(data);
      setMessage(`Batch ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "제조 조회 오류");
    }
  }

  useEffect(() => { load(); }, []);
  return { batches, message, load };
}
