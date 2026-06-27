"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchGoldFormulas, fetchGoldHealth, fetchGoldRawMaterials } from "@/services/gold-master/goldMasterLiveService";
import type { GoldAction, GoldFormula, GoldModuleHealth, GoldRawMaterial } from "@/types/goldMaster";

export function useGoldMasterLive() {
  const [health, setHealth] = useState<GoldModuleHealth[]>([]);
  const [rawMaterials, setRawMaterials] = useState<GoldRawMaterial[]>([]);
  const [formulas, setFormulas] = useState<GoldFormula[]>([]);
  const [rawSearch, setRawSearch] = useState("");
  const [formulaSearch, setFormulaSearch] = useState("");
  const [message, setMessage] = useState("Gold Master Live Core 준비 완료");
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<GoldAction[]>([
    { id: "GM-ACT-001", area: "DB", task: "10,000 원료마스터 LIVE 조회 확인", priority: "P0", status: "TODO" },
    { id: "GM-ACT-002", area: "Formula", task: "실제 처방 1건 등록 후 Formula 조회 확인", priority: "P0", status: "TODO" },
    { id: "GM-ACT-003", area: "Document", task: "처방서/전성분표 생성 결과 확인", priority: "P1", status: "TODO" },
    { id: "GM-ACT-004", area: "AI", task: "AI Copilot이 실제 DB 데이터를 참조하는지 확인", priority: "P1", status: "TODO" },
    { id: "GM-ACT-005", area: "Release", task: "v3.0 Gold Master 최종 태그 준비", priority: "P2", status: "TODO" },
  ]);

  async function loadAll() {
    setLoading(true);
    try {
      const [h, r, f] = await Promise.all([
        fetchGoldHealth(),
        fetchGoldRawMaterials(rawSearch),
        fetchGoldFormulas(formulaSearch),
      ]);
      setHealth(h);
      setRawMaterials(r);
      setFormulas(f);
      setMessage(`LIVE 로드 완료: 원료 ${r.length}개 표시 / 처방 ${f.length}개 표시`);
    } catch (error) {
      setMessage(error instanceof Error ? `오류: ${error.message}` : "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const live = health.filter((x) => x.status === "LIVE").length;
    const error = health.filter((x) => x.status === "ERROR").length;
    const done = actions.filter((x) => x.status === "DONE").length;
    return {
      live,
      total: health.length,
      error,
      rawDisplayed: rawMaterials.length,
      formulaDisplayed: formulas.length,
      actionDone: done,
      actionTotal: actions.length,
      readiness: health.length ? Math.round(((live - error) / health.length) * 100) : 0,
    };
  }, [health, rawMaterials, formulas, actions]);

  function markActionDone(id: string) {
    setActions((prev) => prev.map((x) => x.id === id ? { ...x, status: "DONE" } : x));
    setMessage("Gold Master Action 완료 처리");
  }

  return {
    health,
    rawMaterials,
    formulas,
    rawSearch,
    setRawSearch,
    formulaSearch,
    setFormulaSearch,
    message,
    loading,
    actions,
    stats,
    loadAll,
    markActionDone,
  };
}
