"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { runSmartFormulaEngine } from "@/services/enterprise-v51/smartFormulaEngineService";
import type { SmartBatchScale } from "@/types/enterpriseV51SmartBridge";

export async function fetchSmartBridgeFormulas() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function createSmartFormulaReport(formula: any) {
  const result = await runSmartFormulaEngine(formula.formula_code, formula.revision);
  const documentCode = `DOC-SMART-REPORT-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("gold_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: "SMART_FORMULA_REPORT",
      title: `${formula.formula_name || formula.formula_code} 스마트 처방 리포트`,
      status: "GENERATED",
      payload_json: {
        formula,
        smart_result: result,
        generated_by: "v5.1 Smart Document Bridge",
        generated_at: new Date().toISOString(),
      },
      created_by: "Smart Formula Engine",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSmartFullDocumentPackage(formula: any) {
  const result = await runSmartFormulaEngine(formula.formula_code, formula.revision);
  const docs = [
    ["SMART_FORMULA_REPORT", "스마트 처방 리포트"],
    ["SMART_INCI_LIST", "스마트 전성분표"],
    ["SMART_COST_REPORT", "스마트 원가 리포트"],
    ["SMART_BATCH_REPORT", "스마트 Batch 소요량표"],
    ["SMART_RISK_REPORT", "스마트 리스크 검토서"],
  ];

  const created = [];
  for (const [type, title] of docs) {
    const documentCode = `DOC-${type}-${Date.now().toString().slice(-6)}-${created.length + 1}`;
    const { data, error } = await supabaseProductionFinal
      .from("gold_documents")
      .insert({
        document_code: documentCode,
        formula_code: formula.formula_code,
        revision: formula.revision,
        document_type: type,
        title: `${formula.formula_name || formula.formula_code} ${title}`,
        status: "GENERATED",
        payload_json: {
          formula,
          smart_result: result,
          generated_by: "v5.1 Smart Document Bridge",
          generated_at: new Date().toISOString(),
        },
        created_by: "Smart Formula Engine",
      })
      .select()
      .single();

    if (error) throw error;
    created.push(data);
  }

  return created;
}

export async function createSmartScaledBatch(formula: any, batchSizeKg: SmartBatchScale | number) {
  const result = await runSmartFormulaEngine(formula.formula_code, formula.revision);
  const batchNo = `SMART-BATCH-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;

  const { data: batch, error: batchError } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .insert({
      batch_no: batchNo,
      formula_code: formula.formula_code,
      revision: formula.revision,
      batch_size_kg: batchSizeKg,
      status: "PLANNED",
      operator_name: "생산팀",
      equipment: "Smart Formula Engine",
      note: `v5.1 Smart Formula Engine 기준 ${batchSizeKg}kg Batch 생성`,
    })
    .select()
    .single();

  if (batchError) throw batchError;

  const materials = result.batch_100kg.map((line, idx) => ({
    batch_no: batchNo,
    line_no: idx + 1,
    phase: "",
    raw_code: line.raw_code,
    raw_name: line.raw_name,
    percentage: line.percentage,
    required_kg: Number((line.percentage * Number(batchSizeKg) / 100).toFixed(4)),
    checked: false,
  }));

  if (materials.length > 0) {
    const { error } = await supabaseProductionFinal.from("gold_manufacturing_materials").insert(materials);
    if (error) throw error;
  }

  const steps = [
    "스마트 계산 결과 확인",
    "원료 소요량 확인",
    "원료 계량",
    "제조 시작",
    "혼합/유화",
    "냉각 및 후첨",
    "QC 샘플 채취",
    "제조 완료",
  ].map((name, idx) => ({
    batch_no: batchNo,
    step_no: idx + 1,
    step_name: name,
    instruction: `${idx + 1}. ${name} 후 기록하세요.`,
    status: "TODO",
  }));

  const { error: stepError } = await supabaseProductionFinal.from("gold_manufacturing_steps").insert(steps);
  if (stepError) throw stepError;

  return { batch, result };
}

export async function fetchSmartBridgeDocuments(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("gold_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (formulaCode && revision) query = query.eq("formula_code", formulaCode).eq("revision", revision);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchSmartBridgeBatches(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (formulaCode && revision) query = query.eq("formula_code", formulaCode).eq("revision", revision);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
