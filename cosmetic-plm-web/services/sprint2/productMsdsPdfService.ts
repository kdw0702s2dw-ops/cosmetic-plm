"use client";

import type { MsdsSection, ProductMsds } from "./productMsdsService";

// 제품 MSDS(Material Safety Data Sheet) PDF - 사용자가 업로드한 영문 양식(제품 MSDS 양식.docx)의
// 구성(제목 / 1. Identification 고정 필드 / 2~16번 섹션 / 결재란)을 그대로 재현한다. 결재는 제품
// COA와 동일하게 Approved By 단일 단계이며, 담당자가 실제로 "확정"했을 때만(그리고 본인이 서명
// 이미지를 등록해두었을 때만) 서명 이미지가 삽입된다 - 등록 전이면 이름만 표기한다.

export type MsdsSignatureMap = { approver?: string | null };

function e(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}

function nl2br(v: string) {
  return e(v).replace(/\n/g, "<br/>");
}

function fmtDate(v: string | null | undefined) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

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

function sectionHtml(section: MsdsSection) {
  const rows = section.rows
    .map((row) =>
      row.label
        ? `<tr><td class="k">${e(row.label)}</td><td>${nl2br(row.value)}</td></tr>`
        : `<tr><td class="v" colspan="2">${nl2br(row.value)}</td></tr>`
    )
    .join("");
  return `<div class="section-h">${section.no}. ${e(section.title)}</div>
${section.introNote ? `<div class="note">${nl2br(section.introNote)}</div>` : ""}
<table class="infotbl"><tbody>${rows}</tbody></table>
${section.outroNote ? `<div class="note">${nl2br(section.outroNote)}</div>` : ""}`;
}

export function buildMsdsHtml(msds: ProductMsds, signatures: MsdsSignatureMap = {}): string {
  const sectionsHtml = (msds.sections || []).map(sectionHtml).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Material Safety Data Sheet ${e(msds.product_code || msds.product_name || "")}</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:'Times New Roman',Georgia,serif}
.page{width:1000px;margin:24px auto;background:white;padding:30px 36px;border:1px solid #dbe3ef}
table{border-collapse:collapse;width:100%}
.headrow{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px}
.brand-logo{font-family:'Poppins','Segoe UI',Arial,sans-serif;font-weight:800;font-style:italic;font-size:26px;letter-spacing:0.2px;line-height:1}
.brand-dark{color:#1f5c3f}
.brand-light{color:#7cb342}
.docno{text-align:right;font-size:11px;color:#334155;font-family:Arial,sans-serif}
.title{text-align:center;font-weight:bold;font-size:22px;letter-spacing:1px;margin-bottom:2px;font-family:Arial,sans-serif}
.subtitle{text-align:center;font-style:italic;font-size:12px;color:#475569;margin-bottom:18px;font-family:Arial,sans-serif}
.section-h{font-weight:bold;font-size:13px;margin:16px 0 6px;font-family:Arial,sans-serif;border-bottom:2px solid #1f2937;padding-bottom:3px}
.infotbl td{border:1px solid #94a3b8;padding:6px 10px;font-size:12px;font-family:Arial,sans-serif;vertical-align:top}
.infotbl .k{background:#f3f4f6;font-weight:bold;width:26%}
.infotbl .v{background:#fafafa}
.note{font-size:11px;color:#475569;margin:4px 0;font-family:Arial,sans-serif;line-height:1.5}
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
<div class="docno">Document No.: ${e(msds.doc_no || "-")}</div>
</div>
<div class="title">MATERIAL SAFETY DATA SHEET (MSDS)</div>
<div class="subtitle">Cosmetic Finished Product | For External Use Only</div>

<div class="section-h">1. IDENTIFICATION</div>
<table class="infotbl"><tbody>
<tr><td class="k">Product Name</td><td>${e(msds.product_name || "-")}</td></tr>
<tr><td class="k">Product Code</td><td>${e(msds.product_code || "-")}</td></tr>
<tr><td class="k">Product Type</td><td>${e(msds.product_type || "-")}</td></tr>
<tr><td class="k">Revision</td><td>${e(msds.revision || "-")}</td></tr>
<tr><td class="k">Manufacturer</td><td>${e(msds.manufacturer || "-")}</td></tr>
<tr><td class="k">Address</td><td>${e(msds.address || "-")}</td></tr>
<tr><td class="k">Tel / Emergency</td><td>${e(msds.tel_emergency || "-")}</td></tr>
</tbody></table>

${sectionsHtml}

<div class="bottomrow">
<div class="approval-wrap">
<table class="approvalbox">
<tr><td class="label">Approved By</td></tr>
<tr><td>${signatureCellHtml(msds.approver_name || "", msds.approver_confirmed_at, signatures.approver)}</td></tr>
<tr><td class="namecell">${signatureCaption(msds.approver_name || "", msds.approver_confirmed_at)}</td></tr>
</table>
<div class="issuedate">Issue Date: ${e(msds.issue_date || "-")}</div>
</div>
</div>

<button class="no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;
}

export function openMsdsPrint(msds: ProductMsds, signatures: MsdsSignatureMap = {}) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("팝업이 차단되었습니다.");
  win.document.open();
  win.document.write(buildMsdsHtml(msds, signatures));
  win.document.close();
}

export function downloadMsdsHtml(msds: ProductMsds, signatures: MsdsSignatureMap = {}) {
  const html = buildMsdsHtml(msds, signatures);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `MSDS_${msds.product_code || msds.product_name || "product"}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
