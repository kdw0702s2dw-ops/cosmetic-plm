"use client";

import { useState } from "react";
import { searchProductionFormulas } from "@/services/sprint2/productionQtyService";
import { fetchSprint1FormulaLines, fetchProductionBomRows, type ProductionBomRow, type Sprint1Formula, type Sprint1FormulaLine } from "@/services/sprint1/formulaCoreService";
import { fetchInsolubleHgSheets, type InsolubleHgSheet } from "@/services/sprint2/insolubleHgService";
import { fetchSolubleHgSheets, type SolubleHgSheet } from "@/services/sprint2/solubleHgService";
import { fetchMaterialsByCodes } from "@/services/sprint2/materialService";

// 통합 BOM(조회 전용, 1단계) - 처방 하나를 고르면 이미 여러 화면에 흩어져 있는 BOM 정보를
// 한 화면에 모아서 보여준다: 원료 BOM(plm_formula_lines, 처방관리), 부자재 생산 BOM 전개
// (plm_production_bom, 처방관리의 "생산 BOM 전개" 섹션), 그리고 연구_불용성/수용성 HG
// 계산서(각각 가장 최근 저장분 1건)에 들어있는 필름/원단/칼선 값. 새 테이블 없이 기존 4곳의
// 데이터를 읽기만 하는 조회 전용 화면이라 쓰기는 각자의 원래 화면(처방관리/생산관리)에서 한다.
export function useUnifiedBomView() {
  const [keyword, setKeyword] = useState("");
  const [formulas, setFormulas] = useState<Sprint1Formula[]>([]);
  const [formula, setFormula] = useState<Sprint1Formula | null>(null);
  const [searching, setSearching] = useState(false);

  const [rawLines, setRawLines] = useState<Sprint1FormulaLine[]>([]);
  const [productionBomRows, setProductionBomRows] = useState<ProductionBomRow[]>([]);
  const [latestInsoluble, setLatestInsoluble] = useState<InsolubleHgSheet | null>(null);
  const [latestSoluble, setLatestSoluble] = useState<SolubleHgSheet | null>(null);
  const [materialNames, setMaterialNames] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState(false);
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
      const [lines, bomRows, insolubleSheets, solubleSheets] = await Promise.all([
        fetchSprint1FormulaLines(f.formula_code, f.revision),
        fetchProductionBomRows(f.formula_code, f.revision),
        fetchInsolubleHgSheets(f.formula_code, f.revision),
        fetchSolubleHgSheets(f.formula_code, f.revision),
      ]);
      setRawLines(lines);
      setProductionBomRows(bomRows);
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

  return {
    keyword, setKeyword, formulas, formula, searching, search, selectFormula,
    rawLines, productionBomRows, latestInsoluble, latestSoluble, materialName,
    loading, message,
  };
}
