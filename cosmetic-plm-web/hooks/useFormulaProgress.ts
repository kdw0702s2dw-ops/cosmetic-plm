import { useCallback, useEffect, useState } from "react";
import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type Stage = "처방등록" | "견본제작" | "샘플발송" | "추가요청" | "컨펌완료";

export const STAGES: Stage[] = ["처방등록", "견본제작", "샘플발송", "추가요청", "컨펌완료"];

// 추가요청을 제외한 정방향 진행 순서
const MAIN_FLOW: Stage[] = ["처방등록", "견본제작", "샘플발송", "컨펌완료"];

export interface FormulaProgressRow {
  formula_code: string;
  revision: string;
  formula_name: string | null;
  researcher: string | null;
  customer: string | null;
  current_stage: Stage;
  formula_registered_at: string | null;
  sample_made_at: string | null;
  sample_shipped_at: string | null;
  additional_request_at: string | null;
  additional_request_note: string | null;
  confirmed_at: string | null;
  document_issued: boolean;
  document_code: string | null;
  updated_at: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function nextMainStage(current: Stage): Stage | null {
  // 추가요청 상태에서 "완료 처리"를 누르면 컨펌완료로 보낸다.
  if (current === "추가요청") return "컨펌완료";
  const idx = MAIN_FLOW.indexOf(current);
  if (idx === -1 || idx === MAIN_FLOW.length - 1) return null;
  return MAIN_FLOW[idx + 1];
}

function stageDateField(stage: Stage): keyof FormulaProgressRow | null {
  switch (stage) {
    case "견본제작":
      return "sample_made_at";
    case "샘플발송":
      return "sample_shipped_at";
    case "컨펌완료":
      return "confirmed_at";
    default:
      return null;
  }
}

export function useFormulaProgress() {
  const [data, setData] = useState<FormulaProgressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabaseProductionFinal
      .from("v_home_formula_progress")
      .select("*");
    if (error) setError(error.message);
    else setData((data as FormulaProgressRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 새 처방을 진행 현황 트래킹에 등록
  const registerFormula = useCallback(
    async (input: {
      formula_code: string;
      revision: string;
      researcher: string;
      customer: string;
    }) => {
      const { error } = await supabaseProductionFinal.from("plm_formula_workflow").insert({
        formula_code: input.formula_code,
        revision: input.revision,
        researcher: input.researcher,
        customer: input.customer,
        current_stage: "처방등록",
        formula_registered_at: todayStr(),
      });
      if (error) {
        if (error.code === "23505") return { error: "이미 등록된 처방입니다." };
        return { error: error.message };
      }
      await load();
      return { error: null };
    },
    [load]
  );

  // 다음 단계로 진행 (정방향 진행)
  const advanceStage = useCallback(
    async (row: FormulaProgressRow) => {
      const next = nextMainStage(row.current_stage);
      if (!next) return { error: "더 이상 진행할 단계가 없습니다." };
      const dateField = stageDateField(next);
      const patch: Record<string, any> = { current_stage: next };
      if (dateField) patch[dateField] = todayStr();

      const { error } = await supabaseProductionFinal
        .from("plm_formula_workflow")
        .update(patch)
        .eq("formula_code", row.formula_code)
        .eq("revision", row.revision);
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [load]
  );

  // 추가요청 상태로 분기
  const requestAdditional = useCallback(
    async (row: FormulaProgressRow, note: string) => {
      const { error } = await supabaseProductionFinal
        .from("plm_formula_workflow")
        .update({
          current_stage: "추가요청",
          additional_request_at: todayStr(),
          additional_request_note: note,
        })
        .eq("formula_code", row.formula_code)
        .eq("revision", row.revision);
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [load]
  );

  // 문서 출력 여부 토글
  const toggleDocument = useCallback(
    async (row: FormulaProgressRow) => {
      const { error } = await supabaseProductionFinal
        .from("plm_formula_workflow")
        .update({ document_issued: !row.document_issued })
        .eq("formula_code", row.formula_code)
        .eq("revision", row.revision);
      if (error) return { error: error.message };
      await load();
      return { error: null };
    },
    [load]
  );

  return { data, loading, error, load, registerFormula, advanceStage, requestAdditional, toggleDocument };
}
