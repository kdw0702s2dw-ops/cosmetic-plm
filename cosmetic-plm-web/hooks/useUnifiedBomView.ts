"use client";

import { useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines, type Sprint1Formula, type Sprint1FormulaLine } from "@/services/sprint1/formulaCoreService";
import { fetchInsolubleHgSheets, type InsolubleHgSheet } from "@/services/sprint2/insolubleHgService";
import { fetchSolubleHgSheets, type SolubleHgSheet } from "@/services/sprint2/solubleHgService";
import { fetchMaterialsByCodes } from "@/services/sprint2/materialService";
import { fetchProductionRecords, type ProductionRecord } from "@/services/sprint2/productionRecordService";
import {
  fetchUnifiedBomRows,
  hasLegacyUnifiedBomRows,
  saveUnifiedBomRows,
  type UnifiedBomRow,
} from "@/services/sprint2/unifiedBomRowsService";

// 통합 BOM - 처방 하나를 고르면 ① 완제품→충전품→절단품→코팅품→처방→부자재를 직접 입력하는 통합 BOM 표
// (plm_unified_bom_rows, 이 화면에서 바로 입력/수정/저장 - 예전 "생산 BOM 전개"를 대체)와 ② 참고용
// 읽기 전용 정보(원료 BOM, 필름·원단·칼선)를 한 화면에 모아서 보여준다. ②는 각자의 원래 화면
// (처방관리/생산관리)에서 그대로 입력/수정하고 여기서는 참고만 한다.
//
// 추가 발주되면 같은 처방(같은 Revision)이라도 Lot마다 BOM(특히 부자재)이 달라질 수 있어서, 통합 BOM은
// 처방+Revision뿐 아니라 Lot 단위로도 구분해서 관리한다. Lot 목록은 통합 BOM이 자체적으로 만들지 않고
// "생산실적관리"(plm_production_records)에 이미 등록된 Lot No./EXP를 그대로 가져와서 고르게 한다 -
// 두 화면의 Lot 번호가 항상 일치하게 하기 위함(사용자 확인된 설계). 아직 생산실적이 입력 안 된 Lot은
// 여기서 미리 만들 수 없고, 생산실적관리에 먼저 등록해야 한다.
export function useUnifiedBomView() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<Sprint1Formula[]>([]);
  const [formula, setFormula] = useState<Sprint1Formula | null>(null);
  const [searching, setSearching] = useState(false);

  const [productionLots, setProductionLots] = useState<ProductionRecord[]>([]);
  // 이 컬럼이 생기기 전에 저장된, Lot 지정 없는 기존 자료가 있는지 - 있으면 Lot 선택 목록에
  // "기존 자료(Lot 미지정)" 항목을 추가로 보여줘서 예전에 입력해둔 내용을 잃어버리지 않게 한다.
  const [hasLegacyRows, setHasLegacyRows] = useState(false);
  // undefined = 아직 Lot을 선택하지 않음(선택 화면 표시), null = "기존 자료(Lot 미지정)" 선택,
  // string = 실제 Lot No. 선택.
  const [selectedLot, setSelectedLot] = useState<string | null | undefined>(undefined);

  const [rawLines, setRawLines] = useState<Sprint1FormulaLine[]>([]);
  const [bomRows, setBomRows] = useState<UnifiedBomRow[]>([]);
  const [latestInsoluble, setLatestInsoluble] = useState<InsolubleHgSheet | null>(null);
  const [latestSoluble, setLatestSoluble] = useState<SolubleHgSheet | null>(null);
  const [materialNames, setMaterialNames] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState(false);
  const [lotLoading, setLotLoading] = useState(false);
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
    setSelectedLot(undefined);
    setBomRows([]);
    setLoading(true);
    try {
      const [lines, lots, legacy, insolubleSheets, solubleSheets] = await Promise.all([
        fetchSprint1FormulaLines(f.formula_code, f.revision),
        fetchProductionRecords(f.formula_code, f.revision),
        hasLegacyUnifiedBomRows(f.formula_code, f.revision),
        fetchInsolubleHgSheets(f.formula_code, f.revision),
        fetchSolubleHgSheets(f.formula_code, f.revision),
      ]);
      setRawLines(lines);
      setProductionLots(lots);
      setHasLegacyRows(legacy);
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

  // Lot 선택(또는 "기존 자료(Lot 미지정)" 선택) - 그 Lot에 저장된 통합 BOM 행만 불러온다.
  async function selectLot(lotNo: string | null) {
    if (!formula) return;
    setSelectedLot(lotNo);
    setMessage("");
    setLotLoading(true);
    try {
      setBomRows(await fetchUnifiedBomRows(formula.formula_code, formula.revision, lotNo));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "통합 BOM 조회 오류");
    } finally {
      setLotLoading(false);
    }
  }

  // Lot 선택 화면으로 돌아간다 (다른 Lot의 내용이 화면에 남아있지 않도록 행 목록을 비운다).
  function changeLot() {
    setSelectedLot(undefined);
    setBomRows([]);
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

  // No. 순서를 화살표로 바꾼다 - 화면에 보이는 배열 순서가 곧 저장되는 row_no 순서다
  // (saveUnifiedBomRows가 배열 인덱스 순서 그대로 1,2,3...을 다시 매겨서 저장함).
  function moveBomRowUp(index: number) {
    if (index <= 0) return;
    setBomRows((prev) => {
      const next = prev.slice();
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveBomRowDown(index: number) {
    setBomRows((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = prev.slice();
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function saveBomRows() {
    if (!formula || selectedLot === undefined) return;
    setSaving(true);
    try {
      const saved = await saveUnifiedBomRows(formula.formula_code, formula.revision, selectedLot, bomRows);
      setBomRows(saved);
      // 저장 직후 Lot 목록 쪽 상태도 최신으로 맞춘다 - "기존 자료(Lot 미지정)"였던 경우 저장 후에도
      // 그대로 레거시 상태 유지(행이 남아있으면 hasLegacyRows는 true 그대로).
      if (selectedLot === null) setHasLegacyRows(saved.length > 0);
      setMessage("통합 BOM 저장 완료");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "통합 BOM 저장 오류");
    } finally {
      setSaving(false);
    }
  }

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    productionLots, hasLegacyRows, selectedLot, selectLot, changeLot, lotLoading,
    rawLines, bomRows, addBomRow, updateBomRow, removeBomRow, moveBomRowUp, moveBomRowDown, saveBomRows, saving,
    latestInsoluble, latestSoluble, materialName,
    loading, message,
  };
}
