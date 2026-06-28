"use client";

import { useEffect, useState } from "react";
import { createV51DataQualitySnapshot, fetchV51DataQuality } from "@/services/enterprise-v51/dataQualityService";
import type { DataQualitySummary } from "@/types/enterpriseV51DataQuality";

export function useV51DataQuality() {
  const [summary, setSummary] = useState<DataQualitySummary | null>(null);
  const [message, setMessage] = useState("데이터 품질 점검 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchV51DataQuality();
      setSummary(data);
      setMessage(`데이터 품질 점검 완료: ${data.score}점`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "데이터 품질 점검 오류");
    } finally {
      setLoading(false);
    }
  }

  async function snapshot() {
    if (!summary) return;
    setLoading(true);
    try {
      const code = await createV51DataQualitySnapshot(summary);
      setMessage(`데이터 품질 점검 이력 저장 완료: ${code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "점검 이력 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  return { summary, message, loading, load, snapshot };
}
