"use client";

import { useState } from "react";
import { createV50DocumentPackage, fetchV50WorkspaceStatus, runV50Cost, runV50Score, runV50Validation } from "@/services/enterprise-v50/formulaWorkspaceProService";

export function useV50FormulaWorkspacePro() {
  const [status, setStatus] = useState<any | null>(null);
  const [message, setMessage] = useState("처방 작업도구 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadStatus(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      setStatus(await fetchV50WorkspaceStatus(formulaCode, revision));
      setMessage("처방 상태 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "상태 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runValidation(formulaCode: string, revision: string) {
    await runV50Validation(formulaCode, revision);
    await loadStatus(formulaCode, revision);
    setMessage("처방 검증 완료");
  }

  async function runCost(formulaCode: string, revision: string) {
    await runV50Cost(formulaCode, revision);
    await loadStatus(formulaCode, revision);
    setMessage("원가 계산 완료");
  }

  async function runScore(formulaCode: string, revision: string) {
    await runV50Score(formulaCode, revision);
    await loadStatus(formulaCode, revision);
    setMessage("처방 평가 완료");
  }

  async function createDocs(formulaCode: string, revision: string) {
    await createV50DocumentPackage(formulaCode, revision);
    await loadStatus(formulaCode, revision);
    setMessage("문서 패키지 생성 완료");
  }

  async function runAll(formulaCode: string, revision: string) {
    setLoading(true);
    try {
      await runV50Validation(formulaCode, revision);
      await runV50Cost(formulaCode, revision);
      await runV50Score(formulaCode, revision);
      await createV50DocumentPackage(formulaCode, revision);
      await loadStatus(formulaCode, revision);
      setMessage("검증·원가·평가·문서 생성 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "전체 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  return { status, message, loading, loadStatus, runValidation, runCost, runScore, createDocs, runAll };
}
