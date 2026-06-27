"use client";

import { useEffect, useState } from "react";
import { buildReleaseChecklist, fetchGoldReleaseCandidates, fetchGoldReleaseKpi, fetchReleaseChecklist } from "@/services/gold-release/releaseCenterService";
import type { GoldReleaseCandidate, GoldReleaseChecklist, GoldReleaseKpi } from "@/types/goldRelease";

export function useGoldReleaseCenter() {
  const [kpi, setKpi] = useState<GoldReleaseKpi | null>(null);
  const [candidates, setCandidates] = useState<GoldReleaseCandidate[]>([]);
  const [selected, setSelected] = useState<GoldReleaseCandidate | null>(null);
  const [checklist, setChecklist] = useState<GoldReleaseChecklist[]>([]);
  const [message, setMessage] = useState("GOLD MASTER Release Center 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [k, c] = await Promise.all([fetchGoldReleaseKpi(), fetchGoldReleaseCandidates()]);
      setKpi(k);
      setCandidates(c);
      setMessage(`Release Candidate ${c.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Release Center 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openCandidate(candidate: GoldReleaseCandidate) {
    setSelected(candidate);
    setLoading(true);
    try {
      const data = await fetchReleaseChecklist(candidate.formula_code, candidate.revision);
      setChecklist(data);
      setMessage(`${candidate.formula_code} Checklist ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checklist 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function generateChecklist() {
    if (!selected) return;
    setLoading(true);
    try {
      const data = await buildReleaseChecklist(selected);
      setChecklist(data);
      setMessage("Release Checklist 생성 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checklist 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return { kpi, candidates, selected, checklist, message, loading, loadAll, openCandidate, generateChecklist };
}
