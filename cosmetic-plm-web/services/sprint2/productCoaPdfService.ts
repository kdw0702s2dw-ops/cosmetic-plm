"use client";

import type { CoaItem, ProductCoa } from "./productCoaService";

// 제품 COA(Certificate of Analysis) PDF - 사용자가 업로드한 영문 양식(제품 COA 양식.docx)의 구성
// (제목 / Product Information / Test Results / 각주 / Conclusion / 결재란)을 그대로 재현한다.
// 결재는 Approved By 단일 단계이며, 담당자가 실제로 "확정"했을 때만(그리고 본인이 서명 이미지를
// 등록해두었을 때만) 서명 이미지가 삽입된다 - 등록 전이면 이름만 표기한다. 결재란은 크게 표시하고,
// 발행일(Issue Date)은 결재와 무관하게 사용자가 직접 입력하는 값을 결재란 바로 아래에 표기한다.

export type CoaSignatureMap = { approver?: string | null };

function e(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

// 확정된 경우 담당자 이름과 확정일을, 아직 확정 전이면 업로드 양식 그대로 "Date & Signature" 캡션을 보여준다.
function signatureCaption(name: string, confirmedAt: string | null | undefined) {
  if (confirmedAt) return `${e(name)} &middot; ${fmtDate(confirmedAt)}`;
  return "Date &amp; Signature";
}

function signatureCellHtml(name: string, confirmedAt: string | null | undefined, signatureUrl: string | null | undefined) {
  const hasPerson = !!name && name.trim() !== "" && name.trim() !== "-";
  if (!hasPerson) return `<div class="slashwrap"></div>`;
  if (confirmedAt && signatureUrl) {
    return `<div class="stampwrap"><img class="stamp-img" src="${e(signatureUrl)}" alt="signature"/></div>`;
  }
  if (confirmedAt) {
    return `<div class="stampwrap"><span class="signed-name">${e(name)}</span></div>`;
  }
  return `<div class="stampwrap"></div>`;
}

function itemRowsHtml(items: CoaItem[]) {
  return items
    .map(
      (it) => `<tr>
<td class="center">${it.no}</td>
<td class="left">${e(it.test_item)}</td>
<td class="left">${e(it.test_standard)}</td>
<td class="left">${e(it.test_method)}</td>
<td class="center">${e(it.test_date || "-")}</td>
<td class="center">${e(it.result || "-")}</td>
</tr>`
    )
    .join("");
}

function conclusionText(coa: ProductCoa) {
  const raw = coa.conclusion || "";
  const productName = coa.product_name?.trim() || "the product";
  return raw.replace(/\[Product Name\]/gi, productName);
}

export function buildCoaHtml(coa: ProductCoa, signatures: CoaSignatureMap = {}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Certificate of Analysis ${e(coa.product_code || coa.product_name || "")}</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:'Times New Roman',Georgia,serif}
.page{width:1000px;margin:24px auto;background:white;padding:30px 36px;border:1px solid #dbe3ef}
table{border-collapse:collapse;width:100%}
.headrow{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px}
.brand-logo{font-family:'Poppins','Segoe UI',Arial,sans-serif;font-weight:800;font-style:italic;font-size:26px;letter-spacing:0.2px;line-height:1}
.brand-dark{color:#1f5c3f}
.brand-light{color:#7cb342}
.docno{text-align:right;font-size:11px;color:#334155;font-family:Arial,sans-serif}
.title{text-align:center;font-weight:bold;font-size:22px;letter-spacing:1px;margin-bottom:18px;font-family:Arial,sans-serif}
.section-h{font-weight:bold;font-size:13px;margin:16px 0 6px;font-family:Arial,sans-serif;border-bottom:2px solid #1f2937;padding-bottom:3px}
.infotbl td{border:1px solid #94a3b8;padding:6px 10px;font-size:12px;font-family:Arial,sans-serif}
.infotbl .k{background:#f3f4f6;font-weight:bold;width:20%}
.itemtbl th,.itemtbl td{border:1px solid #94a3b8;padding:6px 8px;font-size:11.5px;line-height:1.5;font-family:Arial,sans-serif}
.itemtbl th{background:#f3f4f6;font-weight:bold;text-align:center}
.center{text-align:center}
.left{text-align:left}
.footnotes{font-size:10.5px;color:#475569;margin-top:6px;font-family:Arial,sans-serif}
.conclusion{font-size:12px;line-height:1.6;margin-top:4px;font-family:Arial,sans-serif}
.bottomrow{display:flex;justify-content:flex-end;margin-top:18px}
.approval-wrap{width:260px}
.issuedate{font-size:12px;color:#334155;font-family:Arial,sans-serif;text-align:center;margin-top:8px}
.approvalbox{width:260px}
.approvalbox td{border:1px solid #94a3b8;text-align:center;font-size:11px;padding:4px;font-family:Arial,sans-serif}
.approvalbox .label{font-weight:bold;font-size:12px;background:#f8fafc}
.stampwrap,.slashwrap{height:80px;position:relative;display:flex;align-items:center;justify-content:center}
.stamp-img{max-width:200px;max-height:70px;object-fit:contain}
.signed-name{font-weight:700;font-size:13px;font-family:'Brush Script MT',cursive}
.slashwrap{background:linear-gradient(to top right, transparent calc(50% - 1px), #94a3b8 calc(50% - 1px), #94a3b8 calc(50% + 1px), transparent calc(50% + 1px));}
.namecell{font-weight:600}
.no-print{margin-top:22px;padding:11px 17px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer;font-family:Arial,sans-serif}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:10px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">

<div class="headrow">
<div class="brand-logo"><span class="brand-dark">nutri</span><span class="brand-light">advisor</span></div>
<div class="docno">Document No.: ${e(coa.doc_no || "-")}</div>
</div>
<div class="title">CERTIFICATE OF ANALYSIS</div>

<div class="section-h">Product Information</div>
<table class="infotbl">
<tr><td class="k">Product Name</td><td>${e(coa.product_name || "-")}</td></tr>
<tr><td class="k">Manufacturer</td><td>${e(coa.manufacturer || "-")}</td></tr>
<tr><td class="k">Address</td><td>${e(coa.address || "-")}</td></tr>
<tr><td class="k">Product Code</td><td>${e(coa.product_code || "-")}</td></tr>
<tr><td class="k">Batch No.</td><td>${e(coa.batch_no || "-")}</td></tr>
<tr><td class="k">Product Category</td><td>${e(coa.product_category || "-")}</td></tr>
<tr><td class="k">Test Date</td><td>${e(coa.test_date_from || "-")} ~ ${e(coa.test_date_to || "-")}</td></tr>
</table>

<div class="section-h">Test Results</div>
<table class="itemtbl">
<thead>
<tr><th style="width:6%">NO.</th><th style="width:20%">Test Item</th><th style="width:26%">Test Standard</th><th style="width:20%">Test Method</th><th style="width:14%">Test Date</th><th>Result</th></tr>
</thead>
<tbody>
${itemRowsHtml(coa.items)}
</tbody>
</table>
<div class="footnotes">* Average value of multiple measurements<br/>ND = Not Detected</div>

<div class="section-h">Conclusion</div>
<div class="conclusion">${e(conclusionText(coa))}</div>

<div class="bottomrow">
<div class="approval-wrap">
<table class="approvalbox">
<tr><td class="label">Approved By</td></tr>
<tr><td>${signatureCellHtml(coa.approver_name || "", coa.approver_confirmed_at, signatures.approver)}</td></tr>
<tr><td class="namecell">${signatureCaption(coa.approver_name || "", coa.approver_confirmed_at)}</td></tr>
</table>
<div class="issuedate">Issue Date: ${e(coa.issue_date || "-")}</div>
</div>
</div>

<button class="no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;
}

export function openCoaPrint(coa: ProductCoa, signatures: CoaSignatureMap = {}) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("팝업이 차단되었습니다.");
  win.document.open();
  win.document.write(buildCoaHtml(coa, signatures));
  win.document.close();
}

export function downloadCoaHtml(coa: ProductCoa, signatures: CoaSignatureMap = {}) {
  const html = buildCoaHtml(coa, signatures);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `COA_${coa.product_code || coa.product_name || "product"}_${coa.batch_no || ""}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
