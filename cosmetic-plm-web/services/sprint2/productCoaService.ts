"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 품질관리 - 제품 COA(Certificate of Analysis). 업로드된 영문 COA 양식(제품 COA 양식.docx)의 구성
// (Product Information / Test Results / Conclusion / 결재란)을 그대로 따르며, 시험성적서와 동일한
// 작성 -> 검토 -> 승인 결재 워크플로우를 사용한다. 다른 점은 결재 확정 시 담당자의 실제 서명 이미지
// (plm_signatures, 사용자가 내 계정에서 등록)가 문서에 삽입된다는 것 - 이를 위해 확정자의 user id도
// 함께 기록한다(writer_confirmed_by_id 등).

export type CoaItem = {
  no: number;
  test_item: string;
  test_standard: string;
  test_method: string;
  test_date: string;
  result?: string;
};

export const COA_WORKFLOW_STATUSES = ["draft", "pending_review", "pending_approval", "approved"] as const;
export type CoaWorkflowStatus = (typeof COA_WORKFLOW_STATUSES)[number];

export type ProductCoa = {
  id?: string;
  doc_no?: string | null;
  formula_id?: string | null;
  formula_code?: string | null;
  revision?: string | null;
  product_name?: string | null;
  manufacturer?: string | null;
  address?: string | null;
  product_code?: string | null;
  batch_no?: string | null;
  product_category?: string | null;
  test_date_from?: string | null;
  test_date_to?: string | null;
  conclusion?: string | null;
  items: CoaItem[];
  writer_name?: string | null;
  reviewer_name?: string | null;
  approver_name?: string | null;
  workflow_status?: CoaWorkflowStatus;
  writer_confirmed_at?: string | null;
  writer_confirmed_by?: string | null;
  writer_confirmed_by_id?: string | null;
  reviewer_confirmed_at?: string | null;
  reviewer_confirmed_by?: string | null;
  reviewer_confirmed_by_id?: string | null;
  approver_confirmed_at?: string | null;
  approver_confirmed_by?: string | null;
  approver_confirmed_by_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_MANUFACTURER = "Nutriadvisor Co., Ltd.";
const DEFAULT_ADDRESS = "#402, Samsung Technopark, 97, Jungbu-daero 448beon-gil, Yeongtong-gu, Suwon-si, Gyeonggi-do, 16690, Republic of Korea";
const DEFAULT_CONCLUSION = "The test results of [Product Name] comply with all specified test standards and quality requirements. The product is suitable for commercialization and meets cosmetic regulations.";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 업로드 양식(제품 COA 양식.docx)의 Test Results 8개 항목 - 결과값은 발급 시점에 입력.
export function buildDefaultCoaItems(): CoaItem[] {
  const today = todayStr();
  return [
    { no: 1, test_item: "Appearance", test_standard: "White hydrogel mask pack", test_method: "Organoleptic Test", test_date: today, result: "" },
    { no: 2, test_item: "Odor", test_standard: "Product Characteristic Odor", test_method: "Organoleptic Test", test_date: today, result: "" },
    { no: 3, test_item: "pH", test_standard: "6.7 ± 1.0", test_method: "MFDS Method", test_date: today, result: "" },
    { no: 4, test_item: "Weight", test_standard: "32g ± 10% / ea", test_method: "Company Standard", test_date: today, result: "" },
    { no: 5, test_item: "TAMC", test_standard: "≤ 100 CFU/g", test_method: "MFDS Method", test_date: today, result: "" },
    { no: 6, test_item: "Escherichia coli", test_standard: "Not Detected", test_method: "MFDS Method", test_date: today, result: "" },
    { no: 7, test_item: "Pseudomonas aeruginosa", test_standard: "Not Detected", test_method: "MFDS Method", test_date: today, result: "" },
    { no: 8, test_item: "Staphylococcus aureus", test_standard: "Not Detected", test_method: "MFDS Method", test_date: today, result: "" },
  ];
}

export function buildDefaultCoa(): Pick<ProductCoa, "manufacturer" | "address" | "conclusion" | "test_date_from" | "test_date_to" | "items"> {
  const today = todayStr();
  return {
    manufacturer: DEFAULT_MANUFACTURER,
    address: DEFAULT_ADDRESS,
    conclusion: DEFAULT_CONCLUSION,
    test_date_from: today,
    test_date_to: today,
    items: buildDefaultCoaItems(),
  };
}

export async function fetchCoaFormulas(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function listProductCoa(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_product_coa")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`product_name.ilike.%${k}%,product_code.ilike.%${k}%,batch_no.ilike.%${k}%,formula_code.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ProductCoa[];
}

export async function getProductCoa(id: string) {
  const { data, error } = await supabaseProductionFinal.from("plm_product_coa").select("*").eq("id", id).single();
  if (error) throw error;
  return data as ProductCoa;
}

export async function createProductCoa(coa: ProductCoa) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_coa")
    .insert({
      doc_no: coa.doc_no || "",
      formula_id: coa.formula_id || null,
      formula_code: coa.formula_code || null,
      revision: coa.revision || null,
      product_name: coa.product_name || "",
      manufacturer: coa.manufacturer || DEFAULT_MANUFACTURER,
      address: coa.address || DEFAULT_ADDRESS,
      product_code: coa.product_code || "",
      batch_no: coa.batch_no || "",
      product_category: coa.product_category || "",
      test_date_from: coa.test_date_from || "",
      test_date_to: coa.test_date_to || "",
      conclusion: coa.conclusion || "",
      items: coa.items,
      writer_name: coa.writer_name || "",
      reviewer_name: coa.reviewer_name || "",
      approver_name: coa.approver_name || "",
      created_by: coa.created_by || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductCoa;
}

export async function updateProductCoa(id: string, patch: Partial<ProductCoa>) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_coa")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductCoa;
}

export async function deleteProductCoa(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_product_coa").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// 결재 워크플로우: 작성 -> (검토자 지정 시) 검토 -> 승인. 확정한 사람의 user id를 함께 기록해두면
// 문서를 그릴 때 plm_signatures에서 그 사람의 서명 이미지를 찾아 삽입할 수 있다.
// ============================================================

export async function confirmCoaWriterStage(coa: ProductCoa, actorName: string, actorId: string | null) {
  if (!coa.id) throw new Error("먼저 저장한 뒤 확정할 수 있습니다.");
  const hasReviewer = !!(coa.reviewer_name && coa.reviewer_name.trim());
  return updateProductCoa(coa.id, {
    writer_confirmed_at: new Date().toISOString(),
    writer_confirmed_by: actorName,
    writer_confirmed_by_id: actorId,
    workflow_status: hasReviewer ? "pending_review" : "pending_approval",
  });
}

export async function confirmCoaReviewerStage(coa: ProductCoa, actorName: string, actorId: string | null) {
  if (!coa.id) throw new Error("먼저 저장한 뒤 확정할 수 있습니다.");
  return updateProductCoa(coa.id, {
    reviewer_confirmed_at: new Date().toISOString(),
    reviewer_confirmed_by: actorName,
    reviewer_confirmed_by_id: actorId,
    workflow_status: "pending_approval",
  });
}

export async function confirmCoaApproverStage(coa: ProductCoa, actorName: string, actorId: string | null) {
  if (!coa.id) throw new Error("먼저 저장한 뒤 확정할 수 있습니다.");
  return updateProductCoa(coa.id, {
    approver_confirmed_at: new Date().toISOString(),
    approver_confirmed_by: actorName,
    approver_confirmed_by_id: actorId,
    workflow_status: "approved",
  });
}
