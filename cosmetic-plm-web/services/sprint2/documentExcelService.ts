"use client";

import ExcelJS from "exceljs";
import {
  ALLERGEN_BASE_LINE,
  buildComplexGroupedRows,
  complexRows,
  computeUniformPercentDecimals,
  CONFIDENTIAL,
  type DocBasis,
  exactDecimalToNumber,
  fetchFormulaLinesForPdf,
  fixedPct,
  kovasMeta,
  mergeRows,
  NOTES,
  orderSheetMeta,
  OrderSheetRow,
  pct,
  resolveLinesForBasis,
  singleRows,
} from "@/services/sprint2/documentPdfService";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

export function border(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = THIN_BORDER;
    }
  }
}

// PDF(baseHtml)의 <div class="doctitle">와 동일한 문서 제목 1행 (전체 폭 병합, 굵게, 가운데정렬)
export function writeTitleRow(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  const row = ws.addRow([title]);
  ws.mergeCells(row.number, 1, row.number, colCount);
  const cell = ws.getCell(row.number, 1);
  cell.font = { bold: true, size: 14 };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(row.number).height = 24;
}

// PDF(kovasMeta)의 <table class="meta"> 라벨:값 6행과 동일한 내용을 그대로 재사용
// 라벨을 1~2번 컬럼에 병합해서 쓴다 - 표 본문의 "No." 컬럼(폭 6)과 컬럼을 공유하다 보니
// 라벨(예: "Product name acc. To package")이 한 컬럼 폭만으로는 잘려 보이는 문제가 있었음.
export function writeMetaRows(ws: ExcelJS.Worksheet, meta: Record<string, string>, colCount: number) {
  for (const [label, value] of Object.entries(meta)) {
    const row = ws.addRow(["", "", "", ""]);
    ws.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: false, color: { argb: "FF334155" } };
    row.getCell(3).value = ":";
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(4).value = value;
    if (colCount > 4) {
      ws.mergeCells(row.number, 4, row.number, colCount);
    }
  }
  ws.addRow([]);
}

// PDF(NOTES + ALLERGEN_BASE_LINE + CONFIDENTIAL)와 텍스트를 한 글자도 다르지 않게 그대로 재사용
function writeFooterNotes(ws: ExcelJS.Worksheet, colCount: number) {
  ws.addRow([]);
  for (const note of [...NOTES, ALLERGEN_BASE_LINE]) {
    const row = ws.addRow([note]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).font = { italic: true, size: 9, color: { argb: "FF475569" } };
  }
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };
}

// wrapText 셀의 필요한 행 높이를 텍스트 길이 기준으로 추정한다.
// Excel의 "열 너비" 단위는 대략 라틴 문자 1개 폭과 비슷하고 한글 등 전각 문자는 그 2배 폭을 차지하므로,
// 문자마다 가중치를 둬서 총 폭 대비 줄바꿈 횟수를 계산한다. 실제 Excel 폭 계산과 완전히 같지는 않으므로
// 보수적으로(칸수를 살짝 줄이고 줄 높이를 넉넉히 잡아) 텍스트가 잘리는 대신 여백이 조금 남는 쪽으로 잡는다.
function estimateWrappedRowHeight(text: string, totalColWidth: number, lineHeightPt = 15) {
  let weightedLength = 0;
  for (const ch of text) {
    weightedLength += /[가-힣]/.test(ch) ? 2 : 1;
  }
  const charsPerLine = Math.max(10, Math.floor(totalColWidth * 0.9));
  const estimatedLines = Math.max(1, Math.ceil(weightedLength / charsPerLine));
  return estimatedLines * lineHeightPt + 8;
}

export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadExpandedRows(formula: any, basis: DocBasis = "MIX") {
  const rawLines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const { lines, components } = await resolveLinesForBasis(formula, rawLines, basis);
  return { lines, components };
}

// ============================================================
// 단일성분표 엑셀: PDF(No/INCI/국문명/%/CAS/EC/Function)와 동일한 컬럼 + 상단정보/하단각주 추가
// ============================================================
export async function downloadSingleComponentExcel(formula: any, basis: DocBasis = "MIX") {
  const { lines, components } = await loadExpandedRows(formula, basis);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  // 문서 전체에서 "값이 정확히 끝나는" 최대 자릿수(8~15자리)로 통일. 셀 값은 정확한 실제 숫자를 그대로
  // 저장하고, numFmt로 그 자릿수만큼 0-패딩해서 보여준다 (PDF의 문자열 표시와 자릿수는 동일하되,
  // 엑셀에서는 숫자 그대로라 정렬/필터/수식 계산이 가능함).
  const decimals = computeUniformPercentDecimals(rows);
  const percentNumFmt = "0." + "0".repeat(decimals);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("단일성분표");
  const colCount = 7;
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 20 }, { width: 8 + decimals }, { width: 16 }, { width: 12 }, { width: 20 }];

  writeTitleRow(ws, `Ingredient List (Single)${basis === "DRY" ? " (건조 후)" : ""}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const headerRow = ws.addRow(["No.", "EU/USA INCI name", "국문명", "Percentage(%)", "CAS No.", "EC No.", "Function"]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (rows.length === 0) {
    ws.addRow(["", "단일성분 데이터가 없습니다.", "", "", "", "", ""]);
  }
  rows.forEach((x, i) => {
    const percentValue = x.exactPercent ? exactDecimalToNumber(x.exactPercent) : Number(pct(x.final_percent));
    const row = ws.addRow([i + 1, x.inci_en, x.inci_kr, percentValue, x.cas_no || "-", x.ec_no || "-", x.function_text]);
    row.alignment = { vertical: "middle" };
    row.getCell(4).numFmt = percentNumFmt;
    border(ws, row.number, 1, row.number, colCount);
  });

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `단일성분표_${formula.formula_code}_${formula.revision}${basis === "DRY" ? "_건조후" : ""}.xlsx`);
}

// ============================================================
// 전성분표 엑셀: PDF(박스 2개 - Ingredient list 영문 / 국문전성분)와 동일한 문장형 레이아웃
// ============================================================
export async function downloadInciListExcel(formula: any, basis: DocBasis = "MIX") {
  const { lines, components } = await loadExpandedRows(formula, basis);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  const inciEn = rows.map((x) => x.inci_en).filter(Boolean).join(", ");
  const inciKr = rows.map((x) => x.inci_kr).filter(Boolean).join(", ");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("전성분표");
  const colCount = 6;
  const colWidths = [28, 4, 24, 24, 24, 24];
  ws.columns = colWidths.map((width) => ({ width }));
  const totalColWidth = colWidths.reduce((s, w) => s + w, 0);

  writeTitleRow(ws, `Ingredient List for Development${basis === "DRY" ? " (건조 후)" : ""}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const writeBox = (title: string, content: string) => {
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, colCount);
    titleRow.getCell(1).font = { bold: true };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    border(ws, titleRow.number, 1, titleRow.number, colCount);

    const bodyRow = ws.addRow([content || "-"]);
    ws.mergeCells(bodyRow.number, 1, bodyRow.number, colCount);
    bodyRow.getCell(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    border(ws, bodyRow.number, 1, bodyRow.number, colCount);
    // PDF는 텍스트 양에 따라 박스 높이가 자동으로 늘어나지만 엑셀은 고정 행 높이라
    // 뷰어에 따라 자동 재계산에 의존하지 못하므로, 텍스트 길이 기준으로 직접 계산해서 지정한다.
    ws.getRow(bodyRow.number).height = estimateWrappedRowHeight(content || "-", totalColWidth);
  };

  writeBox("Ingredient list", inciEn);
  writeBox("국문전성분", inciKr);

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `전성분표_${formula.formula_code}_${formula.revision}${basis === "DRY" ? "_건조후" : ""}.xlsx`);
}

// ============================================================
// 복합성분표 엑셀: PDF와 동일하게 원료 1개 = 1행, 구성성분은 셀 내 줄바꿈(\n + wrapText)
// buildComplexGroupedRows()를 그대로 재사용 (PDF의 <br> 대신 \n으로 줄바꿈)
// ============================================================
export async function downloadComplexComponentExcel(formula: any, basis: DocBasis = "MIX") {
  const { lines, components } = await loadExpandedRows(formula, basis);
  const grouped = buildComplexGroupedRows(lines, components);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("복합성분표");
  const colCount = 7;
  ws.columns = [{ width: 6 }, { width: 40 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 24 }, { width: 20 }];

  writeTitleRow(ws, `Ingredient List for Development${basis === "DRY" ? " (건조 후)" : ""}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const headerRow = ws.addRow(["No.", "EU/USA INCI name", "국문명", "% Sub Ingredient in Raw Ingredient", "%Raw Ingredient in Formula", "CAS No.", "Function"]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (grouped.length === 0) {
    ws.addRow(["", "복합원료 구성성분 데이터가 없습니다.", "", "", "", "", ""]);
  }

  grouped.forEach((g, i) => {
    const en = g.items.map((x) => x.inci_en).join("\n");
    const kr = g.items.map((x) => x.inci_kr).join("\n");
    const ratio = g.items.length === 1 && g.items[0].ratio === null ? "-" : g.items.map((x) => fixedPct(x.ratio, 4)).join("\n");
    const cas = g.items.map((x) => x.cas).join("\n");

    const row = ws.addRow([i + 1, en, kr, ratio, fixedPct(g.input, 6), cas, g.func]);
    row.alignment = { vertical: "middle" };
    row.getCell(2).alignment = { vertical: "middle", wrapText: true };
    row.getCell(3).alignment = { vertical: "middle", wrapText: true };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    row.getCell(6).alignment = { vertical: "middle", wrapText: true };
    border(ws, row.number, 1, row.number, colCount);
    // 행 높이를 고정값으로 지정하지 않는다 - Excel이 파일을 열 때 wrapText 셀 내용(개별 항목이
    // 컬럼 폭보다 길어 한 항목이 시각적으로 여러 줄로 접히는 경우 포함)에 맞춰 자동으로 행 높이를
    // 재계산하므로, 고정 높이를 주면 오히려 마지막 줄이 다음 행과 겹쳐 잘려 보이는 문제가 생긴다.
  });

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `복합성분표_${formula.formula_code}_${formula.revision}${basis === "DRY" ? "_건조후" : ""}.xlsx`);
}

// ============================================================
// 원료발주가처방 엑셀: PDF(No/원료코드/원료명/함량(%)/신규 체크/공급사/연구 담당자)와 동일한 컬럼
// rows/personInCharge는 미리보기 팝업에서 사용자가 확정한 값을 그대로 받는다 (재계산하지 않음)
// ============================================================
export async function downloadRawMaterialOrderSheetExcel(formula: any, rows: OrderSheetRow[], personInCharge: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("원료발주가처방");
  const colCount = 7;
  ws.columns = [{ width: 6 }, { width: 18 }, { width: 30 }, { width: 12 }, { width: 12 }, { width: 22 }, { width: 16 }];

  writeTitleRow(ws, "원료발주가처방", colCount);
  writeMetaRows(ws, orderSheetMeta(formula), colCount);

  const headerRow = ws.addRow(["No.", "원료코드", "원료명", "함량(%)", "신규 체크", "공급사", "연구 담당자"]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (rows.length === 0) {
    ws.addRow(["", "BOM 데이터가 없습니다.", "", "", "", "", ""]);
  }
  rows.forEach((r, i) => {
    const row = ws.addRow([i + 1, r.raw_code, r.raw_name, Number(pct(r.percent)), r.isNew ? "O" : "", r.supplier || "-", personInCharge || "-"]);
    row.alignment = { vertical: "middle" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "right" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
    border(ws, row.number, 1, row.number, colCount);
  });

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `원료발주가처방_${formula.formula_code}_${formula.revision}.xlsx`);
}
