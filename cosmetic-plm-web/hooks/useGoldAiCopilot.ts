"use client";

import { useEffect, useState } from "react";
import { fetchAiActions, fetchAiCopilotFormulas, fetchAiRuns, runAndSaveAiCopilot, updateAiActionStatus } from "@/services/gold-ai-copilot/aiCopilotService";
import type { AiCopilotCommandType } from "@/types/goldAiCopilot";

export function useGoldAiCopilot() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [commandType, setCommandType] = useState<AiCopilotCommandType>("LAUNCH_READINESS");
  const [prompt, setPrompt] = useState("이 처방의 출시 가능성, 원가, 안정성, 규제, 문서 준비 상태를 검토해줘.");
  const [message, setMessage] = useState("AI Copilot Complete 준비 완료");
  const [loading, setLoading] = useState(false);

  async function loadFormulas(keyword = search) {
    setLoading(true);
    try {
      const data = await fetchAiCopilotFormulas(keyword);
      setFormulas(data);
      setMessage(`Formula ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Formula 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const data = await fetchAiRuns(formula.formula_code, formula.revision);
      setRuns(data);
      setActions([]);
      setMessage(`${formula.formula_code} AI Run ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI Run 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runCopilot() {
    if (!selected) return setMessage("먼저 처방을 선택하세요.");
    setLoading(true);
    try {
      const result = await runAndSaveAiCopilot({ formulaCode: selected.formula_code, revision: selected.revision, commandType, prompt });
      setRuns(await fetchAiRuns(selected.formula_code, selected.revision));
      setActions(result.actions);
      setMessage(`AI Copilot 완료: ${result.run.status} / Action ${result.actions.length}건`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI Copilot 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openRun(run: any) {
    setLoading(true);
    try {
      const data = await fetchAiActions(run.run_code);
      setActions(data);
      setMessage(`${run.run_code} Action ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function changeActionStatus(action: any, status: "OPEN" | "DONE" | "HOLD") {
    setLoading(true);
    try {
      await updateAiActionStatus(action.id, status);
      setActions(await fetchAiActions(action.run_code));
      setMessage("Action 상태 변경 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action 상태 변경 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFormulas(""); }, []);

  return { formulas, selected, runs, actions, search, setSearch, commandType, setCommandType, prompt, setPrompt, message, loading, loadFormulas, openFormula, runCopilot, openRun, changeActionStatus };
}
