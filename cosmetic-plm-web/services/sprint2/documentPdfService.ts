"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { fetchAllergenAlerts } from "@/services/sprint2/allergenService";

export type DocKind =
  | "INCI_LIST"
  | "COMPLEX_COMPONENT_TABLE"
  | "SINGLE_COMPONENT_TABLE";

export async function fetchDocumentFormulas(keyword = "") {
  let q = supabaseProductionFinal
    .from("plm_formulas")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

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

export async function fetchPdfDocuments() {
  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .select("*")
    .in("document_type", [
      "FORMULA_SHEET_PDF",
      "INCI_LIST",
      "COMPLEX_COMPONENT_TABLE",
      "SINGLE_COMPONENT_TABLE",
    ])
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) throw error;
  const docs = data || [];

  // plm_documents -> plm_formulas FK가 없어서 formula_code로 별도 조회 후 바이어(customer)/처방명을 붙여줌
  const formulaCodes = Array.from(new Set(docs.map((d) => d.formula_code).filter(Boolean)));
  const metaByKey = new Map<string, { customer: string; formula_name: string }>();
  if (formulaCodes.length > 0) {
    const { data: formulas, error: formulaError } = await supabaseProductionFinal
      .from("plm_formulas")
      .select("formula_code, revision, customer, formula_name")
      .in("formula_code", formulaCodes);
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
  if (alerts.length === 0) {
    return `<p>${e(ALLERGEN_BASE_LINE)} (적용기준: ${e(label)})</p>
<p style="color:#64748b">표시 대상 알러젠 성분 없음</p>`;
  }

  const rows = alerts
    .map(
      (a) => `<tr>
<td>${e(a.allergen_name_kr || "-")} (${e(a.allergen_name_en)})</td>
<td class="right">${pct(a.formula_percent)}%</td>
<td class="center">${a.label_required ? "표시" : "미표시"}</td>
</tr>`
    )
    .join("");

  return `<p>${e(ALLERGEN_BASE_LINE)} (적용기준: ${e(label)})</p>
<table class="grid" style="margin-top:6px">
<thead><tr><th>표시대상 성분</th><th>최종함량(%)</th><th>표시여부</th></tr></thead>
<tbody>${rows}</tbody>
</table>`;
}

async function baseHtml(title: string, headerMeta: Record<string, string>, body: string, formula: any) {
  const alerts = await fetchAllergenAlerts(formula.formula_code, formula.revision).catch(() => []);
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

export function complexRows(lines: any[], components: any[]): ExpandedRow[] {
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
        final_percent: Number((n(line.percentage) * n(comp.composition_percent) / 100).toFixed(8)),
        cas_no: comp.cas_no || "",
        ec_no: comp.ec_no || "",
        function_text: comp.function_kr || comp.function_en || "",
        line_no: line.line_no,
        exactPercent: exactDivideByPow10(
          exactMultiply(toExactDecimal(n(line.percentage)), toExactDecimal(n(comp.composition_percent))),
          2
        ),
      });
    }
  }

  return rows.sort((a, b) => b.final_percent - a.final_percent);
}

export function singleRows(lines: any[], components: any[]): ExpandedRow[] {
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
      function_text: line.function_kr || line.function_en || "",
      line_no: line.line_no,
      exactPercent: toExactDecimal(n(line.percentage)),
    }))
    .sort((a, b) => b.final_percent - a.final_percent);
}

export function mergeRows(rows: ExpandedRow[]) {
  const map = new Map<string, ExpandedRow>();
  for (const row of rows) {
    const key = [row.inci_en, row.inci_kr, row.cas_no, row.ec_no, row.function_text].join("|");
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

// mergeRows() 결과(rows)에 대해 문서 전체에서 통일할 소수 자릿수를 구한다:
// 각 행의 "정확히 끝나는 자리"(minimalScale) 중 최댓값을, 최소 8자리~최대 15자리 사이로 clamp.
export function computeUniformPercentDecimals(rows: ExpandedRow[], minDecimals = 8, maxDecimals = 15) {
  let maxNeeded = minDecimals;
  for (const row of rows) {
    if (!row.exactPercent) continue;
    maxNeeded = Math.max(maxNeeded, minimalScale(row.exactPercent, maxDecimals));
  }
  return Math.min(maxNeeded, maxDecimals);
}

export type ComplexGroupedItem = { inci_en: string; inci_kr: string; ratio: number | null; cas: string };
export type ComplexGroupedRow = { raw_code?: string; raw_name?: string; input: number; func: string; items: ComplexGroupedItem[] };

// 원료(투입물) 단위로 묶기. 복합원료는 구성성분 여러 개, 단일원료는 자기 자신 1개(ratio는 '-' 표시용 null).
// PDF(복합성분표)와 엑셀 다운로드가 이 함수를 그대로 공유해서, 원료=1행/구성성분은 셀 내 줄바꿈이라는
// 동일한 레이아웃 규칙을 두 출력 형식에서 어긋나지 않게 유지한다.
export function buildComplexGroupedRows(lines: any[], components: any[]): ComplexGroupedRow[] {
  const map = byRawComponents(components);
  return lines
    .map((line) => {
      const comps = map.get(line.raw_code) || [];
      const items: ComplexGroupedItem[] = comps.length
        ? comps.map((c) => ({
            inci_en: c.inci_en || c.component_name_en || "",
            inci_kr: c.inci_kr || c.component_name_kr || "",
            ratio: n(c.composition_percent),
            cas: c.cas_no || "-",
          }))
        : [
            {
              inci_en: line.inci_en || line.raw_name || "",
              inci_kr: line.inci_kr || line.raw_name || "",
              ratio: null,
              cas: line.cas_no || "-",
            },
          ];
      return {
        raw_code: line.raw_code,
        raw_name: line.raw_name,
        input: n(line.percentage),
        func: line.function_kr || line.function_en || "",
        items,
      };
    })
    .sort((a, b) => b.input - a.input);
}

// ============================================================
// 복합성분표 (KOVAS): 원료 한 줄에 구성성분 묶음 + 셀 내 줄바꿈
// ============================================================
export async function buildComplexComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const grouped = buildComplexGroupedRows(lines, components);

  const body = grouped
    .map((g, i) => {
      const en = eLines(g.items.map((x) => x.inci_en));
      const kr = eLines(g.items.map((x) => x.inci_kr));
      const ratio =
        g.items.length === 1 && g.items[0].ratio === null
          ? "-"
          : eLines(g.items.map((x) => fixedPct(x.ratio, 4)));
      const cas = eLines(g.items.map((x) => x.cas));
      return `<tr>
  <td class="center">${i + 1}</td>
  <td>${en}</td>
  <td>${kr}</td>
  <td class="center">${ratio}</td>
  <td class="center">${fixedPct(g.input, 6)}</td>
  <td>${cas}</td>
  <td>${e(g.func)}</td>
</tr>`;
    })
    .join("");

  return baseHtml("Ingredient List for Development", kovasMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th><th>EU/USA INCI name</th><th>국문명</th>
  <th>% Sub Ingredient in Raw Ingredient</th><th>%Raw Ingredient in Formula</th><th>CAS No.</th><th>Function</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="7">복합원료 구성성분 데이터가 없습니다. 원료관리에서 구성성분을 먼저 등록하세요.</td></tr>`}</tbody>
</table>`, f);
}

// ============================================================
// 단일성분표 (KOVAS): INCI 합산, 함량 내림차순
// ============================================================
export async function buildSingleComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  // 복합 전개 + 단일을 모두 합산해 INCI 단위 단일성분표 생성
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  // Percentage(%): 문서 전체에서 "값이 정확히 끝나는" 최대 자릿수(8~15자리)로 통일해서 0-패딩 표시
  const decimals = computeUniformPercentDecimals(rows);

  const body = rows
    .map(
      (x, i) => `<tr>
  <td class="center">${i + 1}</td>
  <td>${e(x.inci_en)}</td>
  <td>${e(x.inci_kr)}</td>
  <td class="right">${e(x.exactPercent ? exactDecimalToString(x.exactPercent, decimals) : fixedPct(x.final_percent, decimals))}</td>
  <td>${e(x.cas_no || "-")}</td>
  <td>${e(x.ec_no || "-")}</td>
  <td>${e(x.function_text)}</td>
</tr>`
    )
    .join("");

  return baseHtml("Ingredient List (Single)", kovasMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th><th>EU/USA INCI name</th><th>국문명</th>
  <th>Percentage(%)</th><th>CAS No.</th><th>EC No.</th><th>Function</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="7">단일성분 데이터가 없습니다.</td></tr>`}</tbody>
</table>`, f);
}

// ============================================================
// 전성분표 (KOVAS): 박스 형태 (영문 / 국문)
// ============================================================
export async function buildInciListHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  // 단일성분표와 동일한 순서를 보장하기 위해 mergeRows() 결과(함량 내림차순)를 그대로 사용
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  const inciEn = rows.map((x) => x.inci_en).filter(Boolean).join(", ");
  const inciKr = rows.map((x) => x.inci_kr).filter(Boolean).join(", ");

  return baseHtml("Ingredient List for Development", kovasMeta(f), `
<div class="box">
  <div class="bt">Ingredient list</div>
  <div class="bb">${e(inciEn || "-")}</div>
</div>
<div class="box">
  <div class="bt">국문전성분</div>
  <div class="bb">${e(inciKr || "-")}</div>
</div>`, f);
}

export const DOC_KIND_NAMES: Record<DocKind, string> = {
  INCI_LIST: "전성분표",
  COMPLEX_COMPONENT_TABLE: "복합성분표",
  SINGLE_COMPONENT_TABLE: "단일성분표",
};

async function buildDocumentHtml(formula: any, kind: DocKind, lines: any[]) {
  if (kind === "INCI_LIST") return buildInciListHtml(formula, lines);
  if (kind === "COMPLEX_COMPONENT_TABLE") return buildComplexComponentTableHtml(formula, lines);
  return buildSingleComponentTableHtml(formula, lines);
}

export async function createFormulaDocument(formula: any, kind: DocKind) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const html = await buildDocumentHtml(formula, kind, lines);
  const documentCode = `${kind}-${formula.formula_code}-${formula.revision}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: kind,
      title: `${formula.formula_name} ${DOC_KIND_NAMES[kind]}`,
      status: "CREATED",
      payload_json: { formula, lines },
      html_content: html,
      created_by: "KOVAS Template Docs",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// 기존 문서 row를 그대로 UPDATE (새 row를 insert하지 않아 목록에 중복이 쌓이지 않음)
export async function regenerateFormulaDocument(existingDoc: any, formula: any, kind: DocKind) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const html = await buildDocumentHtml(formula, kind, lines);

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .update({
      title: `${formula.formula_name} ${DOC_KIND_NAMES[kind]}`,
      payload_json: { formula, lines },
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
