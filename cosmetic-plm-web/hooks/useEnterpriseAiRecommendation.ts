"use client";

import { useEffect, useState } from "react";
import { fetchAiRecommendationItems, fetchAiRecommendationRuns, runAiRecommendation, updateAiRecommendationItem } from "@/services/enterprise-ai-recommendation/aiRecommendationService";

export function useEnterpriseAiRecommendation() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [requestText, setRequestText] = useState("민감성 피부용 약산성 크림. 세라마이드, 판테놀 포함. 원가 2500원 이하. EU와 중국 출시 가능.");
  const [productType, setProductType] = useState("Cream");
  const [claim, setClaim] = useState("Sensitive / Barrier / Moisturizing");
  const [targetCost, setTargetCost] = useState<number | null>(2500);
  const [targetCountry, setTargetCountry] = useState("EU,CN,KR");
  const [message, setMessage] = useState("AI Recommendation Engine 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadRuns() {
    setLoading(true);
    try {
      const data = await fetchAiRecommendationRuns();
      setRuns(data);
      setMessage(`Recommendation Run ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Run 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function run() {
    setLoading(true);
    try {
      await runAiRecommendation({ requestText, productType, claim, targetCost, targetCountry });
      await loadRuns();
      setMessage("AI Recommendation 실행 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI Recommendation 오류");
    } finally {
      setLoading(false);
    }
  }

  async function open(runRow: any) {
    setSelected(runRow);
    setLoading(true);
    try {
      const data = await fetchAiRecommendationItems(runRow.run_code);
      setItems(data);
      setMessage(`${runRow.run_code} 추천 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "추천 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function updateItem(item: any, status: "OPEN" | "APPLIED" | "HOLD" | "REJECTED") {
    await updateAiRecommendationItem(item.id, status);
    if (selected) setItems(await fetchAiRecommendationItems(selected.run_code));
  }

  useEffect(() => { loadRuns(); }, []);

  return {
    runs, selected, items, requestText, setRequestText, productType, setProductType, claim, setClaim,
    targetCost, setTargetCost, targetCountry, setTargetCountry, message, loading, loadRuns, run, open, updateItem
  };
}
