"use client";

import { useEffect, useState } from "react";
import {
  createV50BatchFromFormula,
  createV50FullDocumentPackage,
  createV50SingleDocument,
  fetchV50BatchMaterials,
  fetchV50BatchesPro,
  fetchV50DocFormulaOptions,
  fetchV50DocumentsByFormula,
  fetchV50ManufacturingFormulas,
  updateV50BatchStatus,
} from "@/services/enterprise-v50/documentManufacturingProService";
import type { V50DocumentType } from "@/types/enterpriseV50DocMfg";

export function useV50DocumentPro() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [message, setMessage] = useState("문서관리 PRO 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const f = await fetchV50DocFormulaOptions();
      setFormulas(f);
      setDocuments(await fetchV50DocumentsByFormula());
      setMessage(`처방 ${f.length}건 / 문서 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "문서 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function selectFormula(formula: any) {
    setSelected(formula);
    setDocuments(await fetchV50DocumentsByFormula(formula.formula_code, formula.revision));
    setMessage(`${formula.formula_code} 문서 조회 완료`);
  }

  async function createDoc(type: V50DocumentType) {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    await createV50SingleDocument(selected, type);
    await selectFormula(selected);
    setMessage(`${type} 문서 생성 완료`);
  }

  async function createPackage() {
    if (!selected) {
      setMessage("먼저 처방을 선택하세요.");
      return;
    }
    await createV50FullDocumentPackage(selected);
    await selectFormula(selected);
    setMessage("전체 문서 패키지 생성 완료");
  }

  useEffect(() => { load(); }, []);

  return { formulas, selected, documents, message, loading, load, selectFormula, createDoc, createPackage };
}

export function useV50ManufacturingPro() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState(100);
  const [message, setMessage] = useState("제조관리 PRO 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [f, b] = await Promise.all([fetchV50ManufacturingFormulas(), fetchV50BatchesPro()]);
      setFormulas(f);
      setBatches(b);
      setMessage(`처방 ${f.length}건 / Batch ${b.length}건 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "제조 데이터 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function createBatch(formula: any) {
    await createV50BatchFromFormula(formula, batchSize);
    await load();
    setMessage("Batch 생성 완료");
  }

  async function openBatch(batch: any) {
    setSelectedBatch(batch);
    setMaterials(await fetchV50BatchMaterials(batch.batch_no));
    setMessage(`${batch.batch_no} 원료소요량 조회 완료`);
  }

  async function changeStatus(status: string) {
    if (!selectedBatch) return;
    await updateV50BatchStatus(selectedBatch.batch_no, status);
    await load();
    await openBatch({ ...selectedBatch, status });
    setMessage(`Batch 상태 변경 완료: ${status}`);
  }

  useEffect(() => { load(); }, []);

  return { formulas, batches, selectedBatch, materials, batchSize, setBatchSize, message, loading, load, createBatch, openBatch, changeStatus };
}
