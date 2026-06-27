"use client";

import { useEffect, useState } from "react";
import { createBatch, fetchBatchDetail, fetchBatches, fetchManufacturingFormulas, updateBatchStatus, updateMaterialChecked, updateStepStatus } from "@/services/enterprise-production-final-series/manufacturingService";
import { createSampleRequest, fetchSamples, updateSampleStatus } from "@/services/enterprise-production-final-series/sampleService";
import { fetchExecutiveKpi, fetchFinalModulesHealth } from "@/services/enterprise-production-final-series/commandCenterService";

export function useManufacturingCenter() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState(100);
  const [message, setMessage] = useState("Manufacturing Center 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [f, b] = await Promise.all([fetchManufacturingFormulas(), fetchBatches()]);
      setFormulas(f); setBatches(b); setMessage("Manufacturing 데이터 조회 완료");
    } catch (e) { setMessage(e instanceof Error ? e.message : "조회 오류"); }
    finally { setLoading(false); }
  }

  async function makeBatch(formula: any) {
    setLoading(true);
    try { await createBatch(formula, batchSize); await load(); setMessage("Batch 생성 완료"); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Batch 생성 오류"); }
    finally { setLoading(false); }
  }

  async function openBatch(batch: any) {
    setSelectedBatch(batch); setLoading(true);
    try { const d = await fetchBatchDetail(batch.batch_no); setMaterials(d.materials); setSteps(d.steps); setMessage(`${batch.batch_no} 상세 조회 완료`); }
    catch (e) { setMessage(e instanceof Error ? e.message : "상세 조회 오류"); }
    finally { setLoading(false); }
  }

  async function changeBatchStatus(status: string) {
    if (!selectedBatch) return;
    await updateBatchStatus(selectedBatch.batch_no, status); await load(); await openBatch({ ...selectedBatch, status });
  }

  async function toggleMaterial(item: any) {
    await updateMaterialChecked(item.id, !item.checked); if (selectedBatch) await openBatch(selectedBatch);
  }

  async function completeStep(step: any) {
    await updateStepStatus(step.id, step.status === "DONE" ? "TODO" : "DONE"); if (selectedBatch) await openBatch(selectedBatch);
  }

  useEffect(() => { load(); }, []);
  return { formulas, batches, selectedBatch, materials, steps, batchSize, setBatchSize, message, loading, load, makeBatch, openBatch, changeBatchStatus, toggleMaterial, completeStep };
}

export function useSampleCenter() {
  const [formulas, setFormulas] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [customer, setCustomer] = useState("Internal");
  const [purpose, setPurpose] = useState("Pilot sample");
  const [message, setMessage] = useState("Sample Center 준비 완료");

  async function load() {
    const [f, s] = await Promise.all([fetchManufacturingFormulas(), fetchSamples()]);
    setFormulas(f); setSamples(s); setMessage("Sample 데이터 조회 완료");
  }

  async function create(formula: any) {
    await createSampleRequest(formula, customer, purpose); await load(); setMessage("Sample Request 생성 완료");
  }

  async function update(sample: any, status: string) {
    await updateSampleStatus(sample.sample_code, status); await load(); setMessage("Sample 상태 변경 완료");
  }

  useEffect(() => { load(); }, []);
  return { formulas, samples, customer, setCustomer, purpose, setPurpose, message, load, create, update };
}

export function useCommandCenter() {
  const [kpi, setKpi] = useState<any | null>(null);
  const [health, setHealth] = useState<any[]>([]);
  const [message, setMessage] = useState("Executive Command Center 준비 완료");

  async function load() {
    try {
      const [k, h] = await Promise.all([fetchExecutiveKpi(), fetchFinalModulesHealth()]);
      setKpi(k); setHealth(h); setMessage("Command Center 조회 완료");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Command Center 오류"); }
  }

  useEffect(() => { load(); }, []);
  return { kpi, health, message, load };
}
