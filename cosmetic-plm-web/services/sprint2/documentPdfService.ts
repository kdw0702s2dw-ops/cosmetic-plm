"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { fetchAllergenAlerts } from "@/services/sprint2/allergenService";
import { fetchRawMaterialsByCodes } from "@/services/sprint2/rawMaterialService";
import { fetchIngredientFunctionEntries } from "@/services/sprint2/ingredientDictionaryService";
import { fetchDisclosureLines } from "@/services/sprint2/formulaDisclosureService";

export type DocKind =
  | "INCI_LIST"
  | "COMPLEX_COMPONENT_TABLE"
  | "SINGLE_COMPONENT_TABLE"
  | "RAW_MATERIAL_ORDER_SHEET";

export async function fetchDocumentFormulas(keyword = "") {
  // 활성 처방이 100건을 넘어가면(2026-09 기준 150건대) 검색어 없이 볼 때 최근 100건 밖의 처방은
  // 아무리 새로고침해도 안 보이는 문제가 있었다 - 검색으로 찾을 수 있는 것과 별개로, 목록을 그냥
  // 훑어보거나 방금 수정한 처방이 우연히 이 범위 밖에 있으면 "새로고침해도 반응이 없다"처럼 보인다.
  // 당장의 데이터 규모보다 여유 있게 300으로 올려서 재발을 늦춘다(근본적으로는 무제한 조회가 맞지만
  // 이 화면 특성상 검색어 입력이 기본 사용 패턴이라 과도한 엔지니어링은 피함).
  let q = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (keyword.trim()) {
    const k = keyword.trim();
    q = q.or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%,customer.ilike.%${k}%,product_type.ilike.%${k}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchFormulaLinesForPdf(formulaCode: string, revision: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("line_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchComponentsByRawCodes(rawCodes: string[]) {
  const codes = Array.from(new Set(rawCodes.filter(Boolean)));
  if (codes.length === 0) return [];

  const { data, error } = await supabaseProductionFinal
    .from("plm_raw_material_components")
    .select("*")
    .in("raw_code", codes)
    .order("raw_code", { ascending: true })
    .order("component_no", { ascending: true });

  if (error) throw error;
  return data || [];
}

// formulaCodes를 넘기면 그 처방들의 문서만 조회한다(문서관리 PDF 화면이 항상 이렇게 부름 - 화면에 보이는
// 처방 범위로 좁혀서, 시스템 전체 문서 수가 아무리 늘어나도 "내가 보고 있는 처방의 문서 상태"는 항상
// 정확하게 조회되도록 하기 위함). formulaCodes를 안 넘기면(다른 화면에서 재사용할 가능성 대비) 예전처럼
// 전체 문서를 조회하되, 그 경우에도 아래 fallbackLimit로 최소한의 안전판을 둔다.
//
// 정렬을 created_at(최초 생성일)이 아니라 updated_at(마지막 재생성일) 기준으로 바꾼 것도 중요한 수정이다 -
// 예전 정렬(created_at desc + limit)에서는 오래전에 만든 문서를 "재생성"해도(재생성은 새 row를 만들지
// 않고 기존 row를 update만 함 - created_at 불변) created_at 기준 정렬에서는 여전히 옛날 자리에 머물러
// 있어서, 조회 범위 밖이면 방금 재생성했는데도 "미생성"으로 보이고 새로고침을 아무리 눌러도 안 바뀌는
// 문제가 있었다. updated_at 기준으로 바꾸면 방금 만들었거나 재생성한 문서가 항상 맨 앞으로 온다.
const PDF_DOCUMENT_TYPES = [
  "FORMULA_SHEET_PDF",
  "INCI_LIST",
  "COMPLEX_COMPONENT_TABLE",
  "SINGLE_COMPONENT_TABLE",
  "RAW_MATERIAL_ORDER_SHEET",
];

export async function fetchPdfDocuments(formulaCodes?: string[]) {
  let q = supabaseProductionFinal
    .from("plm_documents")
    .select("*")
    .in("document_type", PDF_DOCUMENT_TYPES)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (formulaCodes && formulaCodes.length > 0) {
    q = q.in("formula_code", formulaCodes);
  } else {
    const fallbackLimit = 400;
    q = q.limit(fallbackLimit);
  }

  const { data, error } = await q;

  if (error) throw error;
  const docs = data || [];

  // plm_documents -> plm_formulas FK가 없어서 formula_code로 별도 조회 후 바이어(customer)/처방명을 붙여줌
  const docFormulaCodes = Array.from(new Set(docs.map((d) => d.formula_code).filter(Boolean)));
  const metaByKey = new Map<string, { customer: string; formula_name: string }>();
  if (docFormulaCodes.length > 0) {
    const { data: formulas, error: formulaError } = await supabaseProductionFinal
      .from("plm_formulas")
      .select("formula_code, revision, customer, formula_name")
      .in("formula_code", docFormulaCodes);
    if (formulaError) throw formulaError;
    for (const f of formulas || []) {
      metaByKey.set(`${f.formula_code}|${f.revision}`, {
        customer: f.customer || "",
        formula_name: f.formula_name || "",
      });
    }
  }

  return docs.map((d) => {
    const meta = metaByKey.get(`${d.formula_code}|${d.revision}`);
    return {
      ...d,
      customer: meta?.customer || "",
      formula_name: meta?.formula_name || d.formula_code,
    };
  });
}

function e(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m] || m));
}

// 셀 내 줄바꿈: 배열을 <br>로 연결 (각 항목 HTML 이스케이프)
function eLines(items: any[]) {
  return items.map((x) => e(x)).join("<br/>");
}

function n(v: any) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

export function pct(v: any) {
  const num = Number(v || 0);
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(6)));
}

// 고정 소수 자릿수 표시 (예: fixedPct(1.3, 6) -> "1.300000"). PDF/엑셀이 항상 같은 문자열을 쓰도록
// 여기 한 곳에만 둔다.
export function fixedPct(v: any, decimals: number) {
  return Number(v || 0).toFixed(decimals);
}

// ============================================================
// 정확한 소수 연산 (BigInt 기반) - 단일성분표 Percentage(%) 표시 전용.
// line.percentage/comp.composition_percent는 둘 다 유한소수이므로 곱셈/나눗셈(÷100)/덧셈의
// 결과도 항상 유한소수로 정확히 끝난다. 부동소수점(Number) 연산은 이진수라 0.1+0.2 같은 오차가
// 생기므로, 소수점을 제거한 정수(BigInt) 연산으로 우회해 오차 없이 "정확히 몇 자리에서 끝나는지"까지
// 계산한다. 기존 final_percent(원가 계산 등 다른 곳에서 쓰는, .toFixed(8)로 반올림된 값)는 건드리지
// 않고, 이 계산은 exactPercent라는 별도 필드에만 병행해서 쌓는다.
// ============================================================
export type ExactDecimal = { digits: bigint; scale: number }; // value = digits / 10^scale

// tsconfig target이 ES2017이라 BigInt 리터럴(0n 등) 문법을 못 쓰므로 생성자 호출로 대신한다.
const BIG_ZERO = BigInt(0);
const BIG_TEN = BigInt(10);

function pow10(exp: number): bigint {
  return BIG_TEN ** BigInt(exp);
}

export function toExactDecimal(n: number): ExactDecimal {
  if (!Number.isFinite(n) || n === 0) return { digits: BIG_ZERO, scale: 0 };
  const negative = n < 0;
  // Number.prototype.toString()은 그 값과 다시 파싱했을 때 동일한 double이 되는 "가장 짧은" 십진
  // 표현을 보장한다(ECMA-262 Number::toString) - 즉 우리가 다루는 범위(퍼센트, 소수 몇~십여 자리)의
  // 값이라면 원래 입력한 십진수 그대로를 안전하게 복원할 수 있다.
  const s = Math.abs(n).toString();
  if (s.includes("e") || s.includes("E")) {
    // 이 앱의 퍼센트 범위에서는 실질적으로 나오지 않지만 방어적으로 처리
    const [mantissa, exp] = s.split(/e/i);
    const expNum = Number(exp);
    const [intPart, fracPart = ""] = mantissa.split(".");
    const scale = fracPart.length - expNum;
    const digits = BigInt(intPart + fracPart);
    return { digits: negative ? -digits : digits, scale: Math.max(0, scale) };
  }
  const [intPart, fracPart = ""] = s.split(".");
  const digits = BigInt((intPart + fracPart).replace(/^0+(?=\d)/, "") || "0");
  return { digits: negative ? -digits : digits, scale: fracPart.length };
}

function scaleUpTo(d: ExactDecimal, targetScale: number): bigint {
  const diff = targetScale - d.scale;
  return diff > 0 ? d.digits * pow10(diff) : d.digits;
}

export function exactAdd(a: ExactDecimal, b: ExactDecimal): ExactDecimal {
  const scale = Math.max(a.scale, b.scale);
  return { digits: scaleUpTo(a, scale) + scaleUpTo(b, scale), scale };
}

export function exactMultiply(a: ExactDecimal, b: ExactDecimal): ExactDecimal {
  return { digits: a.digits * b.digits, scale: a.scale + b.scale };
}

export function exactDivideByPow10(a: ExactDecimal, power: number): ExactDecimal {
  return { digits: a.digits, scale: a.scale + power };
}

// 뒤에 붙은 0을 제거해서 "값이 정확히 끝나는" 최소 소수 자릿수를 구한다. maxScale을 넘어가면
// (=15자리를 넘도록 끝나지 않으면) 거기서 멈춘다.
export function minimalScale(d: ExactDecimal, maxScale = 15): number {
  if (d.digits === BIG_ZERO) return 0;
  const abs = d.digits < BIG_ZERO ? -d.digits : d.digits;
  let s = abs.toString().padStart(d.scale + 1, "0");
  let scale = d.scale;
  while (scale > 0 && s.endsWith("0")) {
    s = s.slice(0, -1);
    scale--;
  }
  return Math.min(scale, maxScale);
}

// targetScale 자리로 정확하게(반올림 없이) 문자열을 만든다. targetScale은 항상
// minimalScale(d) 이상으로 호출되므로(우리 쪽 사용 방식상), 자리를 줄여야 할 때 버려지는
// 자리는 전부 0이라 정밀도 손실이 없다.
export function exactDecimalToString(d: ExactDecimal, targetScale: number): string {
  const negative = d.digits < BIG_ZERO;
  const abs = d.digits < BIG_ZERO ? -d.digits : d.digits;
  const diff = targetScale - d.scale;
  const scaled = diff >= 0 ? abs * pow10(diff) : abs / pow10(-diff);
  const s = scaled.toString().padStart(targetScale + 1, "0");
  const intPart = targetScale > 0 ? s.slice(0, s.length - targetScale) : s;
  const fracPart = targetScale > 0 ? s.slice(s.length - targetScale) : "";
  const body = targetScale > 0 ? `${intPart}.${fracPart}` : intPart;
  return negative && scaled !== BIG_ZERO ? `-${body}` : body;
}

export function exactDecimalToNumber(d: ExactDecimal): number {
  return Number(exactDecimalToString(d, d.scale));
}

// ============================================================
// KOVAS 양식 공통 스타일 (줄바꿈 셀 + 박스 + 각주/기밀문구)
// ============================================================
export const CONFIDENTIAL =
  "본 문서는 지정된 수신인만을 위한 것이며 영업비밀·기밀정보를 포함할 수 있습니다. 무단 공개·배포·복사를 금합니다.";
export const NOTES = [
  "1) Raw material manufacturers can be changed without advance notice if it does not affect product functions.",
  "2) Viscosity and pH-related raw materials can be adjusted.",
];
export const ALLERGEN_BASE_LINE = "3) Allergen Labeling: Leave-on ≥ 0.001% / Rinse-off ≥ 0.01%";

// 처방의 제품 사용유형(exposure_type)에 따라 plm_allergen_alerts 계산 결과를 표로 렌더링.
// exposure_type 미지정이면 "계산 불가" 안내, 계산은 됐지만 표시대상이 0건이면 그와 구분되게 명시.
function allergenSection(f: any, alerts: any[]) {
  if (!f.exposure_type) {
    return `<p>${e(ALLERGEN_BASE_LINE)}</p>
<p style="color:#b91c1c">제품 사용유형이 미지정되어 알러젠 표시 여부를 계산할 수 없습니다. 처방관리에서 Leave-on/Rinse-off를 먼저 지정해주세요.</p>`;
  }

  const label = f.exposure_type === "LEAVE_ON" ? "Leave-on" : "Rinse-off";
  // 표시 의무가 있는(기준치 초과) 알러젠만 표에 올린다 - 미표시 항목까지 나열하면 바이어에게 오히려
  // 혼동을 줄 수 있다는 사용자 피드백에 따른 것.
  const requiredAlerts = alerts.filter((a) => a.label_required);
  if (requiredAlerts.length === 0) {
    return `<p>${e(ALLERGEN_BASE_LINE)} (적용기준: ${e(label)})</p>
<p style="color:#64748b">표시 대상 알러젠 성분 없음 (No allergen ingredient requires labeling)</p>`;
  }

  const rows = requiredAlerts
    .map(
      // 국문명이 없는 항목(plm_allergen_master.allergen_name_kr 미입력)은 "- (English)"처럼 어색하게
      // 보이지 않도록 영문명만 단독으로 보여준다. 국문명이 있으면 항상 "국문 (영문)" 형식으로 통일.
      // 이 표에는 위에서 이미 label_required(기준치 초과)만 걸러 두었으므로 표시여부는 항상 Y.
      (a) => `<tr>
<td>${a.allergen_name_kr ? `${e(a.allergen_name_kr)} (${e(a.allergen_name_en)})` : e(a.allergen_name_en)}</td>
<td class="right">${pct(a.formula_percent)}%</td>
<td class="center">Y</td>
</tr>`
    )
    .join("");

  // 바이어(해외 거래처)용 문서라 헤더는 국문/영문을 병행 표기한다.
  return `<p>${e(ALLERGEN_BASE_LINE)} (적용기준: ${e(label)})</p>
<table class="grid" style="margin-top:6px">
<thead><tr>
  <th>표시대상 성분<br/>Allergen Ingredient</th>
  <th>최종함량(%)<br/>Final Content(%)</th>
  <th>표시여부<br/>Labeling Required</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

// ============================================================
// 알러젠 기준(basis)별 실시간 재계산
// ============================================================
// plm_allergen_alerts는 plm_calculate_allergen_alerts RPC가 원처방(MIX, plm_formula_lines)만 보고
// 미리 계산해 저장해 둔 표라서, 공개처방(일반/건조)처럼 별도로 저장된 BOM을 보여주는 문서에도 그
// 값을 그대로 노출하면 basis와 실제로 다른(MIX 기준) 값이 나온다. 문서 빌더가 이미 resolveLinesForBasis()로
// 구해둔 해당 basis의 lines/components에서 직접 알러젠 함량을 다시 집계해서, basis가 무엇이든 항상 그
// 문서의 실제 기준에 맞는 값을 보여준다. 계산식(SUM(투입%×구성비/100))과 시장(target_market, 미지정
// 시 KR) 필터링은 plm_calculate_allergen_alerts RPC(10_allergen_phase6_market_scope.sql)와 동일하게 맞춘다.
function computeAllergenTotalsFromLinesAndComponents(lines: any[], components: any[]): Map<string, number> {
  const map = byRawComponents(components);
  const totals = new Map<string, number>();
  for (const line of lines) {
    const comps = map.get(line.raw_code) || [];
    for (const comp of comps) {
      if (!comp.is_allergen || !comp.allergen_id) continue;
      // complexRows()의 final_percent 계산과 동일한 식(건조 후는 _dryFinalPercent 우선) - 두 곳이
      // 어긋나면 전성분표 문구와 알러젠 표의 숫자가 서로 다른 값을 근거로 삼게 되므로 반드시 맞춰야 한다.
      const finalPercent = comp._dryFinalPercent != null
        ? comp._dryFinalPercent
        : (n(line.percentage) * n(comp.composition_percent)) / 100;
      totals.set(comp.allergen_id, (totals.get(comp.allergen_id) || 0) + finalPercent);
    }
  }
  return totals;
}

async function fetchAllergenMasterByIds(ids: string[], market: string) {
  if (ids.length === 0) return [];
  const { data, error } = await supabaseProductionFinal
    .from("plm_allergen_master")
    .select("id, allergen_name_en, allergen_name_kr")
    .in("id", ids)
    .eq("market", market);
  if (error) throw error;
  return data || [];
}

export type BasisAllergenAlert = {
  allergen_id: string;
  allergen_name_en: string;
  allergen_name_kr: string | null;
  formula_percent: number;
  label_required: boolean;
};

// 반환값 null: exposure_type 미지정이라 계산 불가(allergenSection이 기존 안내 문구를 그대로 보여줌).
// 반환값 []: 계산은 됐지만 이 basis에는 등록된 알러젠 구성성분 자체가 없음(표시 대상 0건과 동일하게 렌더링).
async function computeBasisAllergenAlerts(formula: any, lines: any[], components: any[]): Promise<BasisAllergenAlert[] | null> {
  if (!formula.exposure_type) return null;
  const threshold = formula.exposure_type === "LEAVE_ON" ? 0.001 : 0.01;
  const totals = computeAllergenTotalsFromLinesAndComponents(lines, components);
  if (totals.size === 0) return [];

  const market = formula.target_market || "KR";
  const ids = Array.from(totals.keys());
  const masters = await fetchAllergenMasterByIds(ids, market);
  const masterMap = new Map(masters.map((m) => [m.id, m]));

  return ids
    .filter((id) => masterMap.has(id)) // RPC와 동일하게 target_market과 일치하는 알러젠만 포함
    .map((id) => {
      const m = masterMap.get(id)!;
      const percent = Number((totals.get(id) as number).toFixed(8));
      return {
        allergen_id: id,
        allergen_name_en: m.allergen_name_en,
        allergen_name_kr: m.allergen_name_kr,
        formula_percent: percent,
        label_required: percent >= threshold,
      };
    })
    .sort((a, b) => a.allergen_name_en.localeCompare(b.allergen_name_en));
}

// basisAlerts를 넘기면(전성분표/복합성분표/단일성분표) 그 값을 그대로 쓰고, 넘기지 않으면(원료발주가처방 -
// 항상 원처방 기준이라 basis 개념이 없음) 기존처럼 plm_allergen_alerts 정적 표를 그대로 조회한다.
async function baseHtml(
  title: string,
  headerMeta: Record<string, string>,
  body: string,
  formula: any,
  basisAlerts?: BasisAllergenAlert[] | null
) {
  const alerts = basisAlerts !== undefined
    ? basisAlerts ?? []
    : await fetchAllergenAlerts(formula.formula_code, formula.revision).catch(() => []);
  const metaRows = Object.entries(headerMeta)
    .map(
      ([k, v]) =>
        `<tr><td class="k">${e(k)}</td><td class="colon">:</td><td class="v">${e(v)}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>${e(title)}</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,'Malgun Gothic','Noto Sans KR',sans-serif}
.page{width:1040px;margin:24px auto;background:white;padding:40px 44px;border:1px solid #dbe3ef}
.doctitle{text-align:center;font-size:22px;font-weight:800;margin:0 0 20px}
.meta{border-collapse:collapse;margin-bottom:20px}
.meta td{padding:3px 6px;font-size:12px;vertical-align:top}
.meta .k{color:#334155;white-space:nowrap}
.meta .colon{color:#94a3b8;padding:0 8px}
.meta .v{color:#0f172a}
table.grid{width:100%;border-collapse:collapse;margin-top:4px}
table.grid th{background:#e8e6df;color:#1b1f1d;font-weight:700}
table.grid th,table.grid td{border:1px solid #999;padding:6px 8px;font-size:11px;vertical-align:top;line-height:1.55}
.center{text-align:center}.right{text-align:right}
.notes{margin-top:14px}.notes p{margin:2px 0;font-size:10px;font-style:italic;color:#475569}
.confidential{margin-top:12px;font-size:9px;color:#94a3b8}
.box{border:1px solid #888;margin-top:10px}
.box .bt{background:#f3f4f6;text-align:center;font-weight:800;padding:8px;border-bottom:1px solid #888;font-size:13px}
.box .bb{text-align:center;padding:12px;font-size:12px;line-height:1.7}
.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:14px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
<div class="doctitle">${e(title)}</div>
<table class="meta">${metaRows}</table>
${body}
<div class="notes">${NOTES.map((x) => `<p>${e(x)}</p>`).join("")}</div>
<div class="notes">${allergenSection(formula, alerts)}</div>
<div class="confidential">${e(CONFIDENTIAL)}</div>
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

export function kovasMeta(f: any) {
  return {
    "Development No.": f.formula_code ?? "",
    "Sample No.": f.revision ?? "",
    Manufacturer: f.manufacturer ?? "Nutriadvisor(뉴트리어드바이저)",
    Customer: f.customer ?? "",
    "Product name acc. To package": f.formula_name ?? "",
  };
}

// 원료발주가처방 상단 메타 (개발번호/제품명/연구원 정보만 - 다른 3종 문서의 kovasMeta와 별개)
export function orderSheetMeta(f: any) {
  return {
    "개발번호": f.formula_code ?? "",
    "샘플번호": f.revision ?? "",
    "확정코드": f.confirmed_code ?? "",
    "제품명": f.formula_name ?? "",
    "연구원 정보": f.assigned_researcher ?? "",
  };
}

export type ExpandedRow = {
  formula_code?: string;
  formula_name?: string;
  raw_code?: string;
  raw_name?: string;
  raw_percent?: number;
  inci_en: string;
  inci_kr: string;
  component_percent?: number;
  final_percent: number;
  cas_no: string;
  ec_no: string;
  function_text: string;
  line_no?: number;
  sourceLineNos?: number[];
  exactPercent?: ExactDecimal; // 단일성분표 Percentage(%) 표시 전용 (오차 없는 정확값, final_percent와 별개)
  is_allergen?: boolean; // plm_raw_material_components.is_allergen 그대로 전달 (전성분표 표시기준 필터링용)
  allergen_id?: string | null; // plm_raw_material_components.allergen_id 그대로 전달
};

export function byRawComponents(components: any[]) {
  const map = new Map<string, any[]>();
  for (const c of components) {
    const arr = map.get(c.raw_code) || [];
    arr.push(c);
    map.set(c.raw_code, arr);
  }
  return map;
}

// 단일성분표 Function 컬럼: 전성분관리(plm_ingredient_dictionary)에 등록된 효능 정보를 CAS No. 우선,
// 없으면 INCI명(영문/국문)으로 조회해 채운다. 원료관리의 구성성분/BOM 라인에 남아있는 자체 function
// 필드는 입력 UI가 없어 사실상 항상 비어있으므로 더 이상 참조하지 않는다. 국문 효능은 쓰지 않고 항상
// 영문(function_en)만 노출한다 - 바이어용 문서라 영문 표준 용어만 필요하다는 요청에 따른 것.
function splitCasTokensForLookup(casNo?: string | null): string[] {
  return (casNo || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export type IngredientFunctionLookup = { casMap: Map<string, string>; nameMap: Map<string, string> };

export function buildIngredientFunctionLookup(
  entries: Array<{ cas_no?: string | null; inci_en?: string | null; inci_kr?: string | null; function_en?: string | null }>
): IngredientFunctionLookup {
  const casMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  for (const item of entries) {
    const fn = (item.function_en || "").trim();
    if (!fn) continue;
    for (const tok of splitCasTokensForLookup(item.cas_no)) {
      if (!casMap.has(tok)) casMap.set(tok, fn);
    }
    const enKey = normalizeIngredientName(item.inci_en);
    if (enKey && !nameMap.has(enKey)) nameMap.set(enKey, fn);
    const krKey = normalizeIngredientName(item.inci_kr);
    if (krKey && !nameMap.has(krKey)) nameMap.set(krKey, fn);
  }
  return { casMap, nameMap };
}

function lookupIngredientFunctionEn(
  lookup: IngredientFunctionLookup | undefined,
  casNo?: string | null,
  inciEn?: string | null,
  inciKr?: string | null
): string {
  if (!lookup) return "";
  for (const tok of splitCasTokensForLookup(casNo)) {
    const hit = lookup.casMap.get(tok);
    if (hit) return hit;
  }
  const enKey = normalizeIngredientName(inciEn);
  if (enKey && lookup.nameMap.has(enKey)) return lookup.nameMap.get(enKey)!;
  const krKey = normalizeIngredientName(inciKr);
  if (krKey && lookup.nameMap.has(krKey)) return lookup.nameMap.get(krKey)!;
  return "";
}

export function complexRows(lines: any[], components: any[], functionLookup?: IngredientFunctionLookup): ExpandedRow[] {
  const map = byRawComponents(components);
  const rows: ExpandedRow[] = [];

  for (const line of lines) {
    const comps = map.get(line.raw_code) || [];
    for (const comp of comps) {
      rows.push({
        formula_code: line.formula_code,
        formula_name: line.formula_name,
        raw_code: line.raw_code,
        raw_name: line.raw_name,
        raw_percent: n(line.percentage),
        inci_en: comp.inci_en || comp.component_name_en || "",
        inci_kr: comp.inci_kr || comp.component_name_kr || "",
        component_percent: n(comp.composition_percent),
        // 건조 후(부분잔류 원료) 계산은 comp._dryFinalPercent에 이미 정확한 최종 함량이 담겨 있다
        // (물/비물 성분이 서로 다른 비율로 변하므로 line.percentage×composition_percent로는 재현 불가).
        // 그 외(배합 시, 또는 건조 후라도 영향받지 않은 원료)는 기존 방식 그대로 계산한다.
        final_percent: Number(
          (comp._dryFinalPercent != null ? comp._dryFinalPercent : n(line.percentage) * n(comp.composition_percent) / 100).toFixed(8)
        ),
        cas_no: comp.cas_no || "",
        ec_no: comp.ec_no || "",
        function_text: lookupIngredientFunctionEn(functionLookup, comp.cas_no, comp.inci_en, comp.inci_kr),
        line_no: line.line_no,
        is_allergen: !!comp.is_allergen,
        allergen_id: comp.allergen_id || null,
        exactPercent: exactDivideByPow10(
          exactMultiply(toExactDecimal(n(line.percentage)), toExactDecimal(n(comp.composition_percent))),
          2
        ),
      });
    }
  }

  return rows.sort((a, b) => b.final_percent - a.final_percent);
}

export function singleRows(lines: any[], components: any[], functionLookup?: IngredientFunctionLookup): ExpandedRow[] {
  const complexRawCodes = new Set(components.map((c) => c.raw_code));
  return lines
    .filter((line) => !complexRawCodes.has(line.raw_code))
    .map((line) => ({
      formula_code: line.formula_code,
      formula_name: line.formula_name,
      raw_code: line.raw_code,
      raw_name: line.raw_name,
      inci_en: line.inci_en || line.raw_name || "",
      inci_kr: line.inci_kr || line.raw_name || "",
      final_percent: n(line.percentage),
      cas_no: line.cas_no || "",
      ec_no: line.ec_no || "",
      function_text: lookupIngredientFunctionEn(functionLookup, line.cas_no, line.inci_en, line.inci_kr),
      line_no: line.line_no,
      exactPercent: toExactDecimal(n(line.percentage)),
    }))
    .sort((a, b) => b.final_percent - a.final_percent);
}

// 전성분명(국문 우선, 없으면 영문) 비교용 정규화 - 공백/대소문자 차이는 같은 성분으로 취급
function normalizeIngredientName(s?: string | null) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function mergeRows(rows: ExpandedRow[]) {
  const map = new Map<string, ExpandedRow>();
  for (const row of rows) {
    // 전성분명이 같으면 CAS/EC No.가 다르게 입력되어 있어도(예: CAS 1개 vs 2개 병기) 같은 성분으로 합산한다.
    // 이름이 아예 비어있는 예외적인 경우에만 기존 방식(이름+CAS+EC+효능)으로 구분해 서로 다른 빈 이름 행이
    // 잘못 합쳐지는 것을 막는다.
    const nameKey = normalizeIngredientName(row.inci_kr) || normalizeIngredientName(row.inci_en);
    const key = nameKey || ["__noname__", row.inci_en, row.inci_kr, row.cas_no, row.ec_no, row.function_text].join("|");
    const old = map.get(key);
    if (old) {
      old.final_percent = Number((old.final_percent + row.final_percent).toFixed(8));
      if (row.exactPercent) {
        old.exactPercent = old.exactPercent ? exactAdd(old.exactPercent, row.exactPercent) : row.exactPercent;
      }
      if (row.line_no != null) old.sourceLineNos = [...(old.sourceLineNos || []), row.line_no];
    } else {
      map.set(key, { ...row, sourceLineNos: row.line_no != null ? [row.line_no] : [] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.final_percent - a.final_percent);
}

// PUBLIC(공개처방·일반)/DRY(공개처방·건조)는 처방/Revision별로 plm_formulas.public_bom_customized /
// dry_bom_customized 플래그가 true일 때만 별도로 저장된 BOM(plm_formula_lines_public /
// plm_formula_lines_dry, formulaDisclosureService 참고)을 쓴다. 플래그가 false인 동안(=사용자가
// 처방관리 BOM 편집에서 해당 탭을 한 번도 저장한 적 없음)은 기존 동작 그대로 - PUBLIC은 MIX(원처방)와
// 완전히 동일한 값을, DRY는 실측 수분율 기반 자동계산 값을 보여준다. 아래 resolveLinesForBasis()가
// 이 분기를 전담하고, 그 아래 문서 빌더들은 basis 값에 따라 나머지(반올림 자릿수 등)만 다르게 처리한다.
export type DocBasis = "MIX" | "DRY" | "PUBLIC";

// 문서 제목/엑셀 파일명에 붙는 기준별 접미사 - PDF·엑셀 공통으로 사용한다.
export function basisTitleSuffix(basis: DocBasis): string {
  if (basis === "DRY") return " (건조 후)";
  if (basis === "PUBLIC") return " (공개처방)";
  return "";
}
export function basisFileSuffix(basis: DocBasis): string {
  if (basis === "DRY") return "_건조후";
  if (basis === "PUBLIC") return "_공개처방";
  return "";
}

// 문서관리 화면의 "기준" 버튼 라벨과 동일한 전체 명칭 - COA/MSDS 등 원료 문서 섹션에서 지금 어떤
// 기준(원처방/공개처방 일반/건조)의 원료 구성을 보고 있는지 표시할 때 재사용한다.
export function basisSectionLabel(basis: DocBasis): string {
  if (basis === "DRY") return "공개처방(건조)";
  if (basis === "PUBLIC") return "공개처방(일반)";
  return "원처방";
}

// 전성분표/복합성분표/단일성분표 전용 - 국문/영문 표기를 선택해서 출력할 수 있게 한다.
// KR=국문만, EN=영문만, BOTH=국문+영문(기존 동작, 기본값).
export type DocLang = "KR" | "EN" | "BOTH";

export function langTitleSuffix(lang: DocLang): string {
  if (lang === "KR") return " (국문)";
  if (lang === "EN") return " (영문)";
  return "";
}
export function langFileSuffix(lang: DocLang): string {
  if (lang === "KR") return "_국문";
  if (lang === "EN") return "_영문";
  return "";
}
export type VolatilityType = "NONE" | "FULL_VOLATILE" | "PARTIAL_RESIDUAL";

export function volatilityMapFromRawMaterials(materials: { raw_code: string; volatility_type?: string | null }[]): Map<string, VolatilityType> {
  return new Map(materials.map((m) => [m.raw_code, ((m.volatility_type as VolatilityType) || "NONE")]));
}

// 물의 CAS No. (정제수/Water/Aqua) - 부분잔류 원료 안에서 "어떤 구성성분이 물인지" 자동으로 판별하는 데 쓴다.
export const WATER_CAS_NO = "7732-18-5";

function isWaterComponent(c: { cas_no?: string | null }) {
  return (c.cas_no || "").trim() === WATER_CAS_NO;
}

// 원료의 "휘발성 유형"을 명시적으로 지정하지 않은(=없음) 경우, 그 원료의 구성성분 중에 물(CAS 7732-18-5)이
// 하나라도 있으면 자동으로 "부분잔류"로 취급한다. 완전휘발/부분잔류로 이미 명시한 원료는 그 지정을 그대로 존중한다.
// → 정제수가 들어간 복합원료마다 일일이 원료관리에서 휘발성 유형을 바꿔주지 않아도, 건조 후 계산 시 자동으로 반영된다.
function effectiveVolatility(rawCode: string, explicit: VolatilityType, componentsByRawCode: Map<string, any[]>): VolatilityType {
  if (explicit !== "NONE") return explicit;
  const comps = componentsByRawCode.get(rawCode) || [];
  return comps.some(isWaterComponent) ? "PARTIAL_RESIDUAL" : "NONE";
}

// "건조 후" 전성분 계산 (건조형 제형 - 플라스타 등): 완전휘발 원료(제조 중 소실)는 원료째로 제외한다.
// 부분잔류 원료는 "원료 전체"가 아니라 그 원료의 구성성분 중 물(CAS 7732-18-5)로 확인되는 성분만 수분으로
// 취급해서, 리비전 단위로 입력된 실측 수분율을 물 성분들의 배합시 함량 비율에 비례 배분한 값으로 대체한다.
// 같은 원료 안의 나머지 구성성분(부틸렌글라이콜, 추출물 등 물이 아닌 성분)과, 부분잔류가 아닌 원료는
// 물이 날아간 만큼 오히려 비율이 올라가야 하므로(농축) 다른 비휘발 원료와 동일하게 scale_factor로 확대한다.
// 원료의 휘발성 유형을 "없음"(미지정)으로 둔 경우에도, 그 원료 구성성분에 물이 포함돼 있으면
// effectiveVolatility()가 자동으로 "부분잔류"로 취급한다 - 정제수가 들어간 복합원료마다 매번 원료관리에서
// 휘발성 유형을 수동으로 바꿔줄 필요 없이 건조 후 계산에 자동 반영된다. 완전휘발/부분잔류로 이미 명시한
// 원료는 그 지정을 그대로 존중한다.
// (원료에 구성성분이 하나도 등록되어 있지 않은 예외적인 경우에만 원료 전체를 물로 간주한다.)
// scale_factor = (100 - 실측수분율%) / (100 - 완전휘발원료% - 부분잔류원료 중 "물" 성분 함량 합계%)
// BOM 라인(lines)과 구성성분(components)을 함께 조정해서 반환하므로, 이 결과를 그대로 complexRows/
// singleRows/buildComplexGroupedRows에 넘기면(즉 전성분표·단일성분표·복합성분표·자동 전성분 전부) 동일하게 반영된다.
export function applyDryBasisToLines(
  lines: any[],
  components: any[],
  volatilityByRawCode: Map<string, VolatilityType>,
  measuredMoisturePercent: number | null | undefined
): { lines: any[]; components: any[] } {
  if (measuredMoisturePercent == null) {
    throw new Error("실측 수분율을 먼저 입력하세요.");
  }
  const moisture = n(measuredMoisturePercent);

  const totalByRawCode = new Map<string, number>();
  for (const l of lines) {
    totalByRawCode.set(l.raw_code, (totalByRawCode.get(l.raw_code) || 0) + n(l.percentage));
  }
  const componentsByRawCode = byRawComponents(components);

  // 1) 완전휘발 합계 + 부분잔류 원료들의 "물" 성분 최종 함량(배합시 기준) 합계를 구한다.
  let fullVolatilePercent = 0;
  let waterPercent = 0;
  const waterFinalByRawCode = new Map<string, number>();
  for (const [rawCode, rawPct] of totalByRawCode) {
    const v = effectiveVolatility(rawCode, volatilityByRawCode.get(rawCode) ?? "NONE", componentsByRawCode);
    if (v === "FULL_VOLATILE") {
      fullVolatilePercent += rawPct;
      continue;
    }
    if (v !== "PARTIAL_RESIDUAL") continue;

    const comps = componentsByRawCode.get(rawCode) || [];
    const waterRatio = comps.length === 0 ? 100 : comps.filter(isWaterComponent).reduce((s, c) => s + n(c.composition_percent), 0);
    const waterFinal = rawPct * (waterRatio / 100);
    waterFinalByRawCode.set(rawCode, waterFinal);
    waterPercent += waterFinal;
  }

  const denom = 100 - fullVolatilePercent - waterPercent;
  if (denom <= 0) {
    throw new Error("완전휘발 원료 + 부분잔류 원료 중 수분 비율의 합이 100% 이상이라 건조 후 전성분을 계산할 수 없습니다.");
  }
  const scaleFactor = (100 - moisture) / denom;

  const newLines: any[] = [];
  const newComponents: any[] = [];

  for (const l of lines) {
    const v = effectiveVolatility(l.raw_code, volatilityByRawCode.get(l.raw_code) ?? "NONE", componentsByRawCode);
    if (v === "FULL_VOLATILE") continue; // 원료째로 제외

    if (v !== "PARTIAL_RESIDUAL") {
      newLines.push({ ...l, percentage: n(l.percentage) * scaleFactor });
      continue;
    }

    // PARTIAL_RESIDUAL
    const comps = componentsByRawCode.get(l.raw_code) || [];
    const waterFinalOriginal = waterFinalByRawCode.get(l.raw_code) || 0;
    const newWaterFinal = waterPercent > 0 ? moisture * (waterFinalOriginal / waterPercent) : 0;

    if (comps.length === 0) {
      // 구성성분 미등록 원료: 원료 전체를 물로 간주해 그대로 대체
      newLines.push({ ...l, percentage: newWaterFinal });
      continue;
    }

    const origLinePct = n(l.percentage);
    let newLineTotal = newWaterFinal; // 물 성분 몫은 먼저 더해두고, 아래 루프에서는 물이 아닌 성분만 더한다
    const adjusted: { comp: any; newFinal: number }[] = [];
    for (const c of comps) {
      const origFinal = origLinePct * (n(c.composition_percent) / 100);
      if (isWaterComponent(c)) {
        const share = waterFinalOriginal > 0 ? origFinal / waterFinalOriginal : 0;
        adjusted.push({ comp: c, newFinal: newWaterFinal * share });
      } else {
        const newFinal = origFinal * scaleFactor; // 물이 아닌 성분은 농축(비율 상승)
        adjusted.push({ comp: c, newFinal });
        newLineTotal += newFinal;
      }
    }

    newLines.push({ ...l, percentage: newLineTotal });
    // composition_percent(원료 내부 구성비)는 원료관리에 등록된 값 그대로 유지한다 - 물이 증발했다고
    // 원료 자체의 등록 스펙(예: "이 원료는 정제수 90%로 구성됨")이 바뀌는 게 아니므로, 바이어가 보는
    // "% Sub Ingredient in Raw Ingredient"는 항상 등록값과 동일해야 신뢰할 수 있다. 대신 건조 후
    // 실제 최종 함량(물/비물 성분이 서로 다른 비율로 변하는 값)은 _dryFinalPercent에 별도로 담아서,
    // 이 값을 참조하는 쪽(complexRows/buildComplexGroupedRows)에서 ratio×input 재계산 없이 그대로 쓴다.
    for (const { comp, newFinal } of adjusted) {
      newComponents.push({ ...comp, _dryFinalPercent: newFinal });
    }
  }

  // 완전휘발/부분잔류가 아닌 원료의 구성성분은 원본 그대로 유지 (구성비 자체는 안 바뀌고 원료 라인%만 확대됨)
  for (const [rawCode, comps] of componentsByRawCode) {
    const v = effectiveVolatility(rawCode, volatilityByRawCode.get(rawCode) ?? "NONE", componentsByRawCode);
    if (v === "PARTIAL_RESIDUAL" || v === "FULL_VOLATILE") continue;
    newComponents.push(...comps);
  }

  return { lines: newLines, components: newComponents };
}

// basis="DRY"면 원료의 volatility_type을 조회해서 applyDryBasisToLines()로 lines/components를 모두
// 건조 후 버전으로 바꿔 반환하고, basis="MIX"(기본값)면 원본 lines와 구성성분을 그대로 반환한다.
// 전성분표/단일성분표/복합성분표 3종 문서와 엑셀 다운로드가 공통으로 이 함수를 거쳐서 lines/components를 얻는다.
export async function resolveLinesForBasis(formula: any, lines: any[], basis: DocBasis): Promise<{ lines: any[]; components: any[] }> {
  // 공개처방(일반/건조)을 원처방과 독립적으로 저장해둔 처방/Revision이면, 그 저장된 BOM을 그대로
  // 쓴다(추가 계산 없음 - DRY라도 이미 최종값으로 저장돼 있으므로 실측 수분율 계산을 다시 하지 않음).
  // 플래그가 false면(아직 한 번도 저장한 적 없음) 아래로 내려가 기존 동작을 그대로 유지한다.
  if (basis === "PUBLIC" && formula.public_bom_customized) {
    const overrideLines = (await fetchDisclosureLines("PUBLIC", formula.formula_code, formula.revision)) as any[];
    if (overrideLines.length > 0) {
      const components = await fetchComponentsByRawCodes(overrideLines.map((x) => x.raw_code));
      return { lines: overrideLines, components };
    }
  }
  if (basis === "DRY" && formula.dry_bom_customized) {
    const overrideLines = (await fetchDisclosureLines("DRY", formula.formula_code, formula.revision)) as any[];
    if (overrideLines.length > 0) {
      const components = await fetchComponentsByRawCodes(overrideLines.map((x) => x.raw_code));
      return { lines: overrideLines, components };
    }
  }

  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  if (basis !== "DRY") return { lines, components };
  const materials = await fetchRawMaterialsByCodes(lines.map((x) => x.raw_code));
  return applyDryBasisToLines(lines, components, volatilityMapFromRawMaterials(materials), formula.measured_moisture_percent);
}

// mergeRows() 결과(rows)에 대해 문서 전체에서 통일할 소수 자릿수를 구한다:
// 각 행의 "정확히 끝나는 자리"(minimalScale) 중 최댓값을, 최소 14자리~최대 15자리 사이로 clamp.
export function computeUniformPercentDecimals(rows: ExpandedRow[], minDecimals = 14, maxDecimals = 15) {
  let maxNeeded = minDecimals;
  for (const row of rows) {
    if (!row.exactPercent) continue;
    maxNeeded = Math.max(maxNeeded, minimalScale(row.exactPercent, maxDecimals));
  }
  return Math.min(maxNeeded, maxDecimals);
}

// finalPercent = 이 구성성분이 처방 전체에서 차지하는 최종 함량(%) = input(원료의 처방 내 비율) × ratio(원료
// 안에서 이 성분의 구성비) ÷ 100. 단일성분표의 각 INCI 함량은 이 finalPercent를 이름별로 합산한 값과 같다 -
// 복합성분표에 이 값을 그대로 노출해서, 바이어가 복합성분표만 보고도 단일성분표 숫자가 어떻게 나왔는지
// (ratio × input = finalPercent) 직접 검산할 수 있게 한다.
export type ComplexGroupedItem = {
  inci_en: string;
  inci_kr: string;
  ratio: number | null;
  cas: string;
  finalPercent: number;
  // 배합 시(MIX) 한정 - input×ratio÷100은 둘 다 유한소수라 오차 없이 정확히 끝나는 값을 구할 수 있다
  // (단일성분표 exactPercent와 동일한 BigInt 연산). 건조 후(DRY)는 나눗셈이 섞여 대부분 안 끝나므로
  // 계산하지 않는다(_dryFinalPercent 기반 항목은 undefined로 둠).
  exactFinalPercent?: ExactDecimal;
  is_allergen?: boolean;
  allergen_id?: string | null;
};
export type ComplexGroupedRow = {
  raw_code?: string;
  raw_name?: string;
  input: number;
  func: string;
  items: ComplexGroupedItem[];
  // 이 원료(주로 향료) 안에 등록된 알러젠 구성성분들 - 향료 자체를 나타내는 기본 항목(예: composition_
  // percent=100인 "Fragrance/Parfum" 자기 자신 항목)과 중복 집계되지 않도록 items에서 분리해서 따로
  // 담아둔다. items만 보는 Final % in Formula 합계·자릿수 계산 등은 자동으로 알러젠이 제외된 값이 되고,
  // 실제 화면 표시는 문서 빌더(PDF/엑셀)가 "3)" 각주 행으로 별도 렌더링한다.
  allergenItems: ComplexGroupedItem[];
};

// 원료(투입물) 단위로 묶기. 복합원료는 구성성분 여러 개, 단일원료는 자기 자신 1개(ratio는 '-' 표시용 null).
// 같은 raw_code가 여러 Phase/라인에 나뉘어 등록된 경우 하나의 행으로 합친다 - INCI명이 아니라
// raw_code로만 판단해서(이름만 같은 별개 원료를 잘못 합치지 않도록), 투입%(최종함량)는 합산하고
// 구성비(원료 고유값)는 그대로 유지한다.
// PDF(복합성분표)와 엑셀 다운로드가 이 함수를 그대로 공유해서, 원료=1행/구성성분은 셀 내 줄바꿈이라는
// 동일한 레이아웃 규칙을 두 출력 형식에서 어긋나지 않게 유지한다.
//
// %Raw Ingredient in Formula(input) 표시 규칙: 표를 보기 좋게 하려고 소수 2자리로 반올림해서 그대로
// 계산에도 쓴다(단순 원료는 이 반올림된 값이 곧 Final %). 원료별로 독립적으로 반올림하면 그 오차가
// 누적되어 전체 합계가 100%에서 어긋나므로(실측 확인: 최대 0.01%p 수준 벗어남), 정제수(순수 물,
// CAS 7732-18-5, 구성성분 미등록) 원료가 있으면 그 원료의 %Raw Ingredient in Formula가 나머지
// 반올림 오차를 전부 흡수하도록 조정한다 - 실측 수분율 기준값과 아주 약간 달라질 수 있음을 감수하고,
// 대신 표의 모든 숫자가 짧고 깔끔하게 보이면서 합계는 항상 100%에 최대한 가깝게 맞는다.
// 물/비물이 섞인 복합원료(예: 폴리머 수용액)는 이 반올림 대상에서 제외한다 - 그 원료의 Final %는
// c._dryFinalPercent(건조 시 물/비물이 각각 다르게 변하는 실측값)를 그대로 쓰고, input은 표시만
// 반올림한다(그 원료 자체의 finalPercent 합계는 반올림 전 input과 정확히 같으므로 왜곡되지 않는다).
export function buildComplexGroupedRows(
  lines: any[],
  components: any[],
  materialsByRawCode?: Map<string, any>,
  basis: DocBasis = "MIX"
): ComplexGroupedRow[] {
  const map = byRawComponents(components);

  const byRawCode = new Map<string, any[]>();
  lines.forEach((line, i) => {
    // raw_code가 없는 라인은 서로 합쳐지지 않도록 라인마다 고유한 키를 준다.
    const key = line.raw_code || `__no_raw_code_${i}`;
    const arr = byRawCode.get(key) || [];
    arr.push(line);
    byRawCode.set(key, arr);
  });

  type Raw = ComplexGroupedRow & { isPureWater: boolean };

  const raw: Raw[] = Array.from(byRawCode.values()).map((group) => {
    const first = group[0];
    const comps = map.get(first.raw_code) || [];
    const input = group.reduce((sum, l) => sum + n(l.percentage), 0);
    const material = materialsByRawCode?.get(first.raw_code);
    const isPureWater = comps.length === 0 && (material?.cas_no || first.cas_no || "").trim() === WATER_CAS_NO;
    const allItems: ComplexGroupedItem[] = comps.length
      ? comps.map((c) => {
          const ratio = n(c.composition_percent);
          // ratio는 항상 원료관리 등록값 그대로(건조 후에도 안 바뀜). Final %는 물/비물이 섞여
          // 건조 시 서로 다른 비율로 변하는 원료(c._dryFinalPercent 존재)만 그 실측값을 그대로 쓰고,
          // 그 외에는 input×ratio로 계산한다(아래에서 input이 반올림된 뒤 다시 계산됨).
          const finalPercent = c._dryFinalPercent != null ? c._dryFinalPercent : (input * ratio) / 100;
          const exactFinalPercent = c._dryFinalPercent != null
            ? undefined
            : exactDivideByPow10(exactMultiply(toExactDecimal(input), toExactDecimal(ratio)), 2);
          return {
            inci_en: c.inci_en || c.component_name_en || "",
            inci_kr: c.inci_kr || c.component_name_kr || "",
            ratio,
            cas: c.cas_no || "-",
            finalPercent,
            exactFinalPercent,
            is_allergen: !!c.is_allergen,
            allergen_id: c.allergen_id || null,
          };
        })
      : [
          {
            inci_en: first.inci_en || first.raw_name || "",
            inci_kr: first.inci_kr || first.raw_name || "",
            ratio: null,
            cas: first.cas_no || "-",
            finalPercent: input, // 단일원료(구성성분 미등록): 원료 비율 자체가 곧 이 성분의 최종 함량
            exactFinalPercent: toExactDecimal(input),
          },
        ];

    // 향료처럼 원료 자체(예: composition_percent=100인 "Fragrance/Parfum" 자기 자신 항목)와 그 안에
    // 등록된 알러젠 구성성분이 함께 등록된 경우, 알러젠은 그 100% 안에 이미 포함된 하위 성분이라
    // items에 그대로 두면 원료 자신의 몫과 중복 집계되어 전체 합계가 100%를 넘는다(실측 확인:
    // Final % in Formula 합계가 100.00014842%처럼 알러젠 총합만큼 초과). 알러젠은 items에서 분리해
    // allergenItems로 따로 담아 Final % 합계·자릿수 계산에서 제외하고, 등록된 구성성분이 전부
    // 알러젠뿐이라 남는 기본 항목이 없으면(향료 자체 항목 없이 알러젠만 등록된 경우) 원료 고유값
    // (input) 전체를 나타내는 항목 1개를 대신 채워 넣어 그 원료의 총 투입량이 표에서 누락되지 않게 한다.
    const allergenItems = allItems.filter((it) => it.is_allergen && it.allergen_id);
    let items = allItems.filter((it) => !(it.is_allergen && it.allergen_id));
    if (items.length === 0 && allItems.length > 0) {
      items = [
        {
          inci_en: first.inci_en || first.raw_name || "",
          inci_kr: first.inci_kr || first.raw_name || "",
          ratio: null,
          cas: first.cas_no || "-",
          finalPercent: input,
          exactFinalPercent: toExactDecimal(input),
        },
      ];
    }

    // 복합성분표 Function 컬럼: 원료관리(plm_raw_materials)에 등록된 원료 자체의 효능(영문)만 쓴다.
    // 국문 효능이나 BOM 라인 스냅샷 값은 참조하지 않는다(영문 표준 용어만 필요하다는 요청에 따른 것).
    const func = material?.function_en || "";
    return { raw_code: first.raw_code, raw_name: first.raw_name, input, func, items, allergenItems, isPureWater };
  });

  // %Raw Ingredient in Formula를 소수 2자리로 반올림 - 정제수(순수 물) 원료를 제외한 나머지 전부.
  // MIX(배합 시)는 사용자가 직접 입력한 값 그대로라 반올림하지 않는다(건조 후 계산에서만 적용).
  if (basis === "DRY") {
    const pureWater = raw.find((r) => r.isPureWater);
    let residual = 0;
    for (const r of raw) {
      if (r === pureWater) continue;
      const rounded = Number(r.input.toFixed(2));
      residual += r.input - rounded;
      r.input = rounded;
      // 단순 단일원료(구성성분 미등록, ratio=null)는 input이 곧 Final %이므로 함께 갱신한다.
      // 복합원료(구성성분 등록됨)는 items의 finalPercent를 그대로 두어(물/비물 실측값 또는 등록
      // ratio 기반 계산 결과) 왜곡하지 않는다.
      if (r.items.length === 1 && r.items[0].ratio === null) {
        r.items[0].finalPercent = rounded;
      }
    }
    // 정제수 원료가 있으면 나머지 반올림 오차를 전부 흡수해서 합계가 100%에 최대한 가깝게 맞도록 한다.
    if (pureWater) {
      const rounded = Number((pureWater.input + residual).toFixed(2));
      pureWater.input = rounded;
      pureWater.items[0].finalPercent = rounded;
    }
  }

  return raw
    .map(({ isPureWater: _isPureWater, ...rest }) => rest)
    .sort((a, b) => b.input - a.input);
}

// 이 raw_code가 현재(formula_code, revision) 이외의 다른 BOM 라인에도 등장한 적이 있는지 일괄 확인.
// "회사에서 한 번도 쓰인 적 없는 원료(=이번이 첫 발주)"인지 판단하는 근거로 쓴다 - plm_raw_materials의
// 등록일(created_at)은 실제 사용 이력과 무관할 수 있어 신뢰하지 않고, plm_formula_lines 실사용 이력을 직접 본다.
export async function checkRawCodesUsedElsewhere(
  rawCodes: string[],
  excludeFormulaCode: string,
  excludeRevision: string
): Promise<Set<string>> {
  const codes = Array.from(new Set(rawCodes.filter(Boolean)));
  if (codes.length === 0) return new Set();

  const { data, error } = await supabaseProductionFinal
    .from("plm_formula_lines")
    .select("raw_code, formula_code, revision")
    .in("raw_code", codes);
  if (error) throw error;

  const usedElsewhere = new Set<string>();
  for (const row of data || []) {
    if (row.formula_code === excludeFormulaCode && row.revision === excludeRevision) continue;
    usedElsewhere.add(row.raw_code);
  }
  return usedElsewhere;
}

export type OrderSheetRow = {
  raw_code: string;
  raw_name: string;
  percent: number;
  supplier: string;
  isNew: boolean;
  email?: string;
  phone?: string;
};

// 원료발주가처방 표 데이터 계산: buildComplexGroupedRows()로 raw_code 그룹핑/합산/내림차순 정렬을
// 그대로 재사용하고(새 로직 작성 없음), 원료명·공급사는 plm_raw_materials에서, 신규 여부는
// plm_formula_lines 실사용 이력에서 채운다. 미리보기 팝업이 이 결과를 초기값으로 보여주고,
// 사용자가 신규체크/담당자를 확정한 뒤에만 실제 문서가 생성된다.
// BOM 편집에서 수동으로 "신규" 체크한 라인(is_new_material)이 있으면, 실사용 이력 기반 자동판정과
// 무관하게 항상 신규로 표시한다(OR 결합) - 담당자가 수기로 표기한 값을 자동판정이 덮어쓰지 않도록.
export async function computeOrderSheetRows(formula: any, lines: any[]): Promise<OrderSheetRow[]> {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const grouped = buildComplexGroupedRows(lines, components).filter((g) => g.raw_code);
  const codes = grouped.map((g) => g.raw_code as string);
  const manuallyFlaggedNew = new Set(lines.filter((l) => l.is_new_material).map((l) => l.raw_code));

  const [materials, usedElsewhere] = await Promise.all([
    fetchRawMaterialsByCodes(codes),
    checkRawCodesUsedElsewhere(codes, formula.formula_code, formula.revision),
  ]);
  const materialByCode = new Map(materials.map((m) => [m.raw_code, m]));

  return grouped.map((g) => {
    const m = materialByCode.get(g.raw_code as string);
    return {
      raw_code: g.raw_code as string,
      raw_name: m?.raw_name || g.raw_name || "",
      percent: g.input,
      supplier: m?.supplier || "",
      isNew: manuallyFlaggedNew.has(g.raw_code as string) || !usedElsewhere.has(g.raw_code as string),
      email: m?.email || "",
      phone: m?.phone || "",
    };
  });
}

// Final % in Formula(배합 시 한정) 자릿수 - 기본 8자리를 유지하되, 어떤 성분이든 exactFinalPercent가
// 8자리에서 끝나지 않으면(예: 0.001234567%처럼 더 잘게 나뉘는 원료) 그 값이 정확히 끝나는 자리까지
// 표 전체 자릿수를 함께 늘려서 잘림 없이 보여준다(최대 15자리).
export function computeUniformFinalPercentDecimals(grouped: ComplexGroupedRow[], minDecimals = 8, maxDecimals = 15) {
  let maxNeeded = minDecimals;
  for (const g of grouped) {
    for (const x of g.items) {
      if (!x.exactFinalPercent) continue;
      maxNeeded = Math.max(maxNeeded, minimalScale(x.exactFinalPercent, maxDecimals));
    }
  }
  return Math.min(maxNeeded, maxDecimals);
}

// ============================================================
// 복합성분표 (KOVAS): 원료 한 줄에 구성성분 묶음 + 셀 내 줄바꿈
// ============================================================
export async function buildComplexComponentTableHtml(f: any, lines: any[], basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const { lines: effectiveLines, components } = await resolveLinesForBasis(f, lines, basis);
  const basisAlerts = await computeBasisAllergenAlerts(f, effectiveLines, components);
  const materials = await fetchRawMaterialsByCodes(effectiveLines.map((x) => x.raw_code));
  const materialsByRawCode = new Map(materials.map((m) => [m.raw_code, m]));
  const grouped = buildComplexGroupedRows(effectiveLines, components, materialsByRawCode, basis);
  const inputDecimals = basis === "DRY" ? 2 : 8;
  // 국문/영문 중 선택된 쪽만 컬럼으로 넣는다 - No. + (선택된 언어 컬럼 수) + %Sub Ingredient in Raw Ingredient...
  const langColCount = lang === "BOTH" ? 2 : 1;
  const langHeaders = [
    lang !== "KR" ? "<th>EU/USA INCI name</th>" : "",
    lang !== "EN" ? "<th>국문명</th>" : "",
  ].join("");
  // 건조 후(DRY)는 나눗셈이 섞여 대부분 딱 안 끝나므로 기존처럼 8자리 고정 반올림을 유지하고,
  // 배합 시(MIX)/공개처방(일반, PUBLIC)만 정확히 끝나는 자리까지 동적으로 늘린다.
  const finalPercentDecimals = basis !== "DRY" ? computeUniformFinalPercentDecimals(grouped) : 8;

  const body = grouped
    .map((g, i) => {
      const en = eLines(g.items.map((x) => x.inci_en));
      const kr = eLines(g.items.map((x) => x.inci_kr));
      const ratio =
        g.items.length === 1 && g.items[0].ratio === null
          ? "-"
          : eLines(g.items.map((x) => fixedPct(x.ratio, 8)));
      const finalPercent = eLines(
        g.items.map((x) =>
          basis !== "DRY" && x.exactFinalPercent
            ? exactDecimalToString(x.exactFinalPercent, finalPercentDecimals)
            : fixedPct(x.finalPercent, finalPercentDecimals)
        )
      );
      const cas = eLines(g.items.map((x) => x.cas));
      const langCells = [
        lang !== "KR" ? `<td>${en}</td>` : "",
        lang !== "EN" ? `<td>${kr}</td>` : "",
      ].join("");
      const mainRow = `<tr>
  <td class="center">${i + 1}</td>
  ${langCells}
  <td class="center">${ratio}</td>
  <td class="center">${fixedPct(g.input, inputDecimals)}</td>
  <td class="center">${finalPercent}</td>
  <td>${cas}</td>
  <td style="vertical-align:middle">${e(g.func)}</td>
</tr>`;

      // 알러젠 구성성분(향료 등의 자기 100% 안에 이미 포함된 하위 성분)은 위 원료 자체 행과 중복
      // 집계되지 않도록 별도 행으로 분리해서 보여준다. Final %는 계산/표시하지 않고(실제 표시기준
      // 계산 결과는 하단 "표시대상 성분" 표를 참고), No. 칸은 일련번호 대신 각주 "3)"으로 통일해서
      // 이 행이 일반 배합 성분이 아니라 알러젠 표시 목적으로 참고 노출된 행임을 바로 알 수 있게 한다.
      const allergenRow = g.allergenItems.length
        ? `<tr style="background:#fffbeb">
  <td class="center">3)</td>
  ${[
    lang !== "KR" ? `<td>${eLines(g.allergenItems.map((x) => x.inci_en))}</td>` : "",
    lang !== "EN" ? `<td>${eLines(g.allergenItems.map((x) => x.inci_kr))}</td>` : "",
  ].join("")}
  <td class="center">${eLines(g.allergenItems.map((x) => fixedPct(x.ratio, 8)))}</td>
  <td class="center">-</td>
  <td class="center">-</td>
  <td>${eLines(g.allergenItems.map((x) => x.cas))}</td>
  <td style="vertical-align:middle">-</td>
</tr>`
        : "";

      return mainRow + allergenRow;
    })
    .join("");

  // %Raw Ingredient in Formula 합계 - 원료별 투입 비율(g.input)을 그대로 더한 값이라, 향료 안의
  // 알러젠처럼 한 원료 안에 중첩 표기된 성분이 있어도 이중 집계되지 않는다. 건조 후 기준으로
  // 전체 배합이 실제로 100%에 맞는지 buyer가 한눈에 확인할 수 있게 한다.
  const totalInput = grouped.reduce((sum, g) => sum + g.input, 0);
  // Final % in Formula 합계도 함께 노출 - 모든 구성성분(중첩 없이 개별 항목 그대로)을 더한 값이라
  // %Raw Ingredient in Formula 합계와 마찬가지로 100%에 최대한 가깝게 맞는지 바로 검산할 수 있다.
  // 배합 시(MIX)는 BigInt 정확 덧셈으로 더해 부동소수점 오차 없이 합산한다.
  const totalFinalPercentDisplay =
    basis !== "DRY"
      ? exactDecimalToString(
          grouped.reduce(
            (acc, g) => g.items.reduce((a, x) => (x.exactFinalPercent ? exactAdd(a, x.exactFinalPercent) : a), acc),
            toExactDecimal(0)
          ),
          finalPercentDecimals
        )
      : fixedPct(
          grouped.reduce((sum, g) => sum + g.items.reduce((s, x) => s + x.finalPercent, 0), 0),
          finalPercentDecimals
        );
  const totalRow = grouped.length
    ? `<tr style="font-weight:800;background:#f8fafc">
  <td colspan="${2 + langColCount}" class="right">합계 (Total)</td>
  <td class="center">${fixedPct(totalInput, inputDecimals)}</td>
  <td class="center">${totalFinalPercentDisplay}</td>
  <td colspan="2"></td>
</tr>`
    : "";

  return baseHtml(`Ingredient List for Development${basisTitleSuffix(basis)}`, kovasMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th>${langHeaders}
  <th>% Sub Ingredient in Raw Ingredient</th><th>%Raw Ingredient in Formula</th><th>Final % in Formula</th><th>CAS No.</th><th>Function</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="${6 + langColCount}">복합원료 구성성분 데이터가 없습니다. 원료관리에서 구성성분을 먼저 등록하세요.</td></tr>`}${totalRow}</tbody>
</table>`, f, basisAlerts);
}

// ============================================================
// 단일성분표 (KOVAS): INCI 합산, 함량 내림차순
// ============================================================
export async function buildSingleComponentTableHtml(f: any, lines: any[], basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const { lines: effectiveLines, components } = await resolveLinesForBasis(f, lines, basis);
  const basisAlerts = await computeBasisAllergenAlerts(f, effectiveLines, components);
  const functionLookup = buildIngredientFunctionLookup(await fetchIngredientFunctionEntries());
  const langColCount = lang === "BOTH" ? 2 : 1;
  const langHeaders = [
    lang !== "KR" ? "<th>EU/USA INCI name</th>" : "",
    lang !== "EN" ? "<th>국문명</th>" : "",
  ].join("");
  // 복합 전개 + 단일을 모두 합산해 INCI 단위 단일성분표 생성
  const rows = mergeRows([...complexRows(effectiveLines, components, functionLookup), ...singleRows(effectiveLines, components, functionLookup)]);
  // Percentage(%) 표시 자릿수:
  // - 배합 시(MIX)는 입력값들의 곱셈만으로 계산되어 항상 "정확히 끝나는" 소수이므로, 그 자리까지
  //   보여주는 BigInt 기반 정확 표시(exactPercent, 최소 14~최대 15자리)를 그대로 쓴다.
  // - 건조 후(DRY)는 계산 과정에 나눗셈(scale_factor, 수분 비례 배분)이 들어가서 대부분 딱 떨어지지
  //   않는 소수가 나온다. 이 경우 exactPercent 기반 자릿수를 그대로 쓰면 76.951399116347567처럼
  //   의미 없는 긴 소수가 나열되므로, 일반 반올림으로 8자리에 고정해서 깔끔하게 보여준다.
  // 알러젠(향료 등의 100% 자체 항목 안에 이미 포함된 하위 성분)은 별도 계산 없이 참고용으로만
  // 목록에 남기고, 합계·자릿수 계산에서는 제외한다(복합성분표와 동일한 이유 - 향료 자신의 몫과
  // 중복 집계되지 않게 하기 위함). 실제 함량은 하단 "표시대상 성분" 표에서 이미 확인 가능하다.
  const isAllergenRow = (x: ExpandedRow) => !!(x.is_allergen && x.allergen_id);
  const totalRows = rows.filter((x) => !isAllergenRow(x));
  const decimals = basis === "DRY" ? 8 : computeUniformPercentDecimals(totalRows);

  const body = rows
    .map((x, i) => {
      const langCells = [
        lang !== "KR" ? `<td>${e(x.inci_en)}</td>` : "",
        lang !== "EN" ? `<td>${e(x.inci_kr)}</td>` : "",
      ].join("");
      const allergen = isAllergenRow(x);
      const percentCell = allergen
        ? "-"
        : e(basis === "DRY" ? fixedPct(x.final_percent, decimals) : (x.exactPercent ? exactDecimalToString(x.exactPercent, decimals) : fixedPct(x.final_percent, decimals)));
      return `<tr>
  <td class="center">${allergen ? "3)" : i + 1}</td>
  ${langCells}
  <td class="right">${percentCell}</td>
  <td>${e(x.cas_no || "-")}</td>
  <td>${e(x.ec_no || "-")}</td>
  <td>${e(x.function_text)}</td>
</tr>`;
    })
    .join("");

  // 합계(Total) 행 - 복합성분표와 동일하게 배합 시(MIX)는 BigInt 정확 덧셈, 건조 후(DRY)는 반올림된
  // final_percent를 그대로 더한다. 알러젠 행은 위에서 이미 제외했으므로 100%에 정확히 맞는다.
  const totalDisplay =
    basis !== "DRY"
      ? exactDecimalToString(
          totalRows.reduce((acc, x) => exactAdd(acc, x.exactPercent || toExactDecimal(x.final_percent)), toExactDecimal(0)),
          decimals
        )
      : fixedPct(totalRows.reduce((sum, x) => sum + x.final_percent, 0), decimals);
  const totalRow = rows.length
    ? `<tr style="font-weight:800;background:#f8fafc">
  <td colspan="${1 + langColCount}" class="right">합계 (Total)</td>
  <td class="right">${totalDisplay}</td>
  <td colspan="3"></td>
</tr>`
    : "";

  return baseHtml(`Ingredient List (Single)${basisTitleSuffix(basis)}`, kovasMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th>${langHeaders}
  <th>Percentage(%)</th><th>CAS No.</th><th>EC No.</th><th>Function</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="${5 + langColCount}">단일성분 데이터가 없습니다.</td></tr>`}${totalRow}</tbody>
</table>`, f, basisAlerts);
}

// ============================================================
// 전성분표 (KOVAS): 박스 형태 (영문 / 국문)
// ============================================================
export async function buildInciListHtml(f: any, lines: any[], basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const { lines: effectiveLines, components } = await resolveLinesForBasis(f, lines, basis);
  // 단일성분표와 동일한 순서를 보장하기 위해 mergeRows() 결과(함량 내림차순)를 그대로 사용
  const rows = mergeRows([...complexRows(effectiveLines, components), ...singleRows(effectiveLines, components)]);

  // 이 basis 기준으로 실제 표시기준(Leave-on 0.001% / Rinse-off 0.01%) 미만인 알러젠은 "표시대상
  // 성분" 표뿐 아니라 전성분/국문전성분 이름 목록 자체에서도 제외한다 - 표시 의무가 없는 성분을
  // 전성분표에 이름으로 노출할 이유가 없기 때문(사용자 확인 요청 사항).
  const basisAlerts = await computeBasisAllergenAlerts(f, effectiveLines, components);
  const suppressedAllergenIds = new Set(
    (basisAlerts || []).filter((a) => !a.label_required).map((a) => a.allergen_id)
  );
  const visibleRows = rows.filter(
    (r) => !(r.is_allergen && r.allergen_id && suppressedAllergenIds.has(r.allergen_id))
  );

  const inciEn = visibleRows.map((x) => x.inci_en).filter(Boolean).join(", ");
  const inciKr = visibleRows.map((x) => x.inci_kr).filter(Boolean).join(", ");

  const enBox = lang !== "KR" ? `<div class="box">
  <div class="bt">Ingredient list</div>
  <div class="bb">${e(inciEn || "-")}</div>
</div>` : "";
  const krBox = lang !== "EN" ? `<div class="box">
  <div class="bt">국문전성분</div>
  <div class="bb">${e(inciKr || "-")}</div>
</div>` : "";

  return baseHtml(`Ingredient List for Development${basisTitleSuffix(basis)}`, kovasMeta(f), `${enBox}${krBox}`, f, basisAlerts);
}

// ============================================================
// 원료발주가처방: 미리보기 팝업에서 확정된 rows/담당자를 그대로 받아 렌더링만 한다
// (계산은 computeOrderSheetRows()에서 이미 끝난 상태 - buildComplexGroupedRows() 재사용)
// ============================================================
export async function buildRawMaterialOrderSheetHtml(f: any, rows: OrderSheetRow[], personInCharge: string) {
  // 이메일/전화번호는 신규 체크된 원료에 한해서만 노출한다 - 기존에 발주 이력이 있는 원료는
  // 담당자가 이미 공급사 연락처를 알고 있으므로 문서를 불필요하게 채우지 않는다.
  const body = rows
    .map(
      (r, i) => `<tr>
  <td class="center">${i + 1}</td>
  <td>${e(r.raw_code)}</td>
  <td>${e(r.raw_name)}</td>
  <td class="right">${pct(r.percent)}</td>
  <td class="center">${r.isNew ? "☑" : "☐"}</td>
  <td>${e(r.supplier || "-")}</td>
  <td>${r.isNew ? e(r.email || "-") : ""}</td>
  <td>${r.isNew ? e(r.phone || "-") : ""}</td>
  <td>${e(personInCharge || "-")}</td>
</tr>`
    )
    .join("");

  return baseHtml("원료발주가처방", orderSheetMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th><th>원료코드</th><th>원료명</th><th>함량(%)</th><th>신규 체크</th><th>공급사</th><th>이메일</th><th>전화번호</th><th>연구 담당자</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="9">BOM 데이터가 없습니다.</td></tr>`}</tbody>
</table>`, f);
}

export const DOC_KIND_NAMES: Record<DocKind, string> = {
  INCI_LIST: "전성분표",
  COMPLEX_COMPONENT_TABLE: "복합성분표",
  SINGLE_COMPONENT_TABLE: "단일성분표",
  RAW_MATERIAL_ORDER_SHEET: "원료발주가처방",
};

async function buildDocumentHtml(formula: any, kind: DocKind, lines: any[], basis: DocBasis, lang: DocLang) {
  if (kind === "INCI_LIST") return buildInciListHtml(formula, lines, basis, lang);
  if (kind === "COMPLEX_COMPONENT_TABLE") return buildComplexComponentTableHtml(formula, lines, basis, lang);
  return buildSingleComponentTableHtml(formula, lines, basis, lang);
}

export async function createFormulaDocument(formula: any, kind: DocKind, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const html = await buildDocumentHtml(formula, kind, lines, basis, lang);
  const documentCode = `${kind}-${formula.formula_code}-${formula.revision}-${basis}-${lang}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: kind,
      basis,
      lang,
      title: `${formula.formula_name} ${DOC_KIND_NAMES[kind]}${basisTitleSuffix(basis)}`,
      status: "CREATED",
      payload_json: { formula, lines, basis, lang },
      html_content: html,
      created_by: "KOVAS Template Docs",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// 기존 문서 row를 그대로 UPDATE (새 row를 insert하지 않아 목록에 중복이 쌓이지 않음)
export async function regenerateFormulaDocument(existingDoc: any, formula: any, kind: DocKind, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const html = await buildDocumentHtml(formula, kind, lines, basis, lang);

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .update({
      title: `${formula.formula_name} ${DOC_KIND_NAMES[kind]}${basisTitleSuffix(basis)}`,
      lang,
      payload_json: { formula, lines, basis, lang },
      html_content: html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingDoc.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// 원료발주가처방은 미리보기 팝업에서 확정한 rows/담당자가 있어야 생성 가능하므로,
// (formula, kind)만 받는 공용 buildDocumentHtml/createFormulaDocument 경로를 타지 않고 전용 함수로 분리한다.
export async function createRawMaterialOrderSheetDocument(formula: any, rows: OrderSheetRow[], personInCharge: string) {
  const html = await buildRawMaterialOrderSheetHtml(formula, rows, personInCharge);
  const documentCode = `RAW_MATERIAL_ORDER_SHEET-${formula.formula_code}-${formula.revision}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: "RAW_MATERIAL_ORDER_SHEET",
      title: `${formula.formula_name} ${DOC_KIND_NAMES.RAW_MATERIAL_ORDER_SHEET}`,
      status: "CREATED",
      payload_json: { formula, rows, personInCharge },
      html_content: html,
      created_by: "KOVAS Template Docs",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function regenerateRawMaterialOrderSheetDocument(existingDoc: any, formula: any, rows: OrderSheetRow[], personInCharge: string) {
  const html = await buildRawMaterialOrderSheetHtml(formula, rows, personInCharge);

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .update({
      title: `${formula.formula_name} ${DOC_KIND_NAMES.RAW_MATERIAL_ORDER_SHEET}`,
      payload_json: { formula, rows, personInCharge },
      html_content: html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingDoc.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function downloadHtmlDocument(doc: any) {
  const blob = new Blob([doc.html_content || ""], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `${doc.document_code || "plm-document"}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openPrintDocument(doc: any) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("팝업이 차단되었습니다.");
  win.document.open();
  win.document.write(doc.html_content || "");
  win.document.close();
}
