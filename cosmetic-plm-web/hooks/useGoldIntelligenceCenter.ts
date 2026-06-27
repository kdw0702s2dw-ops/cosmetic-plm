"use client";

import { useEffect, useState } from "react";
import { fetchIntelligenceFormulas, fetchSavedIntelligence, runAndSaveIntelligence } from "@/services/gold-intelligence/intelligenceCenterService";

export function useGoldIntelligenceCenter() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [score, setScore] = useState<any | null>(null);
  const [stabilityRisks, setStabilityRisks] = useState<any[]>([]);
  const [regulationRisks, setRegulationRisks] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Formula Intelligence Center 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadFormulas(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchIntelligenceFormulas(keyword);
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
      const saved = await fetchSavedIntelligence(formula.formula_code, formula.revision);
      setScore(saved.score);
      setStabilityRisks(saved.stabilityRisks);
      setRegulationRisks(saved.regulationRisks);
      setRecommendations(saved.recommendations);
      setMessage(`${formula.formula_code} Intelligence 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Intelligence 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runIntelligence() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await runAndSaveIntelligence(selected.formula_code, selected.revision);
      setScore(result.score);
      setStabilityRisks(result.stabilityRisks);
      setRegulationRisks(result.regulationRisks);
      setRecommendations(result.recommendations);
      setMessage(`Intelligence 실행 완료: Overall ${result.score.overall_score}점 / ${result.score.status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Intelligence 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormulas("");
  }, []);

  return {
    formulas,
    selected,
    score,
    stabilityRisks,
    regulationRisks,
    recommendations,
    search,
    setSearch,
    message,
    loading,
    loadFormulas,
    openFormula,
    runIntelligence,
  };
}
