"use client";

import ExcelJS from "exceljs";
import {
  ALLERGEN_BASE_LINE,
  buildComplexGroupedRows,
  complexRows,
  CONFIDENTIAL,
  fetchComponentsByRawCodes,
  fetchFormulaLinesForPdf,
  kovasMeta,
  mergeRows,
  NOTES,
  pct,
  singleRows,
} from "@/services/sprint2/documentPdfService";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

function border(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = THIN_BORDER;
    }
  }
}

// PDF(baseHtml)의 <div class="doctitle">와 동일한 문서 제목 1행 (전체 폭 병합, 굵게, 가운데정렬)
function writeTitleRow(ws: ExcelJS.Worksheet, title: string, colCount: number) {
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
function writeMetaRows(ws: ExcelJS.Worksheet, formula: any, colCount: number) {
  const meta = kovasMeta(formula);
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

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadExpandedRows(formula: any) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const components = await fetchComponentsByRawCodes(lines.map((x: any) => x.raw_code));
  return { lines, components };
}

// ============================================================
// 단일성분표 엑셀: PDF(No/INCI/국문명/%/CAS/EC/Function)와 동일한 컬럼 + 상단정보/하단각주 추가
// ============================================================
export async function downloadSingleComponentExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("단일성분표");
  const colCount = 7;
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 20 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 20 }];

  writeTitleRow(ws, "Ingredient List (Single)", colCount);
  writeMetaRows(ws, formula, colCount);

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
    const row = ws.addRow([i + 1, x.inci_en, x.inci_kr, Number(pct(x.final_percent)), x.cas_no || "-", x.ec_no || "-", x.function_text]);
    row.alignment = { vertical: "middle" };
    border(ws, row.number, 1, row.number, colCount);
  });

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `단일성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}

// ============================================================
// 전성분표 엑셀: PDF(박스 2개 - Ingredient list 영문 / 국문전성분)와 동일한 문장형 레이아웃
// ============================================================
export async function downloadInciListExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);
  const inciEn = rows.map((x) => x.inci_en).filter(Boolean).join(", ");
  const inciKr = rows.map((x) => x.inci_kr).filter(Boolean).join(", ");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("전성분표");
  const colCount = 6;
  ws.columns = [{ width: 28 }, { width: 4 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }];

  writeTitleRow(ws, "Ingredient List for Development", colCount);
  writeMetaRows(ws, formula, colCount);

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
  };

  writeBox("Ingredient list", inciEn);
  writeBox("국문전성분", inciKr);

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `전성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}

// ============================================================
// 복합성분표 엑셀: PDF와 동일하게 원료 1개 = 1행, 구성성분은 셀 내 줄바꿈(\n + wrapText)
// buildComplexGroupedRows()를 그대로 재사용 (PDF의 <br> 대신 \n으로 줄바꿈)
// ============================================================
export async function downloadComplexComponentExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const grouped = buildComplexGroupedRows(lines, components);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("복합성분표");
  const colCount = 7;
  ws.columns = [{ width: 6 }, { width: 40 }, { width: 30 }, { width: 12 }, { width: 14 }, { width: 24 }, { width: 20 }];

  writeTitleRow(ws, "Ingredient List for Development", colCount);
  writeMetaRows(ws, formula, colCount);

  const headerRow = ws.addRow(["No.", "EU/USA INCI name", "국문명", "구성비(%)", "최종함량(%)", "CAS No.", "Function"]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
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
    const ratio = g.items.length === 1 && g.items[0].ratio === null ? "-" : g.items.map((x) => pct(x.ratio)).join("\n");
    const cas = g.items.map((x) => x.cas).join("\n");

    const row = ws.addRow([i + 1, en, kr, ratio, Number(pct(g.input)), cas, g.func]);
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
  await downloadWorkbook(wb, `복합성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}
