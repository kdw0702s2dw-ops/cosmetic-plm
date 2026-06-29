"use client";

import { useEffect, useState } from "react";
import {
  buildSprint1InciList,
  deleteSprint1FormulaLine,
  fetchSprint1FormulaLines,
  fetchSprint1Formulas,
  fetchSprint1RawOptions,
  nextSprint1LineNo,
  recalcSprint1Formula,
  softDeleteSprint1Formula,
  upsertSprint1Formula,
  upsertSprint1FormulaLine,
  type Sprint1Formula,
  type Sprint1FormulaLine,
} from "@/services/sprint1/formulaCoreService";

const emptyFormula: Sprint1Formula = {
  formula_code: "",
  revision: "R0",
  formula_name: "",
  status: "DRAFT",
  product_type: "",
  customer: "",
  target_country: "KR",
  claim: "",
};

export function useSprint1FormulaCore() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [lines, setLines] = useState<Sprint1FormulaLine[]>([]);
  const [raws, setRaws] = useState<any[]>([]);
  const [formula, setFormula] = useState<Sprint1Formula>(emptyFormula);
  const [keyword, setKeyword] = useState("");
  const [rawKeyword, setRawKeyword] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("Sprint 1 처방관리 준비 완료");
  const [loading, setLoading] = useState(false);

  const total = Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((sum, x) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));
  const inciList = buildSprint1InciList(lines);

  async function loadFormulas(k = keyword) {
    setLoading(true);
    try {
      const data = await fetchSprint1Formulas(k);
      setFormulas(data);
      setMessage(`처방 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadRaws(k = rawKeyword) {
    setLoading(true);
    try {
      const data = await fetchSprint1RawOptions(k);
      setRaws(data);
      setMessage(`원료 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(f: any) {
    setSelected(f);
    setFormula({ ...emptyFormula, ...f });
    const data = await fetchSprint1FormulaLines(f.formula_code, f.revision);
    setLines(data as Sprint1FormulaLine[]);
    setMessage(`${f.formula_code}/${f.revision} 열기 완료`);
  }

  function newFormula() {
    const code = `F-${Date.now().toString().slice(-6)}`;
    setSelected(null);
    setFormula({ ...emptyFormula, formula_code: code });
    setLines([]);
    setMessage("신규 처방 작성 시작");
  }

  async function saveFormula() {
    if (!formula.formula_code || !formula.formula_name) {
      setMessage("처방코드와 처방명은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const saved = await upsertSprint1Formula(formula);
      setSelected(saved);
      await loadFormulas();
      setMessage("처방 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeFormula() {
    if (!formula.formula_code) return;
    if (!confirm("처방을 삭제 처리하시겠습니까?")) return;
    setLoading(true);
    try {
      await softDeleteSprint1Formula(formula.formula_code, formula.revision);
      setFormula(emptyFormula);
      setLines([]);
      setSelected(null);
      await loadFormulas();
      setMessage("처방 삭제 처리 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function addRaw(raw: any) {
    if (!formula.formula_code || !formula.formula_name) {
      setMessage("먼저 처방 기본정보를 저장하세요.");
      return;
    }

    await saveFormula();

    const line: Sprint1FormulaLine = {
      formula_code: formula.formula_code,
      revision: formula.revision,
      line_no: nextSprint1LineNo(lines),
      phase: "A",
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      inci_kr: raw.inci_kr,
      inci_en: raw.inci_en,
      percentage: 0,
      function_kr: raw.function_kr,
      function_en: raw.function_en,
      unit_price: Number(raw.unit_price || 0),
      cost_per_kg: 0,
    };

    const saved = await upsertSprint1FormulaLine(line);
    const next = await fetchSprint1FormulaLines(formula.formula_code, formula.revision);
    setLines(next as Sprint1FormulaLine[]);
    setMessage(`${saved.raw_name} 추가 완료`);
  }

  async function updateLine(line: Sprint1FormulaLine, patch: Partial<Sprint1FormulaLine>) {
    const nextLine = { ...line, ...patch };
    await upsertSprint1FormulaLine(nextLine);
    const data = await fetchSprint1FormulaLines(formula.formula_code, formula.revision);
    setLines(data as Sprint1FormulaLine[]);
    await recalcSprint1Formula(formula.formula_code, formula.revision);
    await loadFormulas();
    setMessage("처방 라인 수정 및 자동 계산 완료");
  }

  async function removeLine(line: Sprint1FormulaLine) {
    await deleteSprint1FormulaLine(formula.formula_code, formula.revision, line.line_no);
    const data = await fetchSprint1FormulaLines(formula.formula_code, formula.revision);
    setLines(data as Sprint1FormulaLine[]);
    await loadFormulas();
    setMessage("처방 라인 삭제 완료");
  }

  useEffect(() => {
    loadFormulas("");
    loadRaws("");
  }, []);

  return {
    formulas, lines, raws, formula, setFormula, keyword, setKeyword, rawKeyword, setRawKeyword,
    selected, message, loading, total, cost, inciList,
    loadFormulas, loadRaws, openFormula, newFormula, saveFormula, removeFormula, addRaw, updateLine, removeLine,
  };
}
