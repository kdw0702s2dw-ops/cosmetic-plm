"use client";

import { useEffect, useState } from "react";
import { fetchFormulaListForValidation, fetchValidationIssues, fetchValidationRuns, runAndSaveFormulaValidation } from "@/services/gold-formula-validation/formulaValidationService";
import type { FormulaValidationIssue, FormulaValidationRun } from "@/types/goldFormulaValidation";

export function useGoldFormulaValidation() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFormula, setSelectedFormula] = useState<any | null>(null);
  const [runs, setRuns] = useState<FormulaValidationRun[]>([]);
  const [issues, setIssues] = useState<FormulaValidationIssue[]>([]);
  const [message, setMessage] = useState("Formula Validation Engine 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadFormulas(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchFormulaListForValidation(keyword);
      setFormulas(data);
      setMessage(`Formula ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelectedFormula(formula);
    setLoading(true);
    try {
      const data = await fetchValidationRuns(formula.formula_code, formula.revision);
      setRuns(data);
      setIssues([]);
      setMessage(`${formula.formula_code} 검증 이력 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "검증 이력 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runValidation() {
    if (!selectedFormula) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await runAndSaveFormulaValidation(selectedFormula.formula_code, selectedFormula.revision);
      const newRuns = await fetchValidationRuns(selectedFormula.formula_code, selectedFormula.revision);
      setRuns(newRuns);
      setIssues(result.issues);
      setMessage(`검증 완료: ${result.run.validation_status} / 이슈 ${result.issues.length}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "검증 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openRun(run: FormulaValidationRun) {
    if (!run.id) return;
    setLoading(true);
    try {
      const data = await fetchValidationIssues(run.id);
      setIssues(data);
      setMessage(`${run.id} 이슈 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "이슈 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormulas("");
  }, []);

  return {
    formulas,
    search,
    setSearch,
    selectedFormula,
    runs,
    issues,
    message,
    loading,
    loadFormulas,
    openFormula,
    runValidation,
    openRun,
  };
}
