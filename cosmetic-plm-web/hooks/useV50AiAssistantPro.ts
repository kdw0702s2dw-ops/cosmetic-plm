"use client";

import { useState } from "react";
import { previewV50AiFormula, saveV50AiFormula } from "@/services/enterprise-v50/aiAssistantProService";

export function useV50AiAssistantPro() {
  const [prompt, setPrompt] = useState("민감성 피부용 약산성 장벽 크림을 만들어줘. 세라마이드와 판테놀을 포함하고 원가는 2,500원 이하로 맞춰줘.");
  const [preview, setPreview] = useState<any | null>(null);
  const [message, setMessage] = useState("AI 연구원 PRO 준비 완료");
  const [loading, setLoading] = useState(false);

  async function generatePreview() {
    setLoading(true);
    try {
      const data = await previewV50AiFormula(prompt);
      setPreview(data);
      setMessage(`AI 처방 초안 생성 완료: 총합 ${data.total}%`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 초안 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveFormula() {
    setLoading(true);
    try {
      const data = await saveV50AiFormula(prompt);
      setMessage(`처방 저장 완료: ${data.formulaCode}/${data.revision}`);
      setPreview(data.result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  return { prompt, setPrompt, preview, message, loading, generatePreview, saveFormula };
}
