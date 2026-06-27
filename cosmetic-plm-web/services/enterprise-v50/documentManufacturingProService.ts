"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { V50DocumentType } from "@/types/enterpriseV50DocMfg";

export async function fetchV50DocFormulaOptions() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function createV50SingleDocument(formula: any, documentType: V50DocumentType) {
  const titleMap: Record<V50DocumentType, string> = {
    FORMULA_SHEET: "처방서",
    FULL_INGREDIENT_LIST: "전성분표",
    INGREDIENT_COMPOSITION: "원료조성표",
    PRODUCT_SPEC: "제품규격서",
    COA: "COA",
    BOM: "BOM",
    MANUFACTURING_ORDER: "제조지시서",
  };

  const documentCode = `DOC-${documentType}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("gold_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: documentType,
      title: `${formula.formula_name || formula.formula_code} ${titleMap[documentType]}`,
      status: "GENERATED",
      payload_json: {
        formula,
        document_type: documentType,
        generated_by: "v5.0 Document PRO",
        generated_at: new Date().toISOString(),
      },
      created_by: "R&D",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createV50FullDocumentPackage(formula: any) {
  const types: V50DocumentType[] = [
    "FORMULA_SHEET",
    "FULL_INGREDIENT_LIST",
    "INGREDIENT_COMPOSITION",
    "PRODUCT_SPEC",
    "COA",
    "BOM",
    "MANUFACTURING_ORDER",
  ];

  const created = [];
  for (const type of types) {
    created.push(await createV50SingleDocument(formula, type));
  }
  return created;
}

export async function fetchV50DocumentsByFormula(formulaCode?: string, revision?: string) {
  let query = supabaseProductionFinal
    .from("gold_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (formulaCode && revision) {
    query = query.eq("formula_code", formulaCode).eq("revision", revision);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchV50ManufacturingFormulas() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function createV50BatchFromFormula(formula: any, batchSizeKg: number) {
  const batchNo = `BATCH-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;

  const { data: batch, error: batchError } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .insert({
      batch_no: batchNo,
      formula_code: formula.formula_code,
      revision: formula.revision,
      batch_size_kg: batchSizeKg,
      status: "PLANNED",
      operator_name: "생산팀",
      equipment: "",
      note: "v5.0 제조관리 PRO에서 생성",
    })
    .select()
    .single();

  if (batchError) throw batchError;

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
    percentage: Number(line.percentage || 0),
    required_kg: Number((Number(line.percentage || 0) * batchSizeKg / 100).toFixed(4)),
    checked: false,
  }));

  if (materials.length > 0) {
    const { error } = await supabaseProductionFinal.from("gold_manufacturing_materials").insert(materials);
    if (error) throw error;
  }

  const steps = [
    "원료 계량 확인",
    "Phase A 투입 및 교반",
    "Phase B 가온/용해",
    "유화 또는 혼합",
    "냉각 및 후첨",
    "탈포 및 QC 샘플 채취",
    "충진 전 확인",
    "제조완료",
  ].map((name, idx) => ({
    batch_no: batchNo,
    step_no: idx + 1,
    step_name: name,
    instruction: `${idx + 1}. ${name}을 수행하고 기록하세요.`,
    status: "TODO",
  }));

  const { error: stepError } = await supabaseProductionFinal.from("gold_manufacturing_steps").insert(steps);
  if (stepError) throw stepError;

  return batch;
}

export async function fetchV50BatchesPro() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export async function fetchV50BatchMaterials(batchNo: string) {
  const { data, error } = await supabaseProductionFinal
    .from("gold_manufacturing_materials")
    .select("*")
    .eq("batch_no", batchNo)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateV50BatchStatus(batchNo: string, status: string) {
  const { error } = await supabaseProductionFinal
    .from("gold_manufacturing_batches")
    .update({ status })
    .eq("batch_no", batchNo);

  if (error) throw error;
}
