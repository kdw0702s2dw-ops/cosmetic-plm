"use client";

import { useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines, type Sprint1Formula, type Sprint1FormulaLine } from "@/services/sprint1/formulaCoreService";
import { fetchInsolubleHgSheets, type InsolubleHgSheet } from "@/services/sprint2/insolubleHgService";
import { fetchSolubleHgSheets, type SolubleHgSheet } from "@/services/sprint2/solubleHgService";
import { fetchMaterialsByCodes } from "@/services/sprint2/materialService";
import { fetchUnifiedBomRows, saveUnifiedBomRows, type UnifiedBomRow } from "@/services/sprint2/unifiedBomRowsService";

// 통합 BOM - 처방 하나를 고르면 ① 완제품→충전품→절단품→코팅품→처방→부자재를 직접 입력하는 통합 BOM 표
// (plm_unified_bom_rows, 이 화면에서 바로 입력/수정/저장 - 예전 "생산 BOM 전개"를 대체)와 ② 참고용
// 읽기 전용 정보(원료 BOM, 필름·원단·칼선)를 한 화면에 모아서 보여준다. ②는 각자의 원래 화면
// (처방관리/생산관리)에서 그대로 입력/수정하고 여기서는 참고만 한다.
export function useUnifiedBomView() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<Sprint1Formula[]>([]);
  const [formula, setFormula] = useState<Sprint1Formula | null>(null);
  const [searching, setSearching] = useState(false);

  const [rawLines, setRawLines] = useState<Sprint1FormulaLine[]>([]);
  const [bomRows, setBomRows] = useState<UnifiedBomRow[]>([]);
  const [latestInsoluble, setLatestInsoluble] = useState<InsolubleHgSheet | null>(null);
  const [latestSoluble, setLatestSoluble] = useState<SolubleHgSheet | null>(null);
  const [materialNames, setMaterialNames] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function search() {
    setSearching(true);
    try {
      setFormulas(await searchProductionFormulas(keyword));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "처방 검색 오류");
    } finally {
      setSearching(false);
    }
  }

  async function selectFormula(f: Sprint1Formula) {
    setFormula(f);
    setMessage("");
    setLoading(true);
    try {
      const [lines, rows, insolubleSheets, solubleSheets] = await Promise.all([
        fetchSprint1FormulaLines(f.formula_code, f.revision),
        fetchUnifiedBomRows(f.formula_code, f.revision),
        fetchInsolubleHgSheets(f.formula_code, f.revision),
        fetchSolubleHgSheets(f.formula_code, f.revision),
      ]);
      setRawLines(lines);
      setBomRows(rows);
      // 조회 함수들은 created_at 내림차순으로 오므로 배열의 첫 번째가 가장 최근 저장분
      const latestIns = insolubleSheets[0] || null;
      const latestSol = solubleSheets[0] || null;
      setLatestInsoluble(latestIns);
      setLatestSoluble(latestSol);

      // 필름/원단 관리기준에 쓰인 부자재 코드를 이름으로 같이 보여주기 위해 한 번에 조회
      const codes = [
        latestIns?.fabric_material_code,
        latestIns?.film_material_code,
        latestSol?.component1_raw_code,
        latestSol?.component2_raw_code,
        latestSol?.component3_raw_code,
      ].filter((c): c is string => !!c);
      if (codes.length > 0) {
        const materials = await fetchMaterialsByCodes(codes);
        setMaterialNames(new Map(materials.map((m) => [m.material_code, m.material_name])));
      } else {
        setMaterialNames(new Map());
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "통합 BOM 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  function materialName(code?: string | null) {
    if (!code) return null;
    return materialNames.get(code) || null;
  }

  function addBomRow() {
    setBomRows((prev) => [...prev, {}]);
  }

  function updateBomRow(index: number, patch: Partial<UnifiedBomRow>) {
    setBomRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeBomRow(index: number) {
    setBomRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveBomRows() {
    if (!formula) return;
    setSaving(true);
    try {
      const saved = await saveUnifiedBomRows(formula.formula_code, formula.revision, bomRows);
      setBomRows(saved);
      setMessage("통합 BOM 저장 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "통합 BOM 저장 오류");
    } finally {
      setSaving(false);
    }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    rawLines, bomRows, addBomRow, updateBomRow, removeBomRow, saveBomRows, saving,
    latestInsoluble, latestSoluble, materialName,
    loading, message,
  };
}
