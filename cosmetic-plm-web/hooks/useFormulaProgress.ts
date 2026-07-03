import { useCallback, useEffect, useState } from "react";
import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export interface FormulaProgressRow {
  formula_code: string;
  revision: string;
  formula_name: string | null;
  researcher: string | null;
  customer: string | null;
  current_stage: "처방등록" | "견본제작" | "샘플발송" | "추가요청" | "컨펌완료";
  additional_request_note: string | null;
  document_issued: boolean;
  updated_at: string;
}

export function useFormulaProgress() {
  const [data, setData] = useState<FormulaProgressRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabaseProductionFinal
      .from("v_home_formula_progress")
      .select("*");
    if (!error) setData((data as FormulaProgressRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, load };
}
