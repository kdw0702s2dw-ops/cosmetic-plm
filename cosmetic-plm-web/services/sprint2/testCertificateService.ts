"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 품질관리 - 반제품/완제품 시험성적서. 사용자가 업로드한 엑셀 양식(반제품 4항목 / 완제품 15항목)의
// 항목 구성(라벨/순서)은 고정하고, 처방(plm_formulas)에서 품목코드/고객사/제품명을 자동으로 가져온다.
// 항목별 시험기준/방법/결과/판정은 발급 시점 값을 items jsonb에 그대로 스냅샷으로 저장한다 - 나중에
// 아래 고정 템플릿(DEFAULT_*_ITEMS)이 바뀌어도 이미 저장된 성적서 내용은 영향받지 않는다.

export const CERTIFICATE_PRODUCT_TYPES = ["반제품", "완제품"] as const;
export type CertificateProductType = (typeof CERTIFICATE_PRODUCT_TYPES)[number];

export type CertSubGroup = {
  spec: string;
  unit?: string;
  results: string[];
  verdict: string;
};

export type CertItem = {
  no: number;
  label: string;
  method: string;
  test_date: string;
  spec?: string;
  unit?: string;
  result?: string;
  verdict?: string;
  subGroups?: CertSubGroup[];
};

export type TestCertificate = {
  id?: string;
  product_type: CertificateProductType;
  doc_no?: string | null;
  formula_id?: string | null;
  formula_code?: string | null;
  revision?: string | null;
  item_code?: string | null;
  lot_no: string;
  customer_product?: string | null;
  test_dept: string;
  overall_verdict: string;
  writer_name?: string | null;
  reviewer_name?: string | null;
  approver_name?: string | null;
  items: CertItem[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 반제품: 성상/향취/pH/내용량(성형품, 총중량+문안용 도포량 2계열 x 3회 측정) - 업로드 양식(5. 반제품 시험성적서) 그대로
export function buildDefaultSemiFinishedItems(): CertItem[] {
  const today = todayStr();
  return [
    { no: 1, label: "성 상", method: "자사규격\n(표준품에 준함)", test_date: today, spec: " 반제품: 백색의 하이드로겔상\n 성형품: 필름사이 메쉬에 코팅된 백색 하이드로겔", result: "" },
    { no: 2, label: "향 취", method: "자사규격\n(표준품에 준함)", test_date: today, spec: " 제품 특이 취", result: "" },
    { no: 3, label: "pH\n(시료 2g + 정제수 30g,\n25±2 ℃, 10분 교반 후 측정)", method: "식약처 고시 내 \n자사규격", test_date: today, spec: " 6.5 ± 1.0", result: "" },
    {
      no: 4,
      label: "내용량\n(성형품)",
      method: "표준품과 비교 \n및 전자저울 측정검사",
      test_date: today,
      subGroups: [
        { spec: " 총중량 : 0.00 g/EA 이상\n (필름, 메쉬 포함, 눈/입 제외)", results: ["", "", ""], verdict: "" },
        { spec: " 문안용 도포량 : 0.00g 이상 (지지체제외)", results: ["", "", ""], verdict: "" },
      ],
    },
  ];
}

// 완제품: 성상/향취/pH/기능성 함량/미생물 4종/중금속 8종/내용량(완제품, 3회 측정) - 업로드 양식(6. 완제품 시험성적서) 그대로
export function buildDefaultFinishedItems(): CertItem[] {
  const today = todayStr();
  const heavyMethod = "유통화장품의 안전관리 기준 시험방법";
  return [
    { no: 1, label: "성 상", method: "자사규격\n(표준품에 준함)", test_date: today, spec: " 필름사이 메쉬에 코팅된 백색 하이드로겔", result: "" },
    { no: 2, label: "향 취", method: "자사규격\n(표준품에 준함)", test_date: today, spec: " 제품 특이 취", result: "" },
    { no: 3, label: "pH\n(시료 2g + 정제수 30g,\n25±2 ℃, 10분 교반 후 측정)", method: "식약처 고시 내 \n자사규격", test_date: today, spec: " 6.5 ± 1.0", result: "" },
    { no: 4, label: "기능성 화장품\n(아데노신)", method: "식약처 개별\n 고시 함량 기준", test_date: today, spec: "표시량의 90% 이상", result: "" },
    { no: 5, label: "미생물", method: heavyMethod, test_date: today, spec: " 총호기성생균수 1,000 cfu/g(mL) 이하", unit: "cfu/g(mL)", result: "" },
    { no: 6, label: "대장균", method: heavyMethod, test_date: today, spec: " 불검출", result: "" },
    { no: 7, label: "녹농균", method: heavyMethod, test_date: today, spec: " 불검출", result: "" },
    { no: 8, label: "황색포도상구균", method: heavyMethod, test_date: today, spec: " 불검출", result: "" },
    { no: 9, label: "납", method: heavyMethod, test_date: today, spec: " 20 ㎍/g 이하", result: "" },
    { no: 10, label: "비소", method: heavyMethod, test_date: today, spec: " 10 ㎍/g 이하", result: "" },
    { no: 11, label: "수은", method: heavyMethod, test_date: today, spec: " 1 ㎍/g 이하", result: "" },
    { no: 12, label: "안티몬", method: heavyMethod, test_date: today, spec: " 10 ㎍/g 이하", result: "" },
    { no: 13, label: "카드뮴", method: heavyMethod, test_date: today, spec: " 5 ㎍/g이하", result: "" },
    { no: 14, label: "니켈", method: heavyMethod, test_date: today, spec: " 10 ㎍/g이하", result: "" },
    {
      no: 15,
      label: "내용량\n(완제품)",
      method: "표준품과 비교 \n및 전자저울 측정검사",
      test_date: today,
      subGroups: [{ spec: " 총중량 : 0.00 g/EA 이상\n (필름, 메쉬 포함, 눈/입 제외 + 파우치 포함)", results: ["", "", ""], verdict: "" }],
    },
  ];
}

export function buildDefaultItems(productType: CertificateProductType): CertItem[] {
  return productType === "반제품" ? buildDefaultSemiFinishedItems() : buildDefaultFinishedItems();
}

export async function fetchCertificateFormulas(keyword = "") {
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

export async function listCertificates(productType?: CertificateProductType, keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_test_certificates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (productType) q = q.eq("product_type", productType);
  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`formula_code.ilike.%${k}%,lot_no.ilike.%${k}%,customer_product.ilike.%${k}%,item_code.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as TestCertificate[];
}

export async function getCertificate(id: string) {
  const { data, error } = await supabaseProductionFinal.from("plm_test_certificates").select("*").eq("id", id).single();
  if (error) throw error;
  return data as TestCertificate;
}

export async function createCertificate(cert: TestCertificate) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_test_certificates")
    .insert({
      product_type: cert.product_type,
      doc_no: cert.doc_no || "",
      formula_id: cert.formula_id || null,
      formula_code: cert.formula_code || null,
      revision: cert.revision || null,
      item_code: cert.item_code || null,
      lot_no: cert.lot_no || "",
      customer_product: cert.customer_product || "",
      test_dept: cert.test_dept || "품질관리부",
      overall_verdict: cert.overall_verdict || "적합",
      writer_name: cert.writer_name || "",
      reviewer_name: cert.reviewer_name || "",
      approver_name: cert.approver_name || "",
      items: cert.items,
      created_by: cert.created_by || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as TestCertificate;
}

export async function updateCertificate(id: string, patch: Partial<TestCertificate>) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_test_certificates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as TestCertificate;
}

export async function deleteCertificate(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_test_certificates").delete().eq("id", id);
  if (error) throw error;
}
