"use client";

import { useEffect, useState } from "react";
import {
  analyzeV60RawImpact,
  buildV60FormulaKnowledgeGraph,
  fetchV60GraphFormulaOptions,
  fetchV60RawOptions,
  findV60SimilarFormulas,
} from "@/services/enterprise-v60/formulaKnowledgeGraphService";

export function useV60FormulaKnowledgeGraph() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [raws, setRaws] = useState<any[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<any | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<any | null>(null);
  const [graph, setGraph] = useState<any | null>(null);
  const [impact, setImpact] = useState<any | null>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [rawKeyword, setRawKeyword] = useState("");
  const [message, setMessage] = useState("Formula Knowledge Graph 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [formulaData, rawData] = await Promise.all([
        fetchV60GraphFormulaOptions(),
        fetchV60RawOptions(""),
      ]);
      setFormulas(formulaData);
      setRaws(rawData);
      setMessage(`처방 ${formulaData.length}건 / 원료 ${rawData.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelectedFormula(formula);
    setLoading(true);
    try {
      const [graphData, similarData] = await Promise.all([
        buildV60FormulaKnowledgeGraph(formula),
        findV60SimilarFormulas(formula),
      ]);
      setGraph(graphData);
      setSimilar(similarData);
      setMessage(`${formula.formula_code} Knowledge Graph 생성 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Graph 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function searchRaw() {
    setLoading(true);
    try {
      const data = await fetchV60RawOptions(rawKeyword);
      setRaws(data);
      setMessage(`원료 ${data.length}건 검색 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 검색 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openRaw(raw: any) {
    setSelectedRaw(raw);
    setLoading(true);
    try {
      const data = await analyzeV60RawImpact(raw);
      setImpact(data);
      setMessage(`${raw.raw_name} 영향도 분석 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "원료 영향도 분석 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return {
    formulas,
    raws,
    selectedFormula,
    selectedRaw,
    graph,
    impact,
    similar,
    rawKeyword,
    setRawKeyword,
    message,
    loading,
    load,
    openFormula,
    searchRaw,
    openRaw,
  };
}
