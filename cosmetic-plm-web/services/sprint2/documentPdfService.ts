"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type DocKind =
  | "FORMULA_SHEET_PDF"
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
  return data || [];
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

function pct(v: any) {
  const num = Number(v || 0);
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(6)));
}

// ============================================================
// KOVAS 양식 공통 스타일 (줄바꿈 셀 + 박스 + 각주/기밀문구)
// ============================================================
const CONFIDENTIAL =
  "본 문서는 지정된 수신인만을 위한 것이며 영업비밀·기밀정보를 포함할 수 있습니다. 무단 공개·배포·복사를 금합니다.";
const NOTES = [
  "1) Raw material manufacturers can be changed without advance notice if it does not affect product functions.",
  "2) Viscosity and pH-related raw materials can be adjusted.",
  "3) Allergen Labeling: Leave-on ≥ 0.001% / Rinse-off ≥ 0.01%",
];

function baseHtml(title: string, headerMeta: Record<string, string>, body: string) {
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
.doccode{margin-top:18px;font-size:10px;color:#334155}
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
<div class="confidential">${e(CONFIDENTIAL)}</div>
<div class="doccode">KVSP-738(4)-05 Ingredient list</div>
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

function kovasMeta(f: any) {
  return {
    "Frame formulation number": f.formula_code ?? "",
    "No.": f.revision ?? "",
    Date: new Date().toLocaleDateString("ko-KR"),
    Manufacturer: f.manufacturer ?? "뉴트리어드바이저",
    Customer: f.customer ?? "",
    "Kovas no": f.kovas_no ?? "",
    "Product name acc. To package": f.formula_name ?? "",
  };
}

type ExpandedRow = {
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
};

function byRawComponents(components: any[]) {
  const map = new Map<string, any[]>();
  for (const c of components) {
    const arr = map.get(c.raw_code) || [];
    arr.push(c);
    map.set(c.raw_code, arr);
  }
  return map;
}

function complexRows(lines: any[], components: any[]): ExpandedRow[] {
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
      });
    }
  }

  return rows.sort((a, b) => b.final_percent - a.final_percent);
}

function singleRows(lines: any[], components: any[]): ExpandedRow[] {
  const complexRawCodes = new Set(components.map((c) => c.raw_code));
  return lines
    .filter((line) => !complexRawCodes.has(line.raw_code))
    .map((line) => ({
      formula_code: line.formula_code,
      formula_name: line.formula_name,
      inci_en: line.inci_en || line.raw_name || "",
      inci_kr: line.inci_kr || line.raw_name || "",
      final_percent: n(line.percentage),
      cas_no: line.cas_no || "",
      ec_no: line.ec_no || "",
      function_text: line.function_kr || line.function_en || "",
    }))
    .sort((a, b) => b.final_percent - a.final_percent);
}

function mergeRows(rows: ExpandedRow[]) {
  const map = new Map<string, ExpandedRow>();
  for (const row of rows) {
    const key = [row.inci_en, row.inci_kr, row.cas_no, row.ec_no, row.function_text].join("|");
    const old = map.get(key);
    if (old) {
      old.final_percent = Number((old.final_percent + row.final_percent).toFixed(8));
    } else {
      map.set(key, { ...row });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.final_percent - a.final_percent);
}

// 전성분 정렬: 1%↑ 함량 내림차순 + 1%↓ 국문명 가나다순
function inciOrder(rows: ExpandedRow[]) {
  const high = rows.filter((r) => r.final_percent >= 1).sort((a, b) => b.final_percent - a.final_percent);
  const low = rows.filter((r) => r.final_percent < 1).sort((a, b) => a.inci_kr.localeCompare(b.inci_kr, "ko"));
  return [...high, ...low];
}

// ============================================================
// Formula Sheet (기존 유지, 헤더만 KOVAS 메타 사용)
// ============================================================
export function buildFormulaSheetHtml(f: any, lines: any[]) {
  const total = Number(lines.reduce((s, x) => s + n(x.percentage), 0).toFixed(4));
  const rows = lines
    .map(
      (x) => `<tr>
<td class="center">${e(x.line_no)}</td><td>${e(x.phase)}</td><td>${e(x.raw_code)}</td><td>${e(x.raw_name)}</td>
<td>${e(x.inci_kr || x.inci_en || "")}</td><td class="right">${e(x.percentage)}%</td><td>${e(x.function_kr || x.function_en || "")}</td>
</tr>`
    )
    .join("");

  return baseHtml("Formula Sheet", kovasMeta(f), `
<table class="grid">
<thead><tr><th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>INCI</th><th>함량</th><th>기능</th></tr></thead>
<tbody>${rows || `<tr><td colspan="7">BOM 없음</td></tr>`}</tbody>
</table>
<div style="text-align:right;font-weight:700;margin-top:6px;font-size:12px">총합: ${total}%</div>`);
}

// ============================================================
// 복합성분표 (KOVAS): 원료 한 줄에 구성성분 묶음 + 셀 내 줄바꿈
// ============================================================
export async function buildComplexComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const map = byRawComponents(components);

  // 원료(투입물) 단위로 묶기. 복합원료는 구성성분 여러 개, 단일원료는 자기 자신 1개.
  const grouped = lines
    .map((line) => {
      const comps = map.get(line.raw_code) || [];
      const items = comps.length
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
              ratio: null as number | null, // 단일원료는 '-'
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

  const body = grouped
    .map((g, i) => {
      const en = eLines(g.items.map((x) => x.inci_en));
      const kr = eLines(g.items.map((x) => x.inci_kr));
      const ratio =
        g.items.length === 1 && g.items[0].ratio === null
          ? "-"
          : eLines(g.items.map((x) => pct(x.ratio)));
      const cas = eLines(g.items.map((x) => x.cas));
      return `<tr>
  <td class="center">${i + 1}</td>
  <td>${en}</td>
  <td>${kr}</td>
  <td class="center">${ratio}</td>
  <td class="center">${pct(g.input)}</td>
  <td>${cas}</td>
  <td>${e(g.func)}</td>
</tr>`;
    })
    .join("");

  return baseHtml("Ingredient List for Development", kovasMeta(f), `
<table class="grid">
<thead><tr>
  <th>No.</th><th>EU/USA INCI name</th><th>국문명</th>
  <th>구성비(%)</th><th>최종함량(%)</th><th>CAS No.</th><th>Function</th>
</tr></thead>
<tbody>${body || `<tr><td colspan="7">복합원료 구성성분 데이터가 없습니다. 원료관리에서 구성성분을 먼저 등록하세요.</td></tr>`}</tbody>
</table>`);
}

// ============================================================
// 단일성분표 (KOVAS): INCI 합산, 함량 내림차순
// ============================================================
export async function buildSingleComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  // 복합 전개 + 단일을 모두 합산해 INCI 단위 단일성분표 생성
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);

  const body = rows
    .map(
      (x, i) => `<tr>
  <td class="center">${i + 1}</td>
  <td>${e(x.inci_en)}</td>
  <td>${e(x.inci_kr)}</td>
  <td class="right">${pct(x.final_percent)}</td>
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
</table>`);
}

// ============================================================
// 전성분표 (KOVAS): 박스 형태 (영문 / 국문)
// ============================================================
export async function buildInciListHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const rows = inciOrder(mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]));
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
</div>`);
}

export async function createFormulaDocument(formula: any, kind: DocKind) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);

  let html = "";
  if (kind === "FORMULA_SHEET_PDF") html = buildFormulaSheetHtml(formula, lines);
  if (kind === "INCI_LIST") html = await buildInciListHtml(formula, lines);
  if (kind === "COMPLEX_COMPONENT_TABLE") html = await buildComplexComponentTableHtml(formula, lines);
  if (kind === "SINGLE_COMPONENT_TABLE") html = await buildSingleComponentTableHtml(formula, lines);

  const names: Record<DocKind, string> = {
    FORMULA_SHEET_PDF: "Formula Sheet",
    INCI_LIST: "전성분표",
    COMPLEX_COMPONENT_TABLE: "복합성분표",
    SINGLE_COMPONENT_TABLE: "단일성분표",
  };

  const documentCode = `${kind}-${formula.formula_code}-${formula.revision}-${Date.now().toString().slice(-6)}`;

  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .insert({
      document_code: documentCode,
      formula_code: formula.formula_code,
      revision: formula.revision,
      document_type: kind,
      title: `${formula.formula_name} ${names[kind]}`,
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

export const createFormulaSheetDocument = (formula: any) =>
  createFormulaDocument(formula, "FORMULA_SHEET_PDF");

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
