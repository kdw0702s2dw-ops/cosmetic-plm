"use client";

import { useEffect, useState } from "react";
import { fetchFormulaCostTargets, fetchSavedCost, runAndSaveFormulaCost } from "@/services/gold-formula-cost/formulaCostService";

export function useGoldFormulaCost() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [targetCost, setTargetCost] = useState<number | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [message, setMessage] = useState("Formula Cost Engine 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadFormulas() {
    setLoading(true);
    try {
      const data = await fetchFormulaCostTargets();
      setFormulas(data);
      setMessage(`Formula ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const saved = await fetchSavedCost(formula.formula_code, formula.revision);
      setSummary(saved.summary);
      setLines(saved.lines);
      setRecommendations(saved.recommendations);
      setMessage(`${formula.formula_code} 원가 데이터 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원가 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runCost() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await runAndSaveFormulaCost(selected.formula_code, selected.revision, targetCost);
      setSummary(result.summary);
      setLines(result.lines);
      setRecommendations(result.recommendations);
      setMessage(`원가 계산 완료: kg당 ${result.summary.total_cost_per_kg.toLocaleString()}원`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원가 계산 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormulas();
  }, []);

  return {
    formulas,
    selected,
    targetCost,
    setTargetCost,
    summary,
    lines,
    recommendations,
    message,
    loading,
    loadFormulas,
    openFormula,
    runCost,
  };
}
