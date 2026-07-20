"use client";

import ExcelJS from "exceljs";
import { CONFIDENTIAL, fixedPct, openPrintDocument } from "@/services/sprint2/documentPdfService";
import { border, downloadWorkbook, writeMetaRows, writeTitleRow } from "@/services/sprint2/documentExcelService";
import type { ProductionQtySheet } from "@/services/sprint2/productionQtyService";

function escapeHtml(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

// 소수점을 임의로 반올림하지 않고 그대로 표시하되, 화면 가독성을 위해 최대 6자리까지만 보여준다
function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return fixedPct(v, 6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function productionQtyMeta(sheet: ProductionQtySheet) {
  return {
    "처방코드": sheet.formula_code ?? "",
    "처방명": sheet.formula_name ?? "",
    "Revision": sheet.revision ?? "",
    "확정코드": sheet.confirmed_code ?? "",
  };
}

// documentPdfService.baseHtml은 전성분/알러젠 조회가 내장돼 있어 이 계산 문서와 맞지 않는다.
// 동일한 페이지 CSS만 복제하고, CONFIDENTIAL 각주만 재사용한다(NOTES/알러젠 각주는 전성분 문서 전용이라 제외).
export function buildProductionQtyHtml(sheet: ProductionQtySheet): string {
  const meta = productionQtyMeta(sheet);
  const metaRows = Object.entries(meta)
    .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="colon">:</td><td class="v">${escapeHtml(v)}</td></tr>`)
    .join("");

  const inputRows = [
    ["제조량(kg)", fmt(sheet.manufacture_qty_kg)],
    ["로스(%)", fmt(sheet.loss_percent)],
    ["10x10(도포량 Max)", fmt(sheet.coat_max_10x10)],
    ["코팅길이(cm)", fmt(sheet.coating_length_cm)],
    ["코팅폭(cm)", fmt(sheet.coating_width_cm)],
    ["코팅 로스(m)", fmt(sheet.coating_loss_m)],
  ]
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="right">${escapeHtml(v)}</td></tr>`)
    .join("");

  const resultRows = [
    ["순수 사용가능 중량(g)", fmt(sheet.usable_weight_g)],
    ["(m)/1EA", fmt(sheet.m_per_ea)],
    ["코팅원단 총 수(개)", fmt(sheet.coating_fabric_count)],
    ["이론적 수량(m)", fmt(sheet.theoretical_qty_m)],
    ["실제 수량(m)", fmt(sheet.actual_qty_m)],
  ]
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="right">${escapeHtml(v)}</td></tr>`)
    .join("");

  const scenarioRows = sheet.scenario_rows
    .map(
      (r, i) => `<tr>
  <td class="center">${i + 1}</td>
  <td class="right">${escapeHtml(fmt(r.molded_size_m))}</td>
  <td class="right">${escapeHtml(fmt(r.cutting_line_qty))}</td>
  <td class="right">${escapeHtml(fmt(sheet.actual_qty_m))}</td>
  <td class="right">${escapeHtml(fmt(r.sample_qty))}</td>
</tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>제조량 확인</title>
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
.notes{margin-top:14px}
.confidential{margin-top:12px;font-size:9px;color:#94a3b8}
.no-print{margin-top:24px;padding:12px 18px;border:0;border-radius:10px;background:#2563eb;color:white;font-weight:800;cursor:pointer}
@media print{body{background:white}.page{width:auto;margin:0;border:0;padding:14px}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
<div class="doctitle">제조량 확인</div>
<table class="meta">${metaRows}</table>

<div class="sectiontitle">입력값</div>
<table class="grid"><tbody>${inputRows}</tbody></table>

<div class="sectiontitle">계산 결과</div>
<table class="grid"><tbody>${resultRows}</tbody></table>

<div class="sectiontitle">시나리오별 샘플 수량</div>
<table class="grid">
<thead><tr><th>No.</th><th>성형품 사이즈(m)</th><th>칼선 수량</th><th>원단(m)</th><th>샘플 수량</th></tr></thead>
<tbody>${scenarioRows || `<tr><td colspan="5">시나리오 행이 없습니다.</td></tr>`}</tbody>
</table>

<div class="confidential">${escapeHtml(CONFIDENTIAL)}</div>
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

export function printProductionQtySheet(sheet: ProductionQtySheet) {
  openPrintDocument({ html_content: buildProductionQtyHtml(sheet) });
}

export async function downloadProductionQtyExcel(sheet: ProductionQtySheet) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("제조량 확인");
  const colCount = 5;
  ws.columns = [{ width: 10 }, { width: 20 }, { width: 16 }, { width: 14 }, { width: 16 }];

  writeTitleRow(ws, "제조량 확인", colCount);
  writeMetaRows(ws, productionQtyMeta(sheet), colCount);

  const inputHeaderRow = ws.addRow(["입력값"]);
  ws.mergeCells(inputHeaderRow.number, 1, inputHeaderRow.number, colCount);
  inputHeaderRow.getCell(1).font = { bold: true };

  const inputPairs: [string, number][] = [
    ["제조량(kg)", sheet.manufacture_qty_kg],
    ["로스(%)", sheet.loss_percent],
    ["10x10(도포량 Max)", sheet.coat_max_10x10],
    ["코팅길이(cm)", sheet.coating_length_cm],
    ["코팅폭(cm)", sheet.coating_width_cm],
    ["코팅 로스(m)", sheet.coating_loss_m],
  ];
  for (const [label, value] of inputPairs) {
    const row = ws.addRow([label, value]);
    border(ws, row.number, 1, row.number, 2);
  }

  ws.addRow([]);
  const resultHeaderRow = ws.addRow(["계산 결과"]);
  ws.mergeCells(resultHeaderRow.number, 1, resultHeaderRow.number, colCount);
  resultHeaderRow.getCell(1).font = { bold: true };

  const resultPairs: [string, number | null | undefined][] = [
    ["순수 사용가능 중량(g)", sheet.usable_weight_g],
    ["(m)/1EA", sheet.m_per_ea],
    ["코팅원단 총 수(개)", sheet.coating_fabric_count],
    ["이론적 수량(m)", sheet.theoretical_qty_m],
    ["실제 수량(m)", sheet.actual_qty_m],
  ];
  for (const [label, value] of resultPairs) {
    const row = ws.addRow([label, value ?? null]);
    border(ws, row.number, 1, row.number, 2);
  }

  ws.addRow([]);
  const scenarioHeaderRow = ws.addRow(["No.", "성형품 사이즈(m)", "칼선 수량", "원단(m)", "샘플 수량"]);
  scenarioHeaderRow.font = { bold: true };
  scenarioHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, scenarioHeaderRow.number, 1, scenarioHeaderRow.number, colCount);

  sheet.scenario_rows.forEach((r, i) => {
    const row = ws.addRow([i + 1, r.molded_size_m, r.cutting_line_qty, sheet.actual_qty_m ?? null, r.sample_qty]);
    border(ws, row.number, 1, row.number, colCount);
  });

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  await downloadWorkbook(wb, `제조량확인_${sheet.formula_code}_${sheet.revision}.xlsx`);
}
