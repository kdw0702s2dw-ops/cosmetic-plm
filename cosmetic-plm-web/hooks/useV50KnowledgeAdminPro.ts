"use client";

import { useEffect, useState } from "react";
import {
  fetchV50AdminActivities,
  fetchV50AdminSummary,
  fetchV50KnowledgeSummary,
  fetchV50ReleaseMarkers,
  searchV50CompatibilityKnowledge,
  searchV50InciKnowledge,
  searchV50RawKnowledge,
  searchV50RegulationKnowledge,
} from "@/services/enterprise-v50/knowledgeAdminProService";
import type { KnowledgeTab } from "@/types/enterpriseV50KnowledgeAdmin";

export function useV50KnowledgePro() {
  const [summary, setSummary] = useState<any | null>(null);
  const [tab, setTab] = useState<KnowledgeTab>("원료");
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [message, setMessage] = useState("지식DB PRO 준비 완료");

  async function loadSummary() {
    setSummary(await fetchV50KnowledgeSummary());
  }

  async function search(nextTab = tab, nextKeyword = keyword) {
    try {
      let data: any[] = [];
      if (nextTab === "원료") data = await searchV50RawKnowledge(nextKeyword);
      if (nextTab === "INCI") data = await searchV50InciKnowledge(nextKeyword);
      if (nextTab === "규제") data = await searchV50RegulationKnowledge(nextKeyword);
      if (nextTab === "상용성") data = await searchV50CompatibilityKnowledge(nextKeyword);
      setRows(data);
      setMessage(`${nextTab} ${data.length}건 조회 완료`);
      await loadSummary();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "검색 오류");
    }
  }

  function changeTab(nextTab: KnowledgeTab) {
    setTab(nextTab);
    search(nextTab, "");
  }

  useEffect(() => { loadSummary(); search("원료", ""); }, []);

  return { summary, tab, keyword, setKeyword, rows, message, search, changeTab };
}

export function useV50AdminPro() {
  const [summary, setSummary] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [message, setMessage] = useState("관리자 PRO 준비 완료");

  async function load() {
    try {
      const [s, m, a] = await Promise.all([
        fetchV50AdminSummary(),
        fetchV50ReleaseMarkers(),
        fetchV50AdminActivities(),
      ]);
      setSummary(s);
      setMarkers(m);
      setActivities(a);
      setMessage("관리자 데이터 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리자 데이터 조회 오류");
    }
  }

  useEffect(() => { load(); }, []);

  return { summary, markers, activities, message, load };
}
