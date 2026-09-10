"use client";

import type { CertItem, TestCertificate } from "./testCertificateService";

// 반제품/완제품 시험성적서 PDF - 사용자가 업로드한 엑셀 양식("반제품_완제품 시험성적서 양식.xlsx")의
// 레이아웃(문서번호 + 제목박스+결재란(도장) / 품목코드~종합판정 헤더 / No.~시험결과및판정 표)을 그대로 재현한다.
// 인쇄 버튼으로 브라우저 인쇄 대화상자를 열어 PDF로 저장하는 기존 문서관리 패턴(openPrintDocument)과 동일하게 동작한다.

function e(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}
function nl(v: any) {
  return e(v).replace(/\n/g, "<br/>");
}
function fmtDate(v: any) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

// 결재란 도장 셀 - 이름이 채워져 있으면 원형 "승인" 도장, 비어있거나 "-"면 업로드 양식처럼 사선(반려/미해당) 표시
function signatureCellHtml(name: string) {
  const filled = !!name && name.trim() !== "" && name.trim() !== "-";
  if (filled) {
    return `<div class="stampwrap"><div class="stamp">승인</div></div>`;
  }
  return `<div class="slashwrap"></div>`;
}

function itemRowsHtml(items: CertItem[]) {
  const rows: string[] = [];
  for (const item of items) {
    if (item.subGroups && item.subGroups.length > 0) {
      const totalRows = item.subGroups.reduce((s, g) => s + Math.max(1, g.results.length), 0);
      let first = true;
      for (const g of item.subGroups) {
        const resultRows = Math.max(1, g.results.length);
        for (let i = 0; i < resultRows; i++) {
          const cells: string[] = [];
          if (first) {
            cells.push(`<td class="center" rowspan="${totalRows}">${item.no}</td>`);
            cells.push(`<td class="center" rowspan="${totalRows}">${nl(item.label)}</td>`);
          }
          if (i === 0) {
            cells.push(`<td class="left" rowspan="${resultRows}">${nl(g.spec)}</td>`);
          }
          if (first) {
            cells.push(`<td class="center" rowspan="${totalRows}">${nl(item.method)}</td>`);
            cells.push(`<td class="center" rowspan="${totalRows}">${fmtDate(item.test_date)}</td>`);
          }
          cells.push(`<td class="center">${e(g.results[i] || "")}</td>`);
          if (i === 0) {
            cells.push(`<td class="center" rowspan="${resultRows}">${e(g.verdict || "")}</td>`);
          }
          rows.push(`<tr>${cells.join("")}</tr>`);
          first = false;
        }
      }
    } else {
      const resultText = item.unit ? `${e(item.result || "")} ${e(item.unit)}`.trim() : e(item.result || "");
      rows.push(`<tr>
<td class="center">${item.no}</td>
<td class="center">${nl(item.label)}</td>
<td class="left">${nl(item.spec)}</td>
<td class="center">${nl(item.method)}</td>
<td class="center">${fmtDate(item.test_date)}</td>
<td class="center" colspan="2">${resultText || "-"}</td>
</tr>`);
    }
  }
  return rows.join("");
}

export function buildCertificateHtml(cert: TestCertificate): string {
  const title = cert.product_type === "반제품" ? "반제품 시험성적서\nSemi-Finished Product (Bulk) Certificate of Analysis" : "완제품 시험성적서\nFinished Product Certificate of Analysis";

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>${e(cert.product_type)} 시험성적서 ${e(cert.item_code || cert.formula_code || "")}</title>
<style>
body{margin:0;background:#f1f5f9;color:#0f172a;font-family:'Malgun Gothic','Noto Sans KR',Arial,sans-serif}
.page{width:1000px;margin:24px auto;background:white;padding:26px 32px;border:1px solid #dbe3ef}
table{border-collapse:collapse;width:100%}
.docno{text-align:right;font-size:12px;color:#334155;margin-bottom:4px}

.headwrap td{border:0;padding:0;vertical-align:top}
.titlebox{width:72%}
.titlebox td{border:3px solid #1f2937;text-align:center;font-weight:bold;font-size:19px;line-height:1.5;padding:16px 10px}
.approvalbox{width:28%;height:100%}
.approvalbox td{border:1px solid #333;text-align:center;font-size:11px;padding:3px}
.approvalbox .label{font-weight:bold;font-size:13px;background:#f8fafc}
.approvalbox .kwlabel{font-weight:bold;font-size:14px;line-height:1.8}
.stampwrap,.slashwrap{height:44px;position:relative}
.stamp{
  width:36px;height:36px;border-radius:50%;border:2px solid #0f9d6a;color:#0f9d6a;
  display:flex;align-items:center;justify-content:center;margin:2px auto;font-weight:800;font-size:10px;
  transform:rotate(-8deg);
}
.slashwrap{background:linear-gradient(to top right, transparent calc(50% - 1px), #94a3b8 calc(50% - 1px), #94a3b8 calc(50% + 1px), transparent calc(50% + 1px));}
.namecell{font-weight:600}

.metatbl td{border:1px solid #333;padding:6px 8px;font-size:12px}
.metatbl .k{background:#f3f4f6;font-weight:bold;text-align:center;width:12%}
.metatbl .v{width:38%}
.itemtbl{margin-top:0}
.itemtbl th,.itemtbl td{border:1px solid #333;padding:6px 7px;font-size:11px;line-height:1.5}
.itemtbl th{background:#f3f4f6;font-weight:bold;text-align:center}
.center{text-align:center}
.left{text-align:left}
.top{margin-top:12px}
.no-print{margin-top:22px;padding:11px 17px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:10px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">

<div class="docno">문서번호 : ${e(cert.doc_no || "-")}</div>

<table class="headwrap">
<tr>
<td>
<table class="titlebox"><tr><td>${nl(title)}</td></tr></table>
</td>
<td>
<table class="approvalbox">
<tr><td rowspan="3" class="kwlabel">결<br/>재</td><td class="label">작성</td><td class="label">검토</td><td class="label">승인</td></tr>
<tr><td>${signatureCellHtml(cert.writer_name || "")}</td><td>${signatureCellHtml(cert.reviewer_name || "")}</td><td>${signatureCellHtml(cert.approver_name || "")}</td></tr>
<tr><td class="namecell">${e(cert.writer_name || "-")}</td><td class="namecell">${e(cert.reviewer_name || "-")}</td><td class="namecell">${e(cert.approver_name || "-")}</td></tr>
</table>
</td>
</tr>
</table>

<table class="metatbl top">
<tr>
<td class="k">품목코드</td><td class="v">${e(cert.item_code || "-")}</td>
<td class="k">고객사/제품명</td><td class="v" colspan="3">${e(cert.customer_product || "-")}</td>
</tr>
<tr>
<td class="k">제조번호</td><td class="v">${e(cert.lot_no || "-")}</td>
<td class="k">시험부서</td><td class="v">${e(cert.test_dept || "-")}</td>
<td class="k">종합판정</td><td class="v">${e(cert.overall_verdict || "-")}</td>
</tr>
</table>

<table class="itemtbl top">
<thead>
<tr>
<th style="width:5%">No.</th>
<th style="width:12%">시 험 항 목</th>
<th style="width:24%">시 험 기 준</th>
<th style="width:14%">시 험 방 법</th>
<th style="width:9%">시 험 일 자</th>
<th colspan="2">시 험 결 과 및 판 정</th>
</tr>
</thead>
<tbody>
${itemRowsHtml(cert.items)}
</tbody>
</table>

<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

export function openCertificatePrint(cert: TestCertificate) {
  const win = window.open("", "_blank");
  if (!win) throw new Error("팝업이 차단되었습니다.");
  win.document.open();
  win.document.write(buildCertificateHtml(cert));
  win.document.close();
}

export function downloadCertificateHtml(cert: TestCertificate) {
  const html = buildCertificateHtml(cert);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `${cert.product_type}_시험성적서_${cert.item_code || cert.formula_code || "cert"}_${cert.lot_no || ""}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
