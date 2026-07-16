"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildSprint1InciList,
  deleteSprint1FormulaLines,
  fetchProductionBomRows,
  fetchSprint1FormulaLines,
  fetchSprint1Formulas,
  fetchSprint1RawOptions,
  nextSprint1LineNo,
  nextPhaseSeq,
  normalizeDuplicatePhaseSeq,
  recalcSprint1Formula,
  saveProductionBomRows,
  softDeleteSprint1Formula,
  sortLinesForDisplay,
  upsertSprint1Formula,
  upsertSprint1FormulaLines,
  type ProductionBomRow,
  type Sprint1Formula,
  type Sprint1FormulaLine,
} from "@/services/sprint1/formulaCoreService";
import {
  evaluateLineAgainstRules,
  fetchRegulationRules,
  validateFormulaRegulation,
  type RegulationHit,
} from "@/services/sprint2/regulationEngineService";
import { calculateAllergenAlerts } from "@/services/sprint2/allergenService";
import {
  byRawComponents,
  complexRows,
  fetchComponentsByRawCodes,
  mergeRows,
  singleRows,
  type ExpandedRow,
} from "@/services/sprint2/documentPdfService";

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
  exposure_type: "",
  target_market: "",
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

  // 생산 BOM 전개 상태 (원료 BOM과 별개, 현재 열려있는 처방에 자동으로 연결됨)
  const [productionBomRows, setProductionBomRows] = useState<ProductionBomRow[]>([]);

  // 자동 전성분(복합원료 구성성분 전개 + INCI 병합) 계산용 원료별 구성성분 캐시
  // - raw_code 집합이 바뀔 때만 DB에서 다시 불러온다 (함량%만 바뀌는 경우는 아래에서 즉시 재계산)
  const [rawComponentsMap, setRawComponentsMap] = useState<Map<string, any[]>>(new Map());
  const rawCodeKey = Array.from(new Set(lines.map((l) => l.raw_code).filter(Boolean))).sort().join(",");

  const total = Number(lines.reduce((sum, x) => sum + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((sum, x) => sum + Number(x.cost_per_kg || 0), 0).toFixed(4));
  const inciList = buildSprint1InciList(lines);

  // 문서관리 PDF(단일성분표/전성분표)와 동일한 mergeRows() 파이프라인을 재사용:
  // 복합원료(premix)는 plm_raw_material_components 구성성분으로 전개하고, 단일원료는 라인 자신의 INCI를 사용해 병합한다.
  const rawComponentsForLines = Array.from(rawComponentsMap.values()).flat();
  const mergedInciRows: ExpandedRow[] = mergeRows([
    ...complexRows(lines, rawComponentsForLines),
    ...singleRows(lines, rawComponentsForLines),
  ]);

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
    // 같은 Phase 내 phase_seq가 중복된 처방은 열 때마다 화면에서 1,2,3...으로 정리해서 보여준다.
    // DB에는 저장 버튼을 눌러야 반영됨 (다른 화면에서 다시 열어도 정리된 값이 매번 다시 계산되어 표시됨).
    const normalized = normalizeDuplicatePhaseSeq(data);
    setLines(normalized);
    setSavedLineNos(normalized.map((x) => x.line_no));
    setDeletedLineNos([]);
    setRawHits([]);
    setActiveRawRow(null);
    // 방금 캐시된 규정(이전 처방 기준)으로 우선 즉시 판정, target_country가 다르면 아래 useEffect가 곧 새 규정으로 다시 계산함
    setLineWarnings(() => {
      const next: Record<number, RegulationHit[]> = {};
      for (const l of data) if (l.raw_code) next[l.line_no] = evaluateLineAgainstRules(l, regulationRules);
      return next;
    });
    try {
      setProductionBomRows(await fetchProductionBomRows(f.formula_code, f.revision));
    } catch {
      setProductionBomRows([]);
    }
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
    setProductionBomRows([]);
    setMessage("신규 처방 작성 시작");
  }

  async function saveFormula(): Promise<{ ok: boolean; message: string } | undefined> {
    if (!formula.formula_code || !formula.formula_name) {
      const msg = "처방코드와 처방명은 필수입니다.";
      setMessage(msg);
      return { ok: false, message: msg };
    }

    const bannedLines = lines.filter((l) =>
      (lineWarnings[l.line_no] || []).some((h) => h.allowed_status === "BANNED")
    );
    if (bannedLines.length > 0) {
      const names = bannedLines.map((l) => l.raw_name).join(", ");
      if (!confirm(`사용금지(BANNED) 규제 대상 원료가 포함되어 있습니다: ${names}\n그래도 저장하시겠습니까?`)) {
        return undefined; // 사용자가 취소한 경우 - 실패가 아니므로 토스트를 띄우지 않음
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

      // 규제 경고와 정확히 같은 시점에 알러젠 표시 대상도 계산해서 plm_allergen_alerts에 기록
      let allergenCount = 0;
      if (formula.exposure_type) {
        try {
          allergenCount = await calculateAllergenAlerts(formula.formula_code, formula.revision);
        } catch {
          // 알러젠 계산 실패는 저장 자체를 막지 않음
        }
      }

      const marketNotice = formula.exposure_type && !formula.target_market ? " (대상 시장 미지정 → KR 기준 적용)" : "";

      // 생산 BOM 전개는 현재 열려있는 처방(formula_code/revision)에 자동으로 연결해서 저장
      try {
        const savedBomRows = await saveProductionBomRows(formula.formula_code, formula.revision, productionBomRows);
        setProductionBomRows(savedBomRows);
      } catch {
        // 생산 BOM 저장 실패는 처방 저장 자체를 막지 않음
      }

      await loadFormulas();
      const okMsg = `처방 저장 완료${alertCount > 0 ? ` (규제 경고 ${alertCount}건 기록)` : ""}${allergenCount > 0 ? ` (알러젠 ${allergenCount}건 계산)` : ""}${marketNotice}`;
      setMessage(okMsg);
      return { ok: true, message: okMsg };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "처방 저장 오류";
      setMessage(errMsg);
      return { ok: false, message: errMsg };
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
      setProductionBomRows([]);
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
    const phaseSeq = nextPhaseSeq(lines, "A");
    setLines((prev) => [
      ...prev,
      {
        formula_code: formula.formula_code,
        revision: formula.revision,
        line_no: lineNo,
        phase: "A",
        phase_seq: phaseSeq,
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

  // 같은 Phase 안에서만 순서 변경 (다른 Phase로는 이동 불가). updateLine()은 원가/규제까지 재계산하므로
  // phase_seq만 바꾸는 이 동작엔 재사용하지 않고 별도로 둔다.
  function moveLinePhaseSeq(lineNo: number, direction: "up" | "down") {
    setLines((prev) => {
      const current = prev.find((l) => l.line_no === lineNo);
      if (!current) return prev;
      const phase = current.phase || "A";
      const group = sortLinesForDisplay(prev.filter((l) => (l.phase || "A") === phase));
      const idx = group.findIndex((l) => l.line_no === lineNo);
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= group.length) return prev;

      // 이동 후 그룹 순서대로 1..N 재부여 (스왑 대신 전체 재계산 - 기존 중복/공백도 함께 정리됨)
      const reordered = [...group];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(targetIdx, 0, moved);
      const patches = new Map<number, number>();
      reordered.forEach((l, i) => patches.set(l.line_no, i + 1));

      return prev.map((l) => (patches.has(l.line_no) ? { ...l, phase_seq: patches.get(l.line_no)! } : l));
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

  function addProductionBomRow() {
    setProductionBomRows((prev) => [...prev, {}]);
  }

  function updateProductionBomRow(index: number, patch: Partial<ProductionBomRow>) {
    setProductionBomRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeProductionBomRow(index: number) {
    setProductionBomRows((prev) => prev.filter((_, i) => i !== index));
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

  // BOM에 쓰인 원료 구성(raw_code) 집합이 바뀔 때만 구성성분을 다시 불러온다 (함량%만 바뀌는 경우는 즉시 로컬 재계산됨)
  useEffect(() => {
    const codes = rawCodeKey ? rawCodeKey.split(",") : [];
    if (codes.length === 0) {
      setRawComponentsMap(new Map());
      return;
    }
    let cancelled = false;
    fetchComponentsByRawCodes(codes)
      .then((components) => {
        if (!cancelled) setRawComponentsMap(byRawComponents(components));
      })
      .catch(() => {
        if (!cancelled) setRawComponentsMap(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [rawCodeKey]);

  return {
    formulas, lines, formula, setFormula, keyword, setKeyword,
    selected, message, loading, total, cost, inciList, mergedInciRows,
    rawHits, activeRawRow, rawSearchLoading, lineWarnings,
    loadFormulas, openFormula, newFormula, saveFormula, removeFormula,
    addLine, updateLine, removeLine, moveLinePhaseSeq, searchRawForLine, pickRawForLine,
    productionBomRows, addProductionBomRow, updateProductionBomRow, removeProductionBomRow,
  };
}
