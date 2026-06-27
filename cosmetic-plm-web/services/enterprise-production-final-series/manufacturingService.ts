"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { ManufacturingBatch } from "@/types/enterpriseProductionFinal";

export async function fetchManufacturingFormulas() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function fetchBatches() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createBatch(formula: any, batchSizeKg: number) {
  const batchNo = `BATCH-${new Date().toISOString().slice(2,10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const batch: ManufacturingBatch = {
    batch_no: batchNo,
    formula_code: formula.formula_code,
    revision: formula.revision,
    batch_size_kg: batchSizeKg,
    status: "PLANNED",
    operator_name: "Production",
    equipment: "",
    note: "Created from GOLD MASTER formula",
  };

  const { data, error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .insert(batch)
    .select()
    .single();
  if (error) throw error;

  const { data: lines, error: lineError } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formula.formula_code)
    .eq("revision", formula.revision)
    .order("line_no", { ascending: true });
  if (lineError) throw lineError;

  const materials = (lines || []).map((line: any) => ({
    batch_no: batchNo,
    line_no: line.line_no,
    phase: line.phase,
    raw_code: line.raw_code,
    raw_name: line.raw_name,
    percentage: line.percentage,
    required_kg: Number((Number(line.percentage || 0) * batchSizeKg / 100).toFixed(4)),
    checked: false,
  }));

  if (materials.length > 0) {
    const { error: matError } = await supabaseProductionFinal.from("gold_manufacturing_materials").insert(materials);
    if (matError) throw matError;
  }

  const steps = [
    "원료 계량 및 확인",
    "Phase A 투입 및 교반",
    "Phase B 가온/용해",
    "유화 또는 혼합",
    "냉각 및 후첨",
    "탈포 및 충진",
    "QC 샘플 채취",
    "제조완료 확인",
  ].map((step, idx) => ({
    batch_no: batchNo,
    step_no: idx + 1,
    step_name: step,
    instruction: `${idx + 1}. ${step}을 수행하고 기록하세요.`,
    status: "TODO",
  }));

  const { error: stepError } = await supabaseProductionFinal.from("gold_manufacturing_steps").insert(steps);
  if (stepError) throw stepError;

  return data;
}

export async function fetchBatchDetail(batchNo: string) {
  const [materials, steps] = await Promise.all([
    supabaseProductionFinal.from("gold_manufacturing_materials").select("*").eq("batch_no", batchNo).order("line_no", { ascending: true }),
    supabaseProductionFinal.from("gold_manufacturing_steps").select("*").eq("batch_no", batchNo).order("step_no", { ascending: true }),
  ]);
  if (materials.error) throw materials.error;
  if (steps.error) throw steps.error;
  return { materials: materials.data || [], steps: steps.data || [] };
}

export async function updateBatchStatus(batchNo: string, status: string) {
  const { error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .update({ status })
    .eq("batch_no", batchNo);
  if (error) throw error;
}

export async function updateMaterialChecked(id: string, checked: boolean) {
  const { error } = await supabaseProductionFinal.from("gold_manufacturing_materials").update({ checked }).eq("id", id);
  if (error) throw error;
}

export async function updateStepStatus(id: string, status: string) {
  const { error } = await supabaseProductionFinal.from("gold_manufacturing_steps").update({ status }).eq("id", id);
  if (error) throw error;
}
