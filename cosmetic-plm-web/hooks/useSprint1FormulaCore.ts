"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildSprint1InciList,
  deleteSprint1FormulaLines,
  fetchSprint1FormulaLines,
  fetchSprint1Formulas,
  fetchSprint1RawOptions,
  nextSprint1LineNo,
  recalcSprint1Formula,
  softDeleteSprint1Formula,
  upsertSprint1Formula,
  upsertSprint1FormulaLines,
  type Sprint1Formula,
  type Sprint1FormulaLine,
} from "@/services/sprint1/formulaCoreService";
import {
  evaluateLineAgainstRules,
  fetchRegulationRules,
  validateFormulaRegulation,
  type RegulationHit,
} from "@/services/sprint2/regulationEngineService";

const emptyFormula: Sprint1Formula = {
  formula_code: "",
  revision: "R0",
  formula_name: "",
  status: "DRAFT",
  product_type: "",
  customer: "",
  target_country: "KR",
  assigned_researcher: "",
  development_type: "",
  progress_status: "개발중",
  claim: "",
};

function calcCost(line: Sprint1FormulaLine) {
  return Number(((Number(line.percentage || 0) / 100) * Number(line.unit_price || 0)).toFixed(4));
}

export function useSprint1FormulaCore() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [lines, setLines] = useState<Sprint1FormulaLine[]>([]);
  const [savedLineNos, setSavedLineNos] = useState<number[]>([]);
  const [deletedLineNos, setDeletedLineNos] = useState<number[]>([]);
  const [formula, setFormula] = useState<Sprint1Formula>(emptyFormula);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [message, setMessage] = useState("Sprint 1 처방관리 준비 완료");
  const [loading, setLoading] = useState(false);

  const [rawHits, setRawHits] = useState<any[]>([]);
  const [activeRawRow, setActiveRawRow] = useState<number | null>(null);
  const [rawSearchLoading, setRawSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 규제 즉시 대조 상태 (target_country 기준 규정 캐시 + 라인별 판정 결과)
  const [regulationRules, setRegulationRules] = useState<any[]>([]);
  const [lineWarnings, setLineWarnings] = useState<Record<number, RegulationHit[]>>({});

  const total = Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((sum, x) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));
  const inciList = buildSprint1InciList(lines);

  async function loadFormulas(k = keyword) {
    setLoading(true);
    try {
      const data = await fetchSprint1Formulas(k);
      setFormulas(data);
      setMessage(`처방 ${data.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(f: any) {
    setSelected(f);
    setFormula({ ...emptyFormula, ...f });
    const data = (await fetchSprint1FormulaLines(f.formula_code, f.revision)) as Sprint1FormulaLine[];
    setLines(data);
    setSavedLineNos(data.map((x) => x.line_no));
    setDeletedLineNos([]);
    setRawHits([]);
    setActiveRawRow(null);
    // 방금 캐시된 규정(이전 처방 기준)으로 우선 즉시 판정, target_country가 다르면 아래 useEffect가 곧 새 규정으로 다시 계산함
    setLineWarnings(() => {
      const next: Record<number, RegulationHit[]> = {};
      for (const l of data) if (l.raw_code) next[l.line_no] = evaluateLineAgainstRules(l, regulationRules);
      return next;
    });
    setMessage(`${f.formula_code}/${f.revision} 열기 완료`);
  }

  function newFormula() {
    const code = `F-${Date.now().toString().slice(-6)}`;
    setSelected(null);
    setFormula({ ...emptyFormula, formula_code: code });
    setLines([]);
    setSavedLineNos([]);
    setDeletedLineNos([]);
    setRawHits([]);
    setActiveRawRow(null);
    setLineWarnings({});
    setMessage("신규 처방 작성 시작");
  }

  async function saveFormula() {
    if (!formula.formula_code || !formula.formula_name) {
      setMessage("처방코드와 처방명은 필수입니다.");
      return;
    }

    const bannedLines = lines.filter((l) =>
      (lineWarnings[l.line_no] || []).some((h) => h.allowed_status === "BANNED")
    );
    if (bannedLines.length > 0) {
      const names = bannedLines.map((l) => l.raw_name).join(", ");
      if (!confirm(`사용금지(BANNED) 규제 대상 원료가 포함되어 있습니다: ${names}\n그래도 저장하시겠습니까?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const saved = await upsertSprint1Formula(formula);
      setSelected(saved);

      const linesToSave = lines
        .filter((l) => l.raw_code && l.raw_name)
        .map((l) => ({ ...l, formula_code: formula.formula_code, revision: formula.revision }));

      if (linesToSave.length > 0) {
        await upsertSprint1FormulaLines(linesToSave);
      }
      if (deletedLineNos.length > 0) {
        await deleteSprint1FormulaLines(formula.formula_code, formula.revision, deletedLineNos);
      }
      await recalcSprint1Formula(formula.formula_code, formula.revision);

      const nextLines = (await fetchSprint1FormulaLines(formula.formula_code, formula.revision)) as Sprint1FormulaLine[];
      setLines(nextLines);
      setSavedLineNos(nextLines.map((x) => x.line_no));
      setDeletedLineNos([]);

      // 저장 시점에 규제 경고를 plm_regulatory_alerts에 기록 (화면 즉시표시는 이미 선택 시점에 반영됨)
      let alertCount = 0;
      if (formula.target_country) {
        try {
          const alerts = await validateFormulaRegulation(saved, [formula.target_country]);
          alertCount = alerts.length;
        } catch {
          // 규제 기록 실패는 저장 자체를 막지 않음
        }
      }

      await loadFormulas();
      setMessage(`처방 저장 완료${alertCount > 0 ? ` (규제 경고 ${alertCount}건 기록)` : ""}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 저장 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeFormula() {
    if (!formula.formula_code) return;
    if (!confirm("처방을 삭제 처리하시겠습니까?")) return;
    setLoading(true);
    try {
      await softDeleteSprint1Formula(formula.formula_code, formula.revision);
      setFormula(emptyFormula);
      setLines([]);
      setSavedLineNos([]);
      setDeletedLineNos([]);
      setSelected(null);
      await loadFormulas();
      setMessage("처방 삭제 처리 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  function addLine() {
    const lineNo = nextSprint1LineNo(lines);
    setLines((prev) => [
      ...prev,
      {
        formula_code: formula.formula_code,
        revision: formula.revision,
        line_no: lineNo,
        phase: "A",
        raw_code: "",
        raw_name: "",
        inci_kr: "",
        inci_en: "",
        percentage: 0,
        function_kr: "",
        function_en: "",
        unit_price: 0,
        cost_per_kg: 0,
      },
    ]);
  }

  function updateLine(lineNo: number, patch: Partial<Sprint1FormulaLine>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.line_no !== lineNo) return l;
        const next = { ...l, ...patch };
        next.cost_per_kg = calcCost(next);
        return next;
      })
    );
    // 원료 선택/함량 변경 즉시 규정 재판정 (저장 없이 화면에만 반영)
    setLineWarnings((prev) => {
      const current = lines.find((l) => l.line_no === lineNo);
      if (!current) return prev;
      const next = { ...current, ...patch };
      if (!next.raw_code) {
        const { [lineNo]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [lineNo]: evaluateLineAgainstRules(next, regulationRules) };
    });
  }

  function removeLine(lineNo: number) {
    setLines((prev) => prev.filter((l) => l.line_no !== lineNo));
    setLineWarnings((prev) => {
      const { [lineNo]: _removed, ...rest } = prev;
      return rest;
    });
    if (savedLineNos.includes(lineNo)) {
      setDeletedLineNos((prev) => [...prev, lineNo]);
    }
    if (activeRawRow === lineNo) {
      setRawHits([]);
      setActiveRawRow(null);
      setRawSearchLoading(false);
    }
  }

  function searchRawForLine(lineNo: number, value: string) {
    updateLine(lineNo, {
      raw_name: value,
      raw_code: "",
      inci_kr: "",
      inci_en: "",
      function_kr: "",
      function_en: "",
      unit_price: 0,
    });
    setActiveRawRow(lineNo);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setRawHits([]);
      setRawSearchLoading(false);
      return;
    }
    setRawSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        setRawHits(await fetchSprint1RawOptions(value.trim()));
      } catch {
        setRawHits([]);
      } finally {
        setRawSearchLoading(false);
      }
    }, 250);
  }

  function pickRawForLine(raw: any) {
    if (activeRawRow == null) return;
    updateLine(activeRawRow, {
      raw_code: raw.raw_code,
      raw_name: raw.raw_name,
      inci_kr: raw.inci_kr,
      inci_en: raw.inci_en,
      function_kr: raw.function_kr,
      function_en: raw.function_en,
      unit_price: Number(raw.unit_price || 0),
    });
    setRawHits([]);
    setActiveRawRow(null);
  }

  useEffect(() => {
    loadFormulas("");
  }, []);

  // 전체 국가 규정을 한 번 불러온다 (배지는 특정 출시국가가 아니라 전체 국가 기준으로 대조)
  useEffect(() => {
    fetchRegulationRules("ALL")
      .then(setRegulationRules)
      .catch(() => setRegulationRules([]));
  }, []);

  // 규정이 새로 로드되면(=국가 변경) 이미 담긴 라인들도 새 규정 기준으로 다시 판정
  useEffect(() => {
    setLineWarnings(() => {
      const next: Record<number, RegulationHit[]> = {};
      for (const l of lines) if (l.raw_code) next[l.line_no] = evaluateLineAgainstRules(l, regulationRules);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regulationRules]);

  return {
    formulas, lines, formula, setFormula, keyword, setKeyword,
    selected, message, loading, total, cost, inciList,
    rawHits, activeRawRow, rawSearchLoading, lineWarnings,
    loadFormulas, openFormula, newFormula, saveFormula, removeFormula,
    addLine, updateLine, removeLine, searchRawForLine, pickRawForLine,
  };
}
