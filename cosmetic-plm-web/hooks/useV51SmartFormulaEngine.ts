"use client";

import { useEffect, useState } from "react";
import {
  applySmartWaterAdjustment,
  fetchSmartFormulaLines,
  fetchSmartFormulaOptions,
  runSmartFormulaEngine,
  updateSmartFormulaLinePercent,
} from "@/services/enterprise-v51/smartFormulaEngineService";
import type { SmartFormulaCountry, SmartFormulaResult } from "@/types/enterpriseV51SmartFormula";

export function useV51SmartFormulaEngine() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [result, setResult] = useState<SmartFormulaResult | null>(null);
  const [message, setMessage] = useState("Smart Formula Engine 준비 완료");
  const [loading, setLoading] = useState(false);
  const countries: SmartFormulaCountry[] = ["KR", "EU", "CN", "US", "JP"];

  async function loadFormulas() {
    try {
      const data = await fetchSmartFormulaOptions();
      setFormulas(data);
      setMessage(`처방 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 조회 오류");
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const data = await fetchSmartFormulaLines(formula.formula_code, formula.revision);
      setLines(data);
      const r = await runSmartFormulaEngine(formula.formula_code, formula.revision, countries);
      setResult(r);
      setMessage(`${formula.formula_code} 실시간 계산 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "계산 오류");
    } finally {
      setLoading(false);
    }
  }

  async function updatePercent(line: any, percentage: number) {
    if (!line.id || !selected) return;
    setLoading(true);
    try {
      await updateSmartFormulaLinePercent(line.id, percentage);
      await openFormula(selected);
      setMessage("함량 수정 및 자동 계산 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "함량 수정 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runNow() {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await runSmartFormulaEngine(selected.formula_code, selected.revision, countries);
      setResult(data);
      setLines(await fetchSmartFormulaLines(selected.formula_code, selected.revision));
      setMessage("Smart Formula Engine 재계산 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "재계산 오류");
    } finally {
      setLoading(false);
    }
  }

  async function adjustWater() {
    if (!selected) return;
    setLoading(true);
    try {
      await applySmartWaterAdjustment(selected.formula_code, selected.revision);
      await openFormula(selected);
      setMessage("정제수 자동보정 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "정제수 자동보정 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFormulas(); }, []);

  return {
    formulas,
    selected,
    lines,
    result,
    message,
    loading,
    loadFormulas,
    openFormula,
    updatePercent,
    runNow,
    adjustWater,
  };
}
