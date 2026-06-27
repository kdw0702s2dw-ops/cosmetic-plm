"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteFormulaLine, fetchFormulaHeaders, fetchFormulaLines, upsertFormulaHeader, upsertFormulaLine, validateFormulaLines } from "@/services/gold-formula/formulaSchemaService";
import type { FormulaHeader, FormulaLine } from "@/types/goldFormula";

const emptyHeader: FormulaHeader = {
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

const emptyLine: FormulaLine = {
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

export function useGoldFormulaSchema() {
  const [headers, setHeaders] = useState<FormulaHeader[]>([]);
  const [lines, setLines] = useState<FormulaLine[]>([]);
  const [selected, setSelected] = useState<FormulaHeader | null>(null);
  const [headerForm, setHeaderForm] = useState<FormulaHeader>(emptyHeader);
  const [lineForm, setLineForm] = useState<FormulaLine>(emptyLine);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Formula Schema Pack 02-A 준비 완료");
  const [loading, setLoading] = useState(false);

  const validation = useMemo(() => validateFormulaLines(lines), [lines]);

  async function loadHeaders(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchFormulaHeaders(keyword);
      setHeaders(data);
      setMessage(`Formula Header ${data.length}개 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula Header 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function selectHeader(header: FormulaHeader) {
    setSelected(header);
    setHeaderForm(header);
    setLineForm({ ...emptyLine, formula_code: header.formula_code, revision: header.revision });
    setLoading(true);
    try {
      const data = await fetchFormulaLines(header.formula_code, header.revision);
      setLines(data);
      setMessage(`${header.formula_code} / ${header.revision} 라인 ${data.length}개 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula Line 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveHeader() {
    if (!headerForm.formula_code || !headerForm.formula_name) {
      setMessage("formula_code와 formula_name은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const saved = await upsertFormulaHeader(headerForm);
      setSelected(saved);
      setLineForm({ ...lineForm, formula_code: saved.formula_code, revision: saved.revision });
      await loadHeaders(search);
      setMessage(`${saved.formula_code} Header 저장 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Header 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveLine() {
    const formulaCode = selected?.formula_code || headerForm.formula_code;
    const revision = selected?.revision || headerForm.revision;
    if (!formulaCode || !revision || !lineForm.raw_code) {
      setMessage("Header 선택/저장 후 raw_code를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      await upsertFormulaLine({ ...lineForm, formula_code: formulaCode, revision });
      const data = await fetchFormulaLines(formulaCode, revision);
      setLines(data);
      setLineForm({ ...emptyLine, formula_code: formulaCode, revision, line_no: data.length + 1 });
      setMessage("Formula Line 저장 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Line 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeLine(line: FormulaLine) {
    if (!confirm(`${line.line_no}번 라인을 삭제할까요?`)) return;
    setLoading(true);
    try {
      await deleteFormulaLine(line.formula_code, line.revision, line.line_no);
      const data = await fetchFormulaLines(line.formula_code, line.revision);
      setLines(data);
      setMessage("Formula Line 삭제 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Line 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHeaders("");
  }, []);

  return {
    headers,
    lines,
    selected,
    headerForm,
    setHeaderForm,
    lineForm,
    setLineForm,
    search,
    setSearch,
    message,
    loading,
    validation,
    loadHeaders,
    selectHeader,
    saveHeader,
    saveLine,
    removeLine,
  };
}
