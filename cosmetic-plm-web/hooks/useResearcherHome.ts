"use client";

import { useEffect, useState } from "react";
import { fetchResearcherHomeData, type ResearcherHomeData } from "@/services/sprint2/researcherHomeService";

const empty: ResearcherHomeData = {
  kpis: { rawMaterials: 0, formulas: 0, documents: 0, formulaLines: 0, warnings: 0, todayTasks: 0 },
  recentFormulas: [],
  recentRawMaterials: [],
  recentDocuments: [],
  regulationWatch: [],
  aiRecommendations: [],
  todayTasks: [],
};

export function useResearcherHome() {
  const [data, setData] = useState<ResearcherHomeData>(empty);
  const [message, setMessage] = useState("연구원 홈 실시간 데이터 준비 중");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const next = await fetchResearcherHomeData();
      setData(next);
      setMessage(`실시간 데이터 조회 완료 · ${new Date().toLocaleTimeString("ko-KR")}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "연구원 홈 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const channel = supabaseRealtimeHome(load);
    return () => {
      try { channel?.unsubscribe?.(); } catch {}
    };
  }, []);

  return { data, message, loading, load };
}

function supabaseRealtimeHome(load: () => void) {
  try {
    const { supabaseProductionFinal } = require("@/lib/supabaseProductionFinalClient");
    return supabaseProductionFinal
      .channel("researcher-home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "plm_formulas" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "plm_formula_lines" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "plm_raw_materials" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "plm_documents" }, load)
      .subscribe();
  } catch {
    return null;
  }
}
