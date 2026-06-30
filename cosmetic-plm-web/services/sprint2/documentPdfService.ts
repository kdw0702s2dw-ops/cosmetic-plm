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

function n(v: any) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function pct(v: any) {
  const num = Number(v || 0);
  return Number.isInteger(num) ? String(num) : String(Number(num.toFixed(6)));
}

function baseHtml(title: string, body: string) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>${e(title)}</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,'Noto Sans KR',sans-serif}
.page{width:980px;margin:24px auto;background:white;padding:42px;border:1px solid #dbe3ef}
.header{display:flex;justify-content:space-between;border-bottom:4px solid #0f172a;padding-bottom:18px;margin-bottom:26px}
h1{font-size:28px;margin:0}.sub{color:#64748b;font-size:13px;line-height:1.6}
h2{font-size:18px;margin:28px 0 10px}table{width:100%;border-collapse:collapse}
th{background:#0f172a;color:white}th,td{border:1px solid #cbd5e1;padding:9px;font-size:12px;vertical-align:top}
.right{text-align:right}.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800}
@media print{body{background:white}.page{width:auto;margin:0;border:0}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
<div class="header">
  <div><h1>${e(title)}</h1><div class="sub">Cosmetic PLM Enterprise Document</div></div>
  <div class="sub">생성일: ${e(new Date().toLocaleString("ko-KR"))}</div>
</div>
${body}
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
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

export function buildFormulaSheetHtml(f: any, lines: any[]) {
  const total = Number(lines.reduce((s, x) => s + n(x.percentage), 0).toFixed(4));
  const rows = lines.map((x) => `<tr>
<td>${e(x.line_no)}</td><td>${e(x.phase)}</td><td>${e(x.raw_code)}</td><td>${e(x.raw_name)}</td>
<td>${e(x.inci_kr || x.inci_en || "")}</td><td class="right">${e(x.percentage)}%</td><td>${e(x.function_kr || x.function_en || "")}</td>
</tr>`).join("");

  return baseHtml("Formula Sheet", `
<h2>처방 기본정보</h2>
<table>
<tr><th>항목</th><th>내용</th></tr>
<tr><td>처방코드</td><td>${e(f.formula_code)}</td></tr>
<tr><td>Revision</td><td>${e(f.revision)}</td></tr>
<tr><td>처방명</td><td>${e(f.formula_name)}</td></tr>
<tr><td>총합</td><td>${total}%</td></tr>
</table>
<h2>BOM</h2>
<table>
<thead><tr><th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>INCI</th><th>함량</th><th>기능</th></tr></thead>
<tbody>${rows || `<tr><td colspan="7">BOM 없음</td></tr>`}</tbody>
</table>`);
}

export async function buildInciListHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  const inciKr = rows.map((x) => x.inci_kr).filter(Boolean).join(", ");
  const inciEn = rows.map((x) => x.inci_en).filter(Boolean).join(", ");

  return baseHtml("전성분표", `
<h2>${e(f.formula_name)} / ${e(f.formula_code)}-${e(f.revision)}</h2>
<table>
<thead><tr><th>전성분</th></tr></thead>
<tbody><tr><td>${e(inciKr || "-")}</td></tr></tbody>
</table>
<h2>영문 INCI List</h2>
<table>
<thead><tr><th>INCI</th></tr></thead>
<tbody><tr><td>${e(inciEn || "-")}</td></tr></tbody>
</table>`);
}

export async function buildComplexComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const rows = complexRows(lines, components);

  return baseHtml("복합성분표", `
<h2>${e(f.formula_name)} / ${e(f.formula_code)}-${e(f.revision)}</h2>
<table>
<thead>
<tr>
  <th>처방코드</th>
  <th>처방명</th>
  <th>원료코드</th>
  <th>원료명</th>
  <th>원료투입량(%)</th>
  <th>INCI</th>
  <th>국문명</th>
  <th>원료 내 구성비(%)</th>
  <th>최종함량(%)</th>
  <th>CAS No.</th>
  <th>EC No.</th>
  <th>기능</th>
</tr>
</thead>
<tbody>
${rows.map((x) => `<tr>
  <td>${e(f.formula_code)}</td>
  <td>${e(f.formula_name)}</td>
  <td>${e(x.raw_code)}</td>
  <td>${e(x.raw_name)}</td>
  <td class="right">${pct(x.raw_percent)}%</td>
  <td>${e(x.inci_en)}</td>
  <td>${e(x.inci_kr)}</td>
  <td class="right">${pct(x.component_percent)}%</td>
  <td class="right">${pct(x.final_percent)}%</td>
  <td>${e(x.cas_no)}</td>
  <td>${e(x.ec_no)}</td>
  <td>${e(x.function_text)}</td>
</tr>`).join("") || `<tr><td colspan="12">복합원료 구성성분 데이터가 없습니다. 원료관리에서 구성성분을 먼저 등록하세요.</td></tr>`}
</tbody>
</table>`);
}

export async function buildSingleComponentTableHtml(f: any, lines: any[]) {
  const components = await fetchComponentsByRawCodes(lines.map((x) => x.raw_code));
  const rows = mergeRows(singleRows(lines, components));

  return baseHtml("단일성분표", `
<h2>${e(f.formula_name)} / ${e(f.formula_code)}-${e(f.revision)}</h2>
<table>
<thead>
<tr>
  <th>INCI</th>
  <th>국문명</th>
  <th>CAS No.</th>
  <th>EC No.</th>
  <th>기능</th>
  <th>최종함량(%)</th>
</tr>
</thead>
<tbody>
${rows.map((x) => `<tr>
  <td>${e(x.inci_en)}</td>
  <td>${e(x.inci_kr)}</td>
  <td>${e(x.cas_no)}</td>
  <td>${e(x.ec_no)}</td>
  <td>${e(x.function_text)}</td>
  <td class="right">${pct(x.final_percent)}%</td>
</tr>`).join("") || `<tr><td colspan="6">단일성분 데이터가 없습니다.</td></tr>`}
</tbody>
</table>`);
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
      created_by: "Sprint 2-6 Template Based Docs",
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
