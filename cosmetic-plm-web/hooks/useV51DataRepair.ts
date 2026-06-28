"use client";

import { useEffect, useState } from "react";
import {
  createPlaceholderRawMaterialsForOrphans,
  fetchV51DataRepairPreview,
  fillMissingPricesWithZero,
  repairWrongTotalsByWater,
  saveDataRepairActivity,
} from "@/services/enterprise-v51/dataRepairService";
import type { DataRepairPreview, DataRepairResult } from "@/types/enterpriseV51DataRepair";

export function useV51DataRepair() {
  const [preview, setPreview] = useState<DataRepairPreview | null>(null);
  const [results, setResults] = useState<DataRepairResult[]>([]);
  const [message, setMessage] = useState("데이터 보정 도우미 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchV51DataRepairPreview();
      setPreview(data);
      setMessage("보정 가능 항목 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "보정 항목 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runWaterRepair() {
    setLoading(true);
    try {
      const result = await repairWrongTotalsByWater();
      setResults((prev) => [result, ...prev]);
      await load();
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "정제수 자동보정 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runOrphanRepair() {
    setLoading(true);
    try {
      const result = await createPlaceholderRawMaterialsForOrphans();
      setResults((prev) => [result, ...prev]);
      await load();
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "누락 원료 보정 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runPriceRepair() {
    setLoading(true);
    try {
      const result = await fillMissingPricesWithZero();
      setResults((prev) => [result, ...prev]);
      await load();
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "단가 보정 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveActivity() {
    setLoading(true);
    try {
      const code = await saveDataRepairActivity(results);
      setMessage(`데이터 보정 이력 저장 완료: ${code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "보정 이력 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { preview, results, message, loading, load, runWaterRepair, runOrphanRepair, runPriceRepair, saveActivity };
}
