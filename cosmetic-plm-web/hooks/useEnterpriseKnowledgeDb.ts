"use client";

import { useEffect, useState } from "react";
import { fetchKnowledgeStats, searchCompatibility, searchFormulaLibrary, searchGlobalInci, searchRegulation, upsertKnowledgeRow } from "@/services/enterprise-knowledge-db/knowledgeDbService";

export function useEnterpriseKnowledgeDb() {
  const [stats, setStats] = useState<any[]>([]);
  const [tab, setTab] = useState<"INCI" | "REG" | "LIB" | "COMP">("INCI");
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("Knowledge Database 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setStats(await fetchKnowledgeStats());
  }

  async function search(nextTab = tab, nextKeyword = keyword) {
    setLoading(true);
    try {
      let data: any[] = [];
      if (nextTab === "INCI") data = await searchGlobalInci(nextKeyword);
      if (nextTab === "REG") data = await searchRegulation(nextKeyword);
      if (nextTab === "LIB") data = await searchFormulaLibrary(nextKeyword);
      if (nextTab === "COMP") data = await searchCompatibility(nextKeyword);
      setRows(data);
      setMessage(`${nextTab} ${data.length}건 조회 완료`);
      await loadStats();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "검색 오류");
    } finally {
      setLoading(false);
    }
  }

  function changeTab(nextTab: typeof tab) {
    setTab(nextTab);
    search(nextTab, "");
  }

  useEffect(() => {
    loadStats();
    search("INCI", "");
  }, []);

  return { stats, tab, keyword, setKeyword, rows, message, loading, search, changeTab };
}
