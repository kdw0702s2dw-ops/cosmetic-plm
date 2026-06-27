"use client";

import { useEffect, useState } from "react";
import {
  createGoldMasterSnapshot,
  fetchGoldMasterCompletion,
} from "@/services/enterprise-v51/goldMasterCompletionService";
import type { GoldMasterSummary } from "@/types/enterpriseV51GoldMaster";

export function useV51GoldMasterCompletion() {
  const [summary, setSummary] = useState<GoldMasterSummary | null>(null);
  const [message, setMessage] = useState("GOLD MASTER 점검 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchGoldMasterCompletion();
      setSummary(data);
      setMessage(`GOLD MASTER 완성도 점검 완료: ${data.overall_score}점`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "완성도 점검 오류");
    } finally {
      setLoading(false);
    }
  }

  async function snapshot() {
    if (!summary) return;
    setLoading(true);
    try {
      const code = await createGoldMasterSnapshot(summary);
      setMessage(`GOLD MASTER 점검 이력 저장 완료: ${code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "점검 이력 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { summary, message, loading, load, snapshot };
}
