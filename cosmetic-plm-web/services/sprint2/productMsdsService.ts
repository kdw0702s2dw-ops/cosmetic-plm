"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

// 품질관리 - 제품 MSDS(Material Safety Data Sheet). 업로드된 영문 MSDS 양식(제품 MSDS 양식.docx)의
// 16개 섹션(Identification ~ Other Information) 구성을 그대로 따른다. 1번(Identification)은 문서
// 상단 고정 필드로 두고, 2~16번은 "섹션(제목 + 라벨:값 표 + 앞/뒤 설명문)"의 일반화된 배열로 다뤄서
// 화학물질이 아닌 다른 화장품으로도 값만 바꿔 재사용할 수 있게 한다. 결재는 제품 COA와 동일하게
// Approved By 단일 단계이며, 확정 시 담당자의 실제 서명 이미지가 문서에 삽입된다.

export type MsdsRow = { label: string; value: string };
export type MsdsSection = {
  no: number;
  title: string;
  introNote?: string;
  rows: MsdsRow[];
  outroNote?: string;
};

export const MSDS_WORKFLOW_STATUSES = ["draft", "approved"] as const;
export type MsdsWorkflowStatus = (typeof MSDS_WORKFLOW_STATUSES)[number];

export type ProductMsds = {
  id?: string;
  doc_no?: string | null;
  formula_id?: string | null;
  formula_code?: string | null;
  revision?: string | null;
  product_name?: string | null;
  product_code?: string | null;
  product_type?: string | null;
  manufacturer?: string | null;
  address?: string | null;
  tel_emergency?: string | null;
  sections: MsdsSection[];
  issue_date?: string | null;
  approver_name?: string | null;
  workflow_status?: MsdsWorkflowStatus;
  approver_confirmed_at?: string | null;
  approver_confirmed_by?: string | null;
  approver_confirmed_by_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_MANUFACTURER = "Nutriadvisor Co., Ltd.";
const DEFAULT_ADDRESS = "#402, Samsung Technopark, 97, Jungbu-daero 448beon-gil, Yeongtong-gu, Suwon-si, Gyeonggi-do, 16690, Republic of Korea";
const DEFAULT_TEL = "+82-70-7018-0050";
const DEFAULT_PRODUCT_TYPE = "Cosmetic – Skin Care Face Mask (Finished Product)";
const DEFAULT_REVISION = "01";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 헅로드 양식(제품 MSDS 양식.docx)의 2~16번 섹션을 그대로 옮긴 기본값. Product Information(1번)은
// 문서 상단 고정 필드로 별도 관리하므로 여기 포함하지 않는다.
export function buildDefaultMsdsSections(): MsdsSection[] {
  return [
    {
      no: 2,
      title: "HAZARD IDENTIFICATION",
      rows: [
        { label: "GHS Classification", value: "Not classified as hazardous" },
        { label: "Signal Word", value: "None" },
        { label: "Hazard Statements", value: "None" },
        { label: "Precautionary Statements", value: "For external use only. Keep out of reach of children. Avoid eye contact." },
        { label: "Other Hazards", value: "None known" },
      ],
    },
    {
      no: 3,
      title: "COMPOSITION / INFORMATION ON INGREDIENTS",
      introNote: "This product is a cosmetic finished product (mixture). All ingredients comply with applicable cosmetic regulations.",
      rows: [{ label: "", value: "[확정코드 전성분 영문 기입]" }],
      outroNote: "No ingredients are present at concentrations that trigger hazard classification under GHS.",
    },
    {
      no: 4,
      title: "FIRST AID MEASURES",
      rows: [
        { label: "Eye Contact", value: "Rinse immediately with plenty of water for at least 15 minutes. Seek medical attention if irritation persists." },
        { label: "Skin Contact", value: "Rinse with soap and water. Discontinue use if rash or irritation occurs. Seek medical advice if symptoms persist." },
        { label: "Ingestion", value: "Not intended for consumption. Rinse mouth with water. Seek medical attention. Do not induce vomiting." },
        { label: "Inhalation", value: "Not a likely route of exposure. Move to fresh air if needed." },
      ],
    },
    {
      no: 5,
      title: "FIRE FIGHTING MEASURES",
      rows: [
        { label: "Suitable Extinguishing Media", value: "Dry powder, CO₂, foam, or water spray" },
        { label: "Special Hazards", value: "High water content; low flammability. Combustion may produce CO and CO₂." },
        { label: "PPE for Firefighters", value: "Wear self-contained breathing apparatus (SCBA) and full protective clothing." },
      ],
    },
    {
      no: 6,
      title: "ACCIDENTAL RELEASE MEASURES",
      rows: [
        { label: "Personal Precautions", value: "No special measures required for minor spills." },
        { label: "Environmental Precautions", value: "Prevent large quantities from entering drains or waterways." },
        { label: "Clean-up Method", value: "Collect with absorbent material (paper towels, etc.) and dispose in general waste." },
      ],
    },
    {
      no: 7,
      title: "HANDLING AND STORAGE",
      rows: [
        { label: "Handling", value: "For external use only. Avoid eye contact. Do not apply to broken or irritated skin. Keep out of reach of children." },
        { label: "Storage Temperature", value: "1°C ~ 30°C. Avoid freezing and direct sunlight." },
        { label: "Storage Conditions", value: "Store in a cool, dry, well-ventilated area. Keep container tightly closed." },
        { label: "Shelf Life", value: "Refer to product label. Do not use after expiry date." },
        { label: "After Use", value: "Discard used mask in general waste. Do not flush." },
      ],
    },
    {
      no: 8,
      title: "EXPOSURE CONTROLS / PERSONAL PROTECTION",
      rows: [
        { label: "Occupational Exposure Limits", value: "None established for this cosmetic finished product." },
        { label: "Hand Protection", value: "Not required for normal use." },
        { label: "Eye Protection", value: "Not required for normal use." },
        { label: "Respiratory Protection", value: "Not required under normal use conditions." },
        { label: "Hygiene", value: "Wash hands before and after use." },
      ],
    },
    {
      no: 9,
      title: "PHYSICAL AND CHEMICAL PROPERTIES",
      rows: [
        { label: "Appearance", value: "White hydrogel mask pack" },
        { label: "Odor", value: "Product Characteristic Odor" },
        { label: "pH", value: "5.7 ~ 7.7" },
        { label: "Flammability", value: "Not flammable under normal conditions" },
        { label: "Solubility", value: "Water-based; miscible with water" },
      ],
    },
    {
      no: 10,
      title: "STABILITY AND REACTIVITY",
      rows: [
        { label: "Stability", value: "Stable under recommended storage conditions." },
        { label: "Conditions to Avoid", value: "Extreme temperatures, direct sunlight, freezing." },
        { label: "Incompatible Materials", value: "Strong oxidizing agents, strong acids or bases." },
        { label: "Hazardous Decomposition", value: "None under normal conditions." },
      ],
    },
    {
      no: 11,
      title: "TOXICOLOGICAL INFORMATION",
      rows: [
        { label: "Acute Toxicity", value: "Not classified. All ingredients are cosmetic-grade." },
        { label: "Skin Irritation", value: "Not classified as irritating." },
        { label: "Eye Irritation", value: "Not classified. Avoid direct eye contact." },
        { label: "Sensitization", value: "Not classified. Patch test recommended for sensitive skin." },
        { label: "Other", value: "No carcinogenic, mutagenic, or reproductive toxicity concerns identified." },
      ],
    },
    {
      no: 12,
      title: "ECOLOGICAL INFORMATION",
      rows: [
        { label: "Aquatic Toxicity", value: "Not classified as hazardous to aquatic organisms." },
        { label: "Biodegradability", value: "Primary components (water, glycerin) are expected to be biodegradable." },
        { label: "Bioaccumulation", value: "Not expected." },
        { label: "Other", value: "No significant environmental impact expected under normal use." },
      ],
    },
    {
      no: 13,
      title: "DISPOSAL CONSIDERATIONS",
      rows: [
        { label: "Product", value: "Dispose of used mask in general household waste in accordance with local regulations." },
        { label: "Packaging", value: "Recycle where facilities exist." },
        { label: "Note", value: "Do not flush into drains or waterways." },
      ],
    },
    {
      no: 14,
      title: "TRANSPORT INFORMATION",
      rows: [
        { label: "UN Number", value: "Not regulated" },
        { label: "Hazard Class", value: "Not classified as dangerous goods" },
        { label: "ADR / IMDG / IATA", value: "Not subject to transport regulations for hazardous goods" },
        { label: "Special Precautions", value: "Protect from freezing and extreme temperatures during transport." },
      ],
    },
    {
      no: 15,
      title: "REGULATORY INFORMATION",
      rows: [
        { label: "Product Classification", value: "Cosmetic Product (Finished Product)" },
        { label: "Australia", value: "Subject to applicable AICIS requirements and the Consumer Goods (Cosmetics) Information Standard 2020." },
        { label: "Korea", value: "Complies with the Cosmetics Act of the Republic of Korea" },
        { label: "EU", value: "Complies with Regulation (EC) No 1223/2009 on cosmetic products" },
        { label: "Prohibited Substances", value: "No prohibited or restricted substances present above permitted limits" },
        { label: "Special Labelling", value: "No hazard labelling required. Standard cosmetic labelling applies." },
      ],
    },
    {
      no: 16,
      title: "OTHER INFORMATION",
      rows: [
        { label: "Prepared By", value: "Nutriadvisor Co., Ltd. – Quality Assurance" },
        { label: "Disclaimer", value: "This MSDS is provided for informational purposes. Information is based on current knowledge and applicable cosmetic regulations." },
      ],
    },
  ];
}

export function buildDefaultMsds(): Pick<ProductMsds, "manufacturer" | "address" | "tel_emergency" | "product_type" | "revision" | "sections"> {
  return {
    manufacturer: DEFAULT_MANUFACTURER,
    address: DEFAULT_ADDRESS,
    tel_emergency: DEFAULT_TEL,
    product_type: DEFAULT_PRODUCT_TYPE,
    revision: DEFAULT_REVISION,
    sections: buildDefaultMsdsSections(),
  };
}

export async function fetchMsdsFormulas(keyword = "") {
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

export async function listProductMsds(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_product_msds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`product_name.ilike.%${k}%,product_code.ilike.%${k}%,formula_code.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as ProductMsds[];
}

export async function getProductMsds(id: string) {
  const { data, error } = await supabaseProductionFinal.from("plm_product_msds").select("*").eq("id", id).single();
  if (error) throw error;
  return data as ProductMsds;
}

export async function createProductMsds(msds: ProductMsds) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_msds")
    .insert({
      doc_no: msds.doc_no || "",
      formula_id: msds.formula_id || null,
      formula_code: msds.formula_code || null,
      revision: msds.revision || DEFAULT_REVISION,
      product_name: msds.product_name || "",
      product_code: msds.product_code || "",
      product_type: msds.product_type || DEFAULT_PRODUCT_TYPE,
      manufacturer: msds.manufacturer || DEFAULT_MANUFACTURER,
      address: msds.address || DEFAULT_ADDRESS,
      tel_emergency: msds.tel_emergency || DEFAULT_TEL,
      sections: msds.sections,
      issue_date: msds.issue_date || "",
      approver_name: msds.approver_name || "",
      created_by: msds.created_by || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductMsds;
}

export async function updateProductMsds(id: string, patch: Partial<ProductMsds>) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_product_msds")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ProductMsds;
}

export async function deleteProductMsds(id: string) {
  const { error } = await supabaseProductionFinal.from("plm_product_msds").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// 결재 워크플로우: 제품 COA와 동일하게 Approved By 단일 단계.
// ============================================================

export async function confirmMsdsApproverStage(msds: ProductMsds, actorName: string, actorId: string | null) {
  if (!msds.id) throw new Error("먼저 저장한 뒤 확정할 수 있습니다.");
  return updateProductMsds(msds.id, {
    approver_confirmed_at: new Date().toISOString(),
    approver_confirmed_by: actorName,
    approver_confirmed_by_id: actorId,
    workflow_status: "approved",
  });
}

export { todayStr as msdsToday };
