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

function fmtMoney(v: number | null | undefined, currency?: string) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${Number(v).toLocaleString()}${currency ? " " + currency : ""}`;
}

function manufacturingQtyReviewMeta(sheet: ManufacturingQtyReviewSheet) {
  const totalQty = sheet.formulas.reduce((sum, f) => sum + (f.target_qty_kg || 0), 0);
  // 단가 정보가 없는(order_amount 미계산) 원료가 섞여 있어도 합계 자체는 항상 계산 가능한 값만 더한다
  // (구버전에 저장된 이력엔 order_amount가 아예 없을 수 있어 || 0으로 안전하게 처리).
  const totalOrderAmount = sheet.shortage_rows.reduce((sum, r) => sum + (r.order_amount || 0), 0);
  return {
    "대상 처방 수": `${sheet.formulas.length}건`,
    "목표 제조량 합계(kg)": fmt(totalQty),
    "총 발주 금액": fmtMoney(totalOrderAmount),
  };
}

export function buildManufacturingQtyReviewHtml(sheet: ManufacturingQtyReviewSheet): string {
  const meta = manufacturingQtyReviewMeta(sheet);
  const metaRows = Object.entries(meta)
    .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="colon">:</td><td class="v">${escapeHtml(v)}</td></tr>`)
    .join("");

  const formulaRows = sheet.formulas
    .map(
      (f) => `<tr>
  <td>${escapeHtml(f.formula_code)}</td>
  <td>${escapeHtml(f.formula_name)}</td>
  <td>${escapeHtml(f.revision)}</td>
  <td>${escapeHtml(f.confirmed_code)}</td>
  <td class="right">${escapeHtml(fmt(f.target_qty_kg))}</td>
</tr>`
    )
    .join("");

  const shortageRows = sheet.shortage_rows
    .map(
      (r) => `<tr>
  <td>${escapeHtml(r.raw_code)}</td>
  <td>${escapeHtml(r.raw_name)}</td>
  <td class="right">${escapeHtml(fmt(r.required_qty))}</td>
  <td class="right">${escapeHtml(fmt(r.current_stock))}</td>
  <td class="right">${escapeHtml(fmt(r.shortage_qty))}</td>
  <td class="right">${escapeHtml(fmtMoney(r.unit_price, r.currency))}</td>
  <td>${escapeHtml(r.moq || "-")}</td>
  <td class="right">${escapeHtml(fmt(r.order_qty ?? r.shortage_qty))}</td>
  <td class="right">${escapeHtml(r.unit_price != null ? fmtMoney(r.order_amount, r.currency) : "-")}</td>
</tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>제조량 검토 - 합산 부족 원료 목록</title>
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
<div class="doctitle">제조량 검토 - 합산 부족 원료 목록</div>
<table class="meta">${metaRows}</table>

<div class="sectiontitle">대상 처방 목록</div>
<table class="grid">
<thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th>목표 제조량(kg)</th></tr></thead>
<tbody>${formulaRows || `<tr><td colspan="5">대상 처방이 없습니다.</td></tr>`}</tbody>
</table>

<div class="sectiontitle">합산 부족 원료 목록</div>
<table class="grid">
<thead><tr><th>원료코드</th><th>원료명</th><th>필요량(kg)</th><th>현재재고량(kg)</th><th>부족량(kg)</th><th>단가</th><th>MOQ</th><th>발주량(kg)</th><th>발주 금액</th></tr></thead>
<tbody>${shortageRows || `<tr><td colspan="9">부족 원료가 없습니다.</td></tr>`}</tbody>
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
  // 대상 처방 목록(5컬럼)과 합산 부족 원료 목록(단가/MOQ/발주량/발주 금액 추가로 9컬럼) 중 더 넓은
  // 쪽인 9를 시트 전체 폭(제목/메타 행 병합 폭)으로 쓴다.
  const colCount = 9;
  ws.columns = [
    { width: 16 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 16 }, { width: 14 }, { width: 14 }, { width: 16 },
  ];

  writeTitleRow(ws, "제조량 검토 - 합산 부족 원료 목록", colCount);
  writeMetaRows(ws, manufacturingQtyReviewMeta(sheet), colCount);

  // 대상 처방 목록은 5컬럼짜리 표라 이쪽은 그 폭(FORMULA_COL_COUNT)으로만 테두리/병합한다
  // (전체 colCount=8은 단가/MOQ/발주 금액까지 더 넓은 부족 원료 목록 표 기준).
  const FORMULA_COL_COUNT = 5;
  ws.addRow([]);
  const formulaHeaderRow = ws.addRow(["처방코드", "처방명", "Rev", "확정코드", "목표 제조량(kg)"]);
  formulaHeaderRow.font = { bold: true };
  formulaHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, formulaHeaderRow.number, 1, formulaHeaderRow.number, FORMULA_COL_COUNT);

  sheet.formulas.forEach((f) => {
    const row = ws.addRow([f.formula_code, f.formula_name || "", f.revision, f.confirmed_code || "", f.target_qty_kg]);
    border(ws, row.number, 1, row.number, FORMULA_COL_COUNT);
  });
  if (sheet.formulas.length === 0) {
    const row = ws.addRow(["대상 처방이 없습니다."]);
    ws.mergeCells(row.number, 1, row.number, FORMULA_COL_COUNT);
  }

  ws.addRow([]);
  const headerRow = ws.addRow(["원료코드", "원료명", "필요량(kg)", "현재재고량(kg)", "부족량(kg)", "단가", "MOQ", "발주량(kg)", "발주 금액"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  sheet.shortage_rows.forEach((r) => {
    const row = ws.addRow([
      r.raw_code, r.raw_name, r.required_qty, r.current_stock, r.shortage_qty,
      r.unit_price ?? "-", r.moq || "-", r.order_qty ?? r.shortage_qty, r.unit_price != null ? (r.order_amount ?? 0) : "-",
    ]);
    border(ws, row.number, 1, row.number, colCount);
  });
  if (sheet.shortage_rows.length === 0) {
    const row = ws.addRow(["부족 원료가 없습니다."]);
    ws.mergeCells(row.number, 1, row.number, colCount);
  } else {
    const totalOrderAmount = sheet.shortage_rows.reduce((sum, r) => sum + (r.order_amount || 0), 0);
    const totalRow = ws.addRow(["", "", "", "", "", "", "", "총 발주 금액", totalOrderAmount]);
    totalRow.font = { bold: true };
    border(ws, totalRow.number, 1, totalRow.number, colCount);
  }

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  const stamp = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(wb, `제조량검토_합산_${sheet.formulas.length}건_${stamp}.xlsx`);
}
