"use client";

import ExcelJS from "exceljs";
import { CONFIDENTIAL, openPrintDocument } from "@/services/sprint2/documentPdfService";
import { border, downloadWorkbook, writeMetaRows, writeTitleRow } from "@/services/sprint2/documentExcelService";
import type { ManufacturingQtyReviewSheet } from "@/services/sprint2/manufacturingQtyReviewService";

function escapeHtml(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function manufacturingQtyReviewMeta(sheet: ManufacturingQtyReviewSheet) {
  return {
    "처방코드": sheet.formula_code ?? "",
    "처방명": sheet.formula_name ?? "",
    "Revision": sheet.revision ?? "",
    "확정코드": sheet.confirmed_code ?? "",
    "목표 제조량(kg)": fmt(sheet.target_qty_kg),
  };
}

export function buildManufacturingQtyReviewHtml(sheet: ManufacturingQtyReviewSheet): string {
  const meta = manufacturingQtyReviewMeta(sheet);
  const metaRows = Object.entries(meta)
    .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="colon">:</td><td class="v">${escapeHtml(v)}</td></tr>`)
    .join("");

  const shortageRows = sheet.shortage_rows
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.raw_code)}</td>
  <td>${escapeHtml(r.raw_name)}</td>
  <td class="right">${escapeHtml(fmt(r.required_qty))}</td>
  <td class="right">${escapeHtml(fmt(r.current_stock))}</td>
  <td class="right">${escapeHtml(fmt(r.shortage_qty))}</td>
</tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>제조량 검토 - 부족 원료 목록</title>
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
.sectiontitle{font-weight:800;font-size:14px;margin:18px 0 6px}
.confidential{margin-top:12px;font-size:9px;color:#94a3b8}
.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:14px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
<div class="doctitle">제조량 검토 - 부족 원료 목록</div>
<table class="meta">${metaRows}</table>

<div class="sectiontitle">부족 원료 목록</div>
<table class="grid">
<thead><tr><th>원료코드</th><th>원료명</th><th>필요량</th><th>현재재고량</th><th>부족량</th></tr></thead>
<tbody>${shortageRows || `<tr><td colspan="5">부족 원료가 없습니다.</td></tr>`}</tbody>
</table>

<div class="confidential">${escapeHtml(CONFIDENTIAL)}</div>
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

export function printManufacturingQtyReviewSheet(sheet: ManufacturingQtyReviewSheet) {
  openPrintDocument({ html_content: buildManufacturingQtyReviewHtml(sheet) });
}

export async function downloadManufacturingQtyReviewExcel(sheet: ManufacturingQtyReviewSheet) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("제조량 검토");
  const colCount = 5;
  ws.columns = [{ width: 16 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }];

  writeTitleRow(ws, "제조량 검토 - 부족 원료 목록", colCount);
  writeMetaRows(ws, manufacturingQtyReviewMeta(sheet), colCount);

  ws.addRow([]);
  const headerRow = ws.addRow(["원료코드", "원료명", "필요량", "현재재고량", "부족량"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  sheet.shortage_rows.forEach((r) => {
    const row = ws.addRow([r.raw_code, r.raw_name, r.required_qty, r.current_stock, r.shortage_qty]);
    border(ws, row.number, 1, row.number, colCount);
  });
  if (sheet.shortage_rows.length === 0) {
    const row = ws.addRow(["부족 원료가 없습니다."]);
    ws.mergeCells(row.number, 1, row.number, colCount);
  }

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  await downloadWorkbook(wb, `제조량검토_${sheet.formula_code}_${sheet.revision}.xlsx`);
}
