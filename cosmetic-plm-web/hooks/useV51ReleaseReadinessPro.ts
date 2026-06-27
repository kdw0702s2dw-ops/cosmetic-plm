"use client";

import { useEffect, useState } from "react";
import {
  calculateV51ReleaseReadiness,
  fetchV51ReleaseFormulas,
  fetchV51ReleaseHistory,
} from "@/services/enterprise-v51/releaseReadinessProService";

export function useV51ReleaseReadinessPro() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState("출시 준비도 PRO 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const f = await fetchV51ReleaseFormulas();
      setFormulas(f);
      setHistory(await fetchV51ReleaseHistory());
      setMessage(`처방 ${f.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function selectFormula(formula: any) {
    setSelected(formula);
    setResult(null);
    setHistory(await fetchV51ReleaseHistory(formula.formula_code, formula.revision));
    setMessage(`${formula.formula_code} 선택 완료`);
  }

  async function runReadiness() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const data = await calculateV51ReleaseReadiness(selected);
      setResult(data);
      setHistory(await fetchV51ReleaseHistory(selected.formula_code, selected.revision));
      setMessage("출시 준비도 계산 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "출시 준비도 계산 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { formulas, selected, result, history, message, loading, load, selectFormula, runReadiness };
}
