"use client";

import { useEffect, useState } from "react";
import { applyGeneratedFormulaToGold, createAiResearchProject, fetchAiResearchActions, fetchAiResearchProjects, updateAiResearchAction } from "@/services/enterprise-ai-research/aiResearchService";
import type { AiResearchMode } from "@/types/enterpriseAiResearch";

export function useEnterpriseAiResearch() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [title, setTitle] = useState("AI 민감성 장벽 크림");
  const [mode, setMode] = useState<AiResearchMode>("NEW_FORMULA");
  const [productType, setProductType] = useState("Cream");
  const [claim, setClaim] = useState("Sensitive / Barrier / Moisturizing");
  const [targetCost, setTargetCost] = useState<number | null>(2500);
  const [targetCountry, setTargetCountry] = useState("KR");
  const [prompt, setPrompt] = useState("민감성 피부용 약산성 장벽 크림을 만들어줘. 원가는 2,500원 이하, 세라마이드와 판테놀 포함.");
  const [message, setMessage] = useState("Enterprise PLM v4.0 AI Research Platform 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await fetchAiResearchProjects();
      setProjects(data);
      setMessage(`AI Research Project ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function generateProject() {
    setLoading(true);
    try {
      await createAiResearchProject({ title, mode, productType, claim, targetCost, targetCountry, prompt });
      await loadProjects();
      setMessage("AI Research Project 생성 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openProject(project: any) {
    setSelected(project);
    setLoading(true);
    try {
      const data = await fetchAiResearchActions(project.project_code);
      setActions(data);
      setMessage(`${project.project_code} Action ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function changeAction(action: any, status: "OPEN" | "DONE" | "HOLD") {
    await updateAiResearchAction(action.id, status);
    if (selected) setActions(await fetchAiResearchActions(selected.project_code));
  }

  async function applyFormula() {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await applyGeneratedFormulaToGold(selected);
      await loadProjects();
      setMessage(`Gold Formula 생성 완료: ${result.formulaCode}/${result.revision}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 적용 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProjects(); }, []);

  return {
    projects, selected, actions, title, setTitle, mode, setMode, productType, setProductType, claim, setClaim,
    targetCost, setTargetCost, targetCountry, setTargetCountry, prompt, setPrompt, message, loading,
    loadProjects, generateProject, openProject, changeAction, applyFormula
  };
}
