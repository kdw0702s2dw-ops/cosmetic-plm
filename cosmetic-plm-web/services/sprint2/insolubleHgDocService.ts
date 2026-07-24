"use client";

import ExcelJS from "exceljs";
import { CONFIDENTIAL, fixedPct, openPrintDocument } from "@/services/sprint2/documentPdfService";
import { border, downloadWorkbook, writeMetaRows, writeTitleRow } from "@/services/sprint2/documentExcelService";
import { LOSS_RATE_PRESETS, type InsolubleHgSheet } from "@/services/sprint2/insolubleHgService";

function escapeHtml(v: any) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return fixedPct(v, 6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function lossRateLabel(sheet: InsolubleHgSheet) {
  const preset = LOSS_RATE_PRESETS.find((p) => p.key === sheet.loss_rate_preset_key);
  const pctText = `${fmt(sheet.loss_rate * 100)}%`;
  return preset ? `${preset.label} (${pctText})` : `직접입력 (${pctText})`;
}

function insolubleHgMeta(sheet: InsolubleHgSheet) {
  return {
    "처방코드": sheet.formula_code ?? "",
    "처방명": sheet.formula_name ?? "",
    "Revision": sheet.revision ?? "",
    "확정코드": sheet.confirmed_code ?? "",
  };
}

// productionQtyDocService.ts와 동일한 페이지 CSS를 재사용하고, CONFIDENTIAL 각주만 재사용한다.
export function buildInsolubleHgHtml(sheet: InsolubleHgSheet): string {
  const meta = insolubleHgMeta(sheet);
  const metaRows = Object.entries(meta)
    .map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="colon">:</td><td class="v">${escapeHtml(v)}</td></tr>`)
    .join("");

  const inputRows = [
    [`원단 관리기준 (${sheet.fabric_material_code || "-"})`, fmt(sheet.fabric_standard_weight)],
    [`필름 관리기준 (${sheet.film_material_code || "-"})`, fmt(sheet.film_standard_weight)],
    ["총중량", fmt(sheet.total_weight)],
    ["칼선(No.)", sheet.cutting_line_no || "-"],
    ["칼선면적 A4(종이) 중량", fmt(sheet.cutting_area_a4_weight)],
    ["10x10cm A4(종이) 중량", fmt(sheet.a4_10x10_weight)],
    ["로스율", lossRateLabel(sheet)],
    ["문안용 도포량", fmt(sheet.manual_notice_coat_amount)],
    ["가로(cm) (반칼)", fmt(sheet.half_cut_width_cm)],
    ["세로(cm) (반칼)", fmt(sheet.half_cut_height_cm)],
  ]
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="right">${escapeHtml(v)}</td></tr>`)
    .join("");

  const resultRows = [
    ["총중량 상한", fmt(sheet.total_weight_max)],
    ["도포량", fmt(sheet.coat_amount)],
    ["도포량 상한", fmt(sheet.coat_amount_max)],
    ["면적비(R)", fmt(sheet.area_ratio)],
    ["칼선도포량", fmt(sheet.cutting_line_coat_amount)],
    ["로스반영 도포량", fmt(sheet.loss_adjusted_coat_amount)],
    ["부직포중량", fmt(sheet.nonwoven_weight)],
    ["필름중량(완칼)", fmt(sheet.film_weight_full_cut)],
    ["성형품 중량(완칼)", fmt(sheet.dcap_weight_full_cut)],
    ["필름중량(반칼)", fmt(sheet.film_weight_half_cut)],
    ["성형품 중량(반칼)", fmt(sheet.dcap_weight_half_cut)],
  ]
    .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td class="right">${escapeHtml(v)}</td></tr>`)
    .join("");

  const summaryRows = sheet.summary_rows
    .map(
      (r) => `<tr>
  <td class="center">${escapeHtml(fmt(r.loss_rate * 100))}%</td>
  <td class="right">${escapeHtml(fmt(r.loss_adjusted_coat_amount))}</td>
  <td class="right">${escapeHtml(fmt(r.dcap_weight))}</td>
  <td class="right">${escapeHtml(fmt(r.weight_97pct))}</td>
</tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>불용성 HG 도포량 계산</title>
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
<div class="doctitle">불용성 HG 도포량 계산</div>
<table class="meta">${metaRows}</table>

<div class="sectiontitle">입력값</div>
<table class="grid"><tbody>${inputRows}</tbody></table>

<div class="sectiontitle">계산 결과</div>
<table class="grid"><tbody>${resultRows}</tbody></table>

<div class="sectiontitle">로스율별 비교</div>
<table class="grid">
<thead><tr><th>로스율</th><th>로스반영 도포량</th><th>성형품 중량(완칼)</th><th>97%중량</th></tr></thead>
<tbody>${summaryRows || `<tr><td colspan="4">비교 데이터가 없습니다.</td></tr>`}</tbody>
</table>

<div class="confidential">${escapeHtml(CONFIDENTIAL)}</div>
<button class="no-print" onclick="window.print()">PDF로 저장/인쇄</button>
</div>
</body>
</html>`;
}

export function printInsolubleHgSheet(sheet: InsolubleHgSheet) {
  openPrintDocument({ html_content: buildInsolubleHgHtml(sheet) });
}

export async function downloadInsolubleHgExcel(sheet: InsolubleHgSheet) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("불용성 HG");
  const colCount = 4;
  ws.columns = [{ width: 20 }, { width: 18 }, { width: 16 }, { width: 16 }];

  writeTitleRow(ws, "불용성 HG 도포량 계산", colCount);
  writeMetaRows(ws, insolubleHgMeta(sheet), colCount);

  const inputHeaderRow = ws.addRow(["입력값"]);
  ws.mergeCells(inputHeaderRow.number, 1, inputHeaderRow.number, colCount);
  inputHeaderRow.getCell(1).font = { bold: true };

  const inputPairs: [string, number | string | null][] = [
    [`원단 관리기준 (${sheet.fabric_material_code || "-"})`, sheet.fabric_standard_weight],
    [`필름 관리기준 (${sheet.film_material_code || "-"})`, sheet.film_standard_weight],
    ["총중량", sheet.total_weight],
    ["칼선(No.)", sheet.cutting_line_no || "-"],
    ["칼선면적 A4(종이) 중량", sheet.cutting_area_a4_weight],
    ["10x10cm A4(종이) 중량", sheet.a4_10x10_weight],
    ["로스율", lossRateLabel(sheet)],
    ["문안용 도포량", sheet.manual_notice_coat_amount ?? null],
    ["가로(cm) (반칼)", sheet.half_cut_width_cm],
    ["세로(cm) (반칼)", sheet.half_cut_height_cm],
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
    ["총중량 상한", sheet.total_weight_max],
    ["도포량", sheet.coat_amount],
    ["도포량 상한", sheet.coat_amount_max],
    ["면적비(R)", sheet.area_ratio],
    ["칼선도포량", sheet.cutting_line_coat_amount],
    ["로스반영 도포량", sheet.loss_adjusted_coat_amount],
    ["부직포중량", sheet.nonwoven_weight],
    ["필름중량(완칼)", sheet.film_weight_full_cut],
    ["성형품 중량(완칼)", sheet.dcap_weight_full_cut],
    ["필름중량(반칼)", sheet.film_weight_half_cut],
    ["성형품 중량(반칼)", sheet.dcap_weight_half_cut],
  ];
  for (const [label, value] of resultPairs) {
    const row = ws.addRow([label, value ?? null]);
    border(ws, row.number, 1, row.number, 2);
  }

  ws.addRow([]);
  const summaryHeaderRow = ws.addRow(["로스율", "로스반영 도포량", "성형품 중량(완칼)", "97%중량"]);
  summaryHeaderRow.font = { bold: true };
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, summaryHeaderRow.number, 1, summaryHeaderRow.number, colCount);

  sheet.summary_rows.forEach((r) => {
    const row = ws.addRow([`${(r.loss_rate * 100).toFixed(0)}%`, r.loss_adjusted_coat_amount, r.dcap_weight, r.weight_97pct]);
    border(ws, row.number, 1, row.number, colCount);
  });

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  await downloadWorkbook(wb, `불용성HG_${sheet.formula_code}_${sheet.revision}.xlsx`);
}
