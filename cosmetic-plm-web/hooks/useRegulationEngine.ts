"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRegulationAlerts, fetchRegulationFormulas, fetchRegulationRules, updateRegulationAlertStatus, validateAllRecentFormulas, validateFormulaRegulation, type RegulationRegion } from "@/services/sprint2/regulationEngineService";

const defaultRegions: RegulationRegion[] = ["KR", "EU", "CN", "US"];

export function useRegulationEngine() {
  const [regions, setRegions] = useState<RegulationRegion[]>(defaultRegions);
  const [activeRegion, setActiveRegion] = useState<RegulationRegion | "ALL">("ALL");
  const [rules, setRules] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("규제검증 준비 완료");
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const byRegion: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    for (const a of alerts) {
      byRegion[a.region] = (byRegion[a.region] || 0) + 1;
      byLevel[a.warning_level] = (byLevel[a.warning_level] || 0) + 1;
    }
    return { byRegion, byLevel, total: alerts.length };
  }, [alerts]);

  function toggleRegion(region: RegulationRegion) {
    setRegions((prev) => prev.includes(region) ? prev.filter((x) => x !== region) : [...prev, region]);
  }

  async function load() {
    setLoading(true);
    try {
      const [r, a, f] = await Promise.all([fetchRegulationRules(activeRegion), fetchRegulationAlerts(activeRegion), fetchRegulationFormulas(keyword)]);
      setRules(r);
      setAlerts(a);
      setFormulas(f);
      setMessage(`규제 데이터 조회 완료 · 규칙 ${r.length}건 · 경고 ${a.length}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "규제 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function validateOne(formula: any) {
    if (regions.length === 0) { setMessage("검증할 국가를 1개 이상 선택하세요."); return; }
    setLoading(true);
    try {
      const result = await validateFormulaRegulation(formula, regions);
      await load();
      setMessage(`${formula.formula_name} 규제검증 완료 · 경고 ${result.length}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "규제검증 오류");
    } finally {
      setLoading(false);
    }
  }

  async function validateAll() {
    if (regions.length === 0) { setMessage("검증할 국가를 1개 이상 선택하세요."); return; }
    setLoading(true);
    try {
      const result = await validateAllRecentFormulas(regions);
      const count = result.reduce((sum, x) => sum + x.alerts.length, 0);
      await load();
      setMessage(`최근 처방 일괄 규제검증 완료 · 경고 ${count}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "일괄 규제검증 오류");
    } finally {
      setLoading(false);
    }
  }

  async function setAlertStatus(id: string, status: "OPEN" | "CONFIRMED" | "RESOLVED" | "IGNORED") {
    setLoading(true);
    try {
      await updateRegulationAlertStatus(id, status);
      await load();
      setMessage(`경고 상태 변경 완료: ${status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상태 변경 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeRegion]);

  return { regions, activeRegion, setActiveRegion, toggleRegion, rules, alerts, formulas, keyword, setKeyword, message, loading, summary, load, validateOne, validateAll, setAlertStatus };
}
