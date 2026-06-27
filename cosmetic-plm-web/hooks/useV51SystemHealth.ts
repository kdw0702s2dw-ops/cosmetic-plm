"use client";

import { useEffect, useState } from "react";
import {
  createV51HealthSnapshot,
  fetchV51ReleaseMarkers,
  fetchV51SystemHealth,
} from "@/services/enterprise-v51/systemHealthService";
import type { V51HealthSummary } from "@/types/enterpriseV51SystemHealth";

export function useV51SystemHealth() {
  const [summary, setSummary] = useState<V51HealthSummary | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [message, setMessage] = useState("시스템 점검 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [health, releaseMarkers] = await Promise.all([
        fetchV51SystemHealth(),
        fetchV51ReleaseMarkers(),
      ]);
      setSummary(health);
      setMarkers(releaseMarkers);
      setMessage(`시스템 점검 완료: ${health.overall_status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "시스템 점검 오류");
    } finally {
      setLoading(false);
    }
  }

  async function snapshot() {
    if (!summary) return;
    setLoading(true);
    try {
      const code = await createV51HealthSnapshot(summary);
      setMessage(`시스템 점검 이력 저장 완료: ${code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "점검 이력 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { summary, markers, message, loading, load, snapshot };
}
