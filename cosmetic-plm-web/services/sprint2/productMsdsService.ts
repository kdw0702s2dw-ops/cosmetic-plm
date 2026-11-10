"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import {
  complexRows,
  type DocBasis,
  fetchFormulaLinesForPdf,
  mergeRows,
  resolveLinesForBasis,
  singleRows,
} from "@/services/sprint2/documentPdfService";

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
export type MsdsLanguage = "en" | "ko";

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
  language?: MsdsLanguage;
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
const DEFAULT_MANUFACTURER_KO = "주식회사 뉴트리어드바이저";
const DEFAULT_ADDRESS_KO = "경기도 수원시 영통구 중부대로448번길 97, 삼성테크노파크 402호";
const DEFAULT_PRODUCT_TYPE_KO = "화장품 – 스킨케어 마스크팩 (완제품)";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 업로드 양식(제품 MSDS 양식.docx)의 2~16번 섹션을 그대로 옮긴 기본값. Product Information(1번)은
// 문서 상단 고정 필드로 별도 관리하므로 여기 포함하지 않는다.
export function buildDefaultMsdsSections(lang: MsdsLanguage = "en"): MsdsSection[] {
  if (lang === "ko") {
    return [
    {
      no: 2,
      title: "유해성·위험성",
      rows: [
        { label: "GHS 분류", value: "유해물질로 분류되지 않음" },
        { label: "신호어", value: "없음" },
        { label: "유해·위험문구", value: "없음" },
        { label: "예방조치문구", value: "외용으로만 사용. 어린이의 손이 닿지 않는 곳에 보관. 눈 접촉을 피함." },
        { label: "기타 유해성", value: "알려진 바 없음" },
      ],
    },
    {
      no: 3,
      title: "구성성분의 명칭 및 함유량",
      introNote: "본 제품은 화장품 완제품(혼합물)입니다. 모든 성분은 관련 화장품 법규를 준수합니다.",
      rows: [{ label: "", value: "[확정코드 전성분 국문 기입]" }],
      outroNote: "GHS 기준 유해성 분류를 유발하는 농도로 존재하는 성분은 없습니다.",
    },
    {
      no: 4,
      title: "응급조치요령",
      rows: [
        { label: "눈에 들어갔을 때", value: "즉시 충분한 물로 최소 15분간 씻어낸다. 자극이 계속되면 의사의 진료를 받는다." },
        { label: "피부에 접촉했을 때", value: "비누와 물로 씻어낸다. 발진이나 자극이 발생하면 사용을 중단한다. 증상이 계속되면 의사와 상담한다." },
        { label: "먹었을 때", value: "섭취를 목적으로 한 제품이 아님. 입을 물로 헹군다. 의사의 진료를 받는다. 구토를 유도하지 않는다." },
        { label: "흡입했을 때", value: "노출될 가능성이 낮은 경로임. 필요 시 신선한 공기가 있는 곳으로 옮긴다." },
      ],
    },
    {
      no: 5,
      title: "폭발·화재시 대처방법",
      rows: [
        { label: "적절한 소화제", value: "분말소화제, CO₂, 폼, 또는 물분무" },
        { label: "특별한 유해성", value: "수분 함량이 높아 가연성이 낮음. 연소 시 CO 및 CO₂가 발생할 수 있음." },
        { label: "화재진압 시 개인보호장비", value: "공기호흡기(SCBA) 및 전신 보호복을 착용한다." },
      ],
    },
    {
      no: 6,
      title: "누출사고시 대처방법",
      rows: [
        { label: "인체 노출 방지", value: "소량 누출 시 특별한 조치가 필요하지 않음." },
        { label: "환경 노출 방지", value: "대량 누출 시 하수구나 수로로 유입되지 않도록 한다." },
        { label: "정화 방법", value: "흡수성 물질(종이타월 등)로 수거하여 일반 폐기물로 처리한다." },
      ],
    },
    {
      no: 7,
      title: "취급 및 저장방법",
      rows: [
        { label: "취급", value: "외용으로만 사용. 눈 접촉을 피함. 상처가 있거나 자극받은 피부에는 사용하지 않음. 어린이의 손이 닿지 않는 곳에 보관." },
        { label: "보관 온도", value: "1°C ~ 30°C. 동결 및 직사광선을 피한다." },
        { label: "보관 조건", value: "서늘하고 건조하며 통풍이 잘 되는 곳에 보관. 용기를 밀폐하여 보관." },
        { label: "사용기한", value: "제품 표기 참조. 사용기한 이후에는 사용하지 않는다." },
        { label: "사용 후", value: "사용한 마스크는 일반 폐기물로 버린다. 하수구에 버리지 않는다." },
      ],
    },
    {
      no: 8,
      title: "노출방지 및 개인보호구",
      rows: [
        { label: "노출기준", value: "본 화장품 완제품에 대해 설정된 바 없음." },
        { label: "손 보호", value: "정상 사용 시 필요하지 않음." },
        { label: "눈 보호", value: "정상 사용 시 필요하지 않음." },
        { label: "호흡기 보호", value: "정상 사용 조건에서 필요하지 않음." },
        { label: "위생관리", value: "사용 전후 손을 씻는다." },
      ],
    },
    {
      no: 9,
      title: "물리화학적 특성",
      rows: [
        { label: "외관", value: "백색 하이드로겔 마스크팩" },
        { label: "냄새", value: "제품 고유의 향" },
        { label: "pH", value: "5.7 ~ 7.7" },
        { label: "인화성", value: "정상 조건에서 인화성 없음" },
        { label: "용해도", value: "수성 제품; 물과 혼합 가능" },
      ],
    },
    {
      no: 10,
      title: "안정성 및 반응성",
      rows: [
        { label: "안정성", value: "권장 보관 조건에서 안정함." },
        { label: "피해야 할 조건", value: "극한 온도, 직사광선, 동결." },
        { label: "피해야 할 물질", value: "강산화제, 강산 또는 강염기." },
        { label: "위험한 분해산물", value: "정상 조건에서 없음." },
      ],
    },
    {
      no: 11,
      title: "독성에 관한 정보",
      rows: [
        { label: "급성독성", value: "분류되지 않음. 모든 성분은 화장품 등급임." },
        { label: "피부 자극성", value: "자극성으로 분류되지 않음." },
        { label: "눈 자극성", value: "분류되지 않음. 눈과의 직접 접촉을 피한다." },
        { label: "과민성", value: "분류되지 않음. 민감성 피부는 패치테스트를 권장함." },
        { label: "기타", value: "발암성, 변이원성, 생식독성 우려는 확인된 바 없음." },
      ],
    },
    {
      no: 12,
      title: "환경에 미치는 영향",
      rows: [
        { label: "수생 생물독성", value: "수생생물에 유해한 것으로 분류되지 않음." },
        { label: "생분해성", value: "주요 성분(물, 글리세린)은 생분해 가능할 것으로 예상됨." },
        { label: "생물축적성", value: "예상되지 않음." },
        { label: "기타", value: "정상 사용 시 유의미한 환경 영향은 예상되지 않음." },
      ],
    },
    {
      no: 13,
      title: "폐기시 주의사항",
      rows: [
        { label: "제품", value: "사용한 마스크는 지역 규정에 따라 일반 생활폐기물로 폐기한다." },
        { label: "포장재", value: "재활용 시설이 있는 경우 재활용한다." },
        { label: "참고", value: "하수구나 수로에 버리지 않는다." },
      ],
    },
    {
      no: 14,
      title: "운송에 필요한 정보",
      rows: [
        { label: "UN 번호", value: "해당 없음" },
        { label: "위험등급", value: "위험물로 분류되지 않음" },
        { label: "ADR / IMDG / IATA", value: "위험물 운송규정 적용 대상 아님" },
        { label: "특별 주의사항", value: "운송 중 동결 및 극한 온도로부터 보호한다." },
      ],
    },
    {
      no: 15,
      title: "법적규제현황",
      rows: [
        { label: "제품 분류", value: "화장품(완제품)" },
        { label: "호주", value: "관련 AICIS 요건 및 Consumer Goods (Cosmetics) Information Standard 2020 적용 대상임." },
        { label: "한국", value: "대한민국 화장품법을 준수함" },
        { label: "EU", value: "화장품에 관한 Regulation (EC) No 1223/2009를 준수함" },
        { label: "금지성분", value: "허용 기준을 초과하는 금지 또는 제한 성분 없음" },
        { label: "특별 표시사항", value: "유해성 표시 불필요. 일반 화장품 표시기준을 따름." },
      ],
    },
    {
      no: 16,
      title: "그 밖의 참고사항",
      rows: [
        { label: "작성자", value: "주식회사 뉴트리어드바이저 – 품질보증팀" },
        { label: "면책조항", value: "본 MSDS는 정보 제공 목적으로 작성되었습니다. 본 정보는 현재까지의 지식과 관련 화장품 법규를 기준으로 합니다." },
      ],
    },
    ];
  }
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

export function buildDefaultMsds(
  lang: MsdsLanguage = "en"
): Pick<ProductMsds, "language" | "manufacturer" | "address" | "tel_emergency" | "product_type" | "revision" | "sections"> {
  if (lang === "ko") {
    return {
      language: "ko",
      manufacturer: DEFAULT_MANUFACTURER_KO,
      address: DEFAULT_ADDRESS_KO,
      tel_emergency: DEFAULT_TEL,
      product_type: DEFAULT_PRODUCT_TYPE_KO,
      revision: DEFAULT_REVISION,
      sections: buildDefaultMsdsSections("ko"),
    };
  }
  return {
    language: "en",
    manufacturer: DEFAULT_MANUFACTURER,
    address: DEFAULT_ADDRESS,
    tel_emergency: DEFAULT_TEL,
    product_type: DEFAULT_PRODUCT_TYPE,
    revision: DEFAULT_REVISION,
    sections: buildDefaultMsdsSections("en"),
  };
}

// 3번(COMPOSITION) 섹션의 "[확정코드 전성분 영문/국문 기입]" 자리표시자를 자동으로 채우기 위한 값 - 연동한
// 처방의 실제 전성분표를 전성분표 엑셀/HTML(downloadInciListExcel/buildInciListHtml)과 동일한 방식
// (함량 내림차순, 이름이 같은 성분은 합산)으로 계산해서 INCI명만 콤마로 이어붙인다. lang이 "ko"면
// 국문명(inci_kr), 아니면 영문명(inci_en)을 쓴다 - MSDS 문서 언어와 전성분 표기 언어를 일치시킨다
// (영문 MSDS는 영문 전성분, 국문 MSDS는 국문 전성분).
// 기준(basis)은 고정 MIX가 아니라 처방의 requires_public_basis_docs 플래그를 따른다 - 문서관리에서
// "이 처방은 서류를 공개처방(일반) 기준으로 발급(제조는 원처방 유지, 예외 처방)"으로 지정해둔
// 처방은 제조(원처방)와 서류(전성분표 등)가 서로 다른 BOM을 쓰는 예외 케이스라, 이 플래그를 무시하고
// 항상 MIX로 채우면 전성분표/문서관리에 나오는 값과 MSDS에 자동 기입되는 값이 서로 어긋난다
// (실측 사례: 3HGTA011A V0-PRE(Allergen 83)처럼 공개처방 전용으로 원료를 교체해 둔 BOM).
export async function fetchFormulaInciList(formulaCode: string, revision: string, lang: MsdsLanguage = "en"): Promise<string> {
  if (!formulaCode || !revision) return "";
  const rawLines = await fetchFormulaLinesForPdf(formulaCode, revision);
  if (rawLines.length === 0) return "";
  const { data: formula } = await supabaseProductionFinal
    .from("plm_formulas")
    .select("formula_code, revision, public_bom_customized, requires_public_basis_docs")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .maybeSingle();
  const basis: DocBasis = formula?.requires_public_basis_docs ? "PUBLIC" : "MIX";
  // basis="MIX"에서는 formula 인자를 쓰지 않으므로(건조 후 계산 때만 필요) formula가 없어도 안전하다.
  const { lines, components } = await resolveLinesForBasis(formula || {}, rawLines, basis);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  return rows.map((x) => (lang === "ko" ? (x.inci_kr || x.inci_en) : x.inci_en)).filter(Boolean).join(", ");
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
      language: msds.language || "en",
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
