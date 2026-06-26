"use client";

import { useMemo, useState } from "react";
import { getInitialProductionFinalData, getReadinessScore } from "@/services/production-final/productionFinalData";

export function useEnterpriseProductionFinal() {
  const [data, setData] = useState(getInitialProductionFinalData());
  const [message, setMessage] = useState("Enterprise Production Final Package 준비 완료");

  const stats = useMemo(() => {
    return {
      readiness: getReadinessScore(data),
      crudLive: data.crud.filter((x) => x.crudStatus === "LIVE").length,
      crudTotal: data.crud.length,
      exportReady: data.documents.filter((x) => x.status === "READY" || x.status === "GENERATED").length,
      exportTotal: data.documents.length,
      aiReady: data.ai.filter((x) => x.status === "READY" || x.status === "EXECUTED").length,
      aiTotal: data.ai.length,
      healthGood: data.health.filter((x) => x.status === "GOOD").length,
      healthWatch: data.health.filter((x) => x.status === "WATCH").length,
      healthRisk: data.health.filter((x) => x.status === "RISK").length,
    };
  }, [data]);

  function markCrudLive(id: string) {
    setData((prev) => ({
      ...prev,
      crud: prev.crud.map((x) => x.id === id ? { ...x, crudStatus: "LIVE", persistence: "Supabase DB", audit: "ON" } : x),
    }));
    setMessage("CRUD 항목을 LIVE 상태로 변경했습니다.");
  }

  function generateDocument(id: string) {
    setData((prev) => ({
      ...prev,
      documents: prev.documents.map((x) => x.id === id ? { ...x, status: "GENERATED" } : x),
    }));
    setMessage("문서 출력 항목을 GENERATED 상태로 변경했습니다.");
  }

  function executeAi(id: string) {
    setData((prev) => ({
      ...prev,
      ai: prev.ai.map((x) => x.id === id ? { ...x, status: "EXECUTED" } : x),
    }));
    setMessage("AI Copilot 명령을 EXECUTED 상태로 변경했습니다.");
  }

  return { data, stats, message, markCrudLive, generateDocument, executeAi };
}
