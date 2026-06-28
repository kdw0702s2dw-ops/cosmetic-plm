"use client";

import { useEffect, useState } from "react";
import {
  analyzeV60Formula,
  compareV60Formulas,
  fetchV60FormulaOptions,
  recommendV60Formula,
  runV60Compatibility,
  simulateV60Cost,
} from "@/services/enterprise-v60/cosmeticIntelligenceService";

export function useV60CosmeticIntelligence() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [target, setTarget] = useState<any | null>(null);
  const [insight, setInsight] = useState<any | null>(null);
  const [compare, setCompare] = useState<any | null>(null);
  const [compatibility, setCompatibility] = useState<any | null>(null);
  const [cost, setCost] = useState<any | null>(null);
  const [ai, setAi] = useState<any | null>(null);
  const [prompt, setPrompt] = useState("민감성 피부용 장벽 크림을 추천해줘. 원가는 낮고 사용감은 촉촉하게.");
  const [sellingPrice, setSellingPrice] = useState(12000);
  const [priceRate, setPriceRate] = useState(0);
  const [message, setMessage] = useState("v6.0 Cosmetic Intelligence 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchV60FormulaOptions();
      setFormulas(data);
      setMessage(`처방 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function selectFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const data = await analyzeV60Formula(formula);
      setInsight(data);
      setCompatibility(await runV60Compatibility(formula));
      setCost(await simulateV60Cost(formula, sellingPrice, priceRate));
      setMessage(`${formula.formula_code} Intelligence 분석 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "분석 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    if (!selected || !target) {
      setMessage("비교할 기준 처방과 대상 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const data = await compareV60Formulas(selected, target);
      setCompare(data);
      setMessage("처방 비교 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "비교 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runCost() {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await simulateV60Cost(selected, sellingPrice, priceRate);
      setCost(data);
      setMessage("원가 시뮬레이션 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원가 시뮬레이션 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runAiRecommendation() {
    setLoading(true);
    try {
      const data = await recommendV60Formula(prompt);
      setAi(data);
      setMessage("AI 추천 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 추천 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return {
    formulas, selected, target, setTarget, insight, compare, compatibility, cost, ai,
    prompt, setPrompt, sellingPrice, setSellingPrice, priceRate, setPriceRate,
    message, loading, load, selectFormula, runCompare, runCost, runAiRecommendation
  };
}
