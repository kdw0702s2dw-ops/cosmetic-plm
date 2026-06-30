"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export async function fetchDocumentFormulas(keyword = "") {
  let q = supabaseProductionFinal.from("plm_formulas").select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(100);
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

export async function fetchPdfDocuments() {
  const { data, error } = await supabaseProductionFinal
    .from("plm_documents")
    .select("*")
    .eq("document_type", "FORMULA_SHEET_PDF")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

function e(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}

export function buildFormulaSheetHtml(formula: any, lines: any[]) {
  const total = Number(lines.reduce((s, x) => s + Number(x.percentage || 0), 0).toFixed(4));
  const cost = Number(lines.reduce((s, x) => s + Number(x.cost_per_kg || 0), 0).toFixed(4));
  const inci = lines.slice().sort((a,b)=>Number(b.percentage||0)-Number(a.percentage||0)).map(x=>x.inci_kr||x.inci_en||x.raw_name).filter(Boolean).join(", ");
  const rows = lines.map(x => `<tr><td>${e(x.line_no)}</td><td>${e(x.phase)}</td><td>${e(x.raw_code)}</td><td>${e(x.raw_name)}</td><td>${e(x.inci_kr||x.inci_en||"")}</td><td style="text-align:right">${e(x.percentage)}%</td><td>${e(x.function_kr||x.function_en||"")}</td><td style="text-align:right">${e(Number(x.cost_per_kg||0).toLocaleString())}</td></tr>`).join("");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"/><title>${e(formula.formula_name)} Formula Sheet</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,'Noto Sans KR',sans-serif}.page{width:980px;margin:24px auto;background:#fff;padding:42px;border:1px solid #dbe3ef}.header{display:flex;justify-content:space-between;border-bottom:4px solid #0f172a;padding-bottom:18px;margin-bottom:26px}h1{font-size:28px;margin:0}.sub{color:#64748b;font-size:13px;line-height:1.6}h2{font-size:18px;margin:28px 0 10px}table{width:100%;border-collapse:collapse}th{background:#0f172a;color:#fff}th,td{border:1px solid #cbd5e1;padding:9px;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.box{border:1px solid #cbd5e1;padding:12px;border-radius:10px}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.sign .box{height:90px}.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}@media print{body{background:#fff}.page{width:auto;margin:0;border:0}.no-print{display:none}}
</style></head><body><div class="page">
<div class="header"><div><h1>Formula Sheet</h1><div class="sub">Cosmetic PLM Enterprise Document</div></div><div class="sub">문서번호: ${e(`FS-${formula.formula_code}-${formula.revision}`)}<br/>생성일: ${e(new Date().toLocaleString("ko-KR"))}<br/>상태: ${e(formula.status||"DRAFT")}</div></div>
<h2>1. 처방 기본정보</h2><div class="grid"><div class="box"><b>처방코드</b><br/>${e(formula.formula_code)}</div><div class="box"><b>Revision</b><br/>${e(formula.revision)}</div><div class="box"><b>처방명</b><br/>${e(formula.formula_name)}</div><div class="box"><b>제품유형</b><br/>${e(formula.product_type||"-")}</div><div class="box"><b>고객사</b><br/>${e(formula.customer||"-")}</div><div class="box"><b>출시국가</b><br/>${e(formula.target_country||"-")}</div></div>
<h2>2. 처방 요약</h2><table><tr><th>항목</th><th>값</th></tr><tr><td>총합</td><td>${total}% ${total===100?"(정상)":"(확인 필요)"}</td></tr><tr><td>예상 원가</td><td>${cost.toLocaleString()} KRW/kg</td></tr><tr><td>원료 수</td><td>${lines.length}개</td></tr><tr><td>컨셉/클레임</td><td>${e(formula.claim||"-")}</td></tr></table>
<h2>3. BOM</h2><table><thead><tr><th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>INCI</th><th>함량</th><th>기능</th><th>원가</th></tr></thead><tbody>${rows||`<tr><td colspan="8">BOM 데이터가 없습니다.</td></tr>`}</tbody></table>
<h2>4. 전성분</h2><p style="line-height:1.8">${e(inci||"전성분 데이터가 없습니다.")}</p>
<h2>5. 확인 및 승인</h2><div class="sign"><div class="box">작성</div><div class="box">검토</div><div class="box">승인</div></div><button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button></div></body></html>`;
}

export async function createFormulaSheetDocument(formula: any) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const html = buildFormulaSheetHtml(formula, lines);
  const documentCode = `FS-${formula.formula_code}-${formula.revision}-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabaseProductionFinal.from("plm_documents").insert({
    document_code: documentCode, formula_code: formula.formula_code, revision: formula.revision,
    document_type: "FORMULA_SHEET_PDF", title: `${formula.formula_name} Formula Sheet`, status: "CREATED",
    payload_json: { formula, lines }, html_content: html, created_by: "Sprint 2-2 Document PDF"
  }).select("*").single();
  if (error) throw error;
  return data;
}

export function downloadHtmlDocument(doc: any) {
  const blob = new Blob([doc.html_content || ""], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url; a.download = `${doc.document_code || "formula-sheet"}.html`; a.click();
  URL.revokeObjectURL(url);
}

export function openPrintDocument(doc: any) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도하세요.");
  win.document.open(); win.document.write(doc.html_content || ""); win.document.close();
}
