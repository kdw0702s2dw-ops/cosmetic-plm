"use client";

import { useEffect, useState } from "react";
import {
  createSmartFormulaReport,
  createSmartFullDocumentPackage,
  createSmartScaledBatch,
  fetchSmartBridgeBatches,
  fetchSmartBridgeDocuments,
  fetchSmartBridgeFormulas,
} from "@/services/enterprise-v51/smartDocumentBatchBridgeService";

export function useV51SmartDocumentBatchBridge() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState(100);
  const [message, setMessage] = useState("Smart Document & Batch Bridge 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const f = await fetchSmartBridgeFormulas();
      setFormulas(f);
      setDocuments(await fetchSmartBridgeDocuments());
      setBatches(await fetchSmartBridgeBatches());
      setMessage(`처방 ${f.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function openFormula(formula: any) {
    setSelected(formula);
    setLoading(true);
    try {
      const [d, b] = await Promise.all([
        fetchSmartBridgeDocuments(formula.formula_code, formula.revision),
        fetchSmartBridgeBatches(formula.formula_code, formula.revision),
      ]);
      setDocuments(d);
      setBatches(b);
      setMessage(`${formula.formula_code} 문서/Batch 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처방 상세 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createReport() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      await createSmartFormulaReport(selected);
      await openFormula(selected);
      setMessage("스마트 처방 리포트 생성 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "리포트 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createPackage() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      await createSmartFullDocumentPackage(selected);
      await openFormula(selected);
      setMessage("스마트 문서 패키지 생성 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 패키지 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createBatch() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      await createSmartScaledBatch(selected, batchSize);
      await openFormula(selected);
      setMessage(`${batchSize}kg Smart Batch 생성 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return {
    formulas,
    selected,
    documents,
    batches,
    batchSize,
    setBatchSize,
    message,
    loading,
    load,
    openFormula,
    createReport,
    createPackage,
    createBatch,
  };
}
