"use client";

import { useEffect, useState } from "react";
import { fetchAutopilotRuns, fetchAutopilotSteps, runAiAutopilot } from "@/services/enterprise-ai-autopilot/aiAutopilotService";

export function useEnterpriseAiAutopilot() {
  const [runs, setRuns] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [title, setTitle] = useState("AI Autopilot 민감성 장벽 크림");
  const [requestText, setRequestText] = useState("민감성 피부용 약산성 장벽 크림. 세라마이드와 판테놀 포함. 원가 2500원 이하. EU/CN/KR 출시 검토.");
  const [productType, setProductType] = useState("Cream");
  const [claim, setClaim] = useState("Sensitive / Barrier / Moisturizing");
  const [targetCost, setTargetCost] = useState<number | null>(2500);
  const [targetCountry, setTargetCountry] = useState("KR,EU,CN");
  const [message, setMessage] = useState("AI Autopilot Workflow 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadRuns() {
    setLoading(true);
    try {
      const data = await fetchAutopilotRuns();
      setRuns(data);
      setMessage(`Autopilot Run ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Run 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function run() {
    setLoading(true);
    try {
      const result = await runAiAutopilot({ title, requestText, productType, claim, targetCost, targetCountry });
      await loadRuns();
      setMessage(`Autopilot 완료: ${result.formulaCode}/${result.revision}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Autopilot 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  async function open(row: any) {
    setSelected(row);
    setLoading(true);
    try {
      const data = await fetchAutopilotSteps(row.run_code);
      setSteps(data);
      setMessage(`${row.run_code} Step ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Step 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRuns(); }, []);

  return {
    runs, selected, steps, title, setTitle, requestText, setRequestText, productType, setProductType,
    claim, setClaim, targetCost, setTargetCost, targetCountry, setTargetCountry,
    message, loading, loadRuns, run, open
  };
}
