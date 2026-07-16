"use client";

import ExcelJS from "exceljs";
import {
  complexRows,
  fetchComponentsByRawCodes,
  fetchFormulaLinesForPdf,
  mergeRows,
  singleRows,
  type ExpandedRow,
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

function headerRow(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.font = { bold: true };
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, row.number, 1, row.number, headers.length);
  return row;
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
// 단일성분표 엑셀: 기존 PDF 표(No/INCI/국문명/%/CAS/EC/Function)를 그대로 표로 재현
// ============================================================
export async function downloadSingleComponentExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("단일성분표");
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 20 }, { width: 14 }, { width: 16 }, { width: 12 }, { width: 20 }];
  headerRow(ws, ["No.", "EU/USA INCI name", "국문명", "Percentage(%)", "CAS No.", "EC No.", "Function"]);

  if (rows.length === 0) {
    ws.addRow(["", "단일성분 데이터가 없습니다.", "", "", "", "", ""]);
  }
  rows.forEach((x, i) => {
    const row = ws.addRow([i + 1, x.inci_en, x.inci_kr, x.final_percent, x.cas_no || "-", x.ec_no || "-", x.function_text]);
    row.alignment = { vertical: "middle" };
    border(ws, row.number, 1, row.number, 7);
  });

  await downloadWorkbook(wb, `단일성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}

// ============================================================
// 전성분표 엑셀: 텍스트 나열 대신 표(No/INCI 국영문/함량)로 재구성 - 재정렬/필터링 가능
// ============================================================
export async function downloadInciListExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const rows = mergeRows([...complexRows(lines, components), ...singleRows(lines, components)]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("전성분표");
  ws.columns = [{ width: 6 }, { width: 32 }, { width: 22 }, { width: 14 }];
  headerRow(ws, ["No.", "EU/USA INCI name", "국문명", "함량(%)"]);

  if (rows.length === 0) {
    ws.addRow(["", "전성분 데이터가 없습니다.", "", ""]);
  }
  rows.forEach((x, i) => {
    const row = ws.addRow([i + 1, x.inci_en, x.inci_kr, x.final_percent]);
    row.alignment = { vertical: "middle" };
    border(ws, row.number, 1, row.number, 4);
  });

  await downloadWorkbook(wb, `전성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}

// ============================================================
// 복합성분표 엑셀: 원료 단위 부모 행 + 구성성분 자식 행(들여쓰기)
// 최종함량(%) 계산은 complexRows()/singleRows()를 그대로 재사용 (처방관리 자동전성분과 동일 로직)
// ============================================================
type LineGroup = {
  raw_code?: string;
  raw_name?: string;
  raw_percent: number;
  children: ExpandedRow[];
};

export async function downloadComplexComponentExcel(formula: any) {
  const { lines, components } = await loadExpandedRows(formula);
  const complex = complexRows(lines, components);
  const single = singleRows(lines, components);

  // BOM 라인(line_no) 단위로 재그룹화: 원료 하나 = 그룹 하나 (mergeRows처럼 라인 간 중복을 합치지 않고, PDF와 동일하게 라인별로 표시)
  const byLine = new Map<number, LineGroup>();
  for (const row of complex) {
    const key = row.line_no ?? -1;
    const g = byLine.get(key) || { raw_code: row.raw_code, raw_name: row.raw_name, raw_percent: row.raw_percent || 0, children: [] };
    g.children.push(row);
    byLine.set(key, g);
  }
  for (const row of single) {
    const key = row.line_no ?? -1;
    byLine.set(key, { raw_code: row.raw_code, raw_name: row.raw_name, raw_percent: row.final_percent, children: [row] });
  }
  const groups = Array.from(byLine.values()).sort((a, b) => b.raw_percent - a.raw_percent);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("복합성분표");
  ws.columns = [
    { width: 6 }, { width: 14 }, { width: 26 }, { width: 28 }, { width: 20 },
    { width: 12 }, { width: 14 }, { width: 16 }, { width: 20 },
  ];
  headerRow(ws, ["No.", "원료코드", "원료명", "EU/USA INCI name", "국문명", "구성비(%)", "최종함량(%)", "CAS No.", "Function"]);

  if (groups.length === 0) {
    ws.addRow(["", "", "복합원료 구성성분 데이터가 없습니다.", "", "", "", "", "", ""]);
  }

  groups.forEach((g, i) => {
    if (g.children.length > 1) {
      // 복합원료: 원료 단위 부모 행(볼드) + 구성성분 자식 행(들여쓰기)
      const parent = ws.addRow([i + 1, g.raw_code || "", g.raw_name || "", "", "", "", g.raw_percent, "", ""]);
      parent.font = { bold: true };
      parent.alignment = { vertical: "middle" };
      border(ws, parent.number, 1, parent.number, 9);

      for (const c of g.children) {
        const child = ws.addRow(["", "", "", c.inci_en, c.inci_kr, c.component_percent ?? "-", c.final_percent, c.cas_no || "-", c.function_text]);
        child.alignment = { vertical: "middle" };
        child.getCell(4).alignment = { vertical: "middle", indent: 1 };
        border(ws, child.number, 1, child.number, 9);
      }
    } else {
      // 단일원료(구성성분 미등록 또는 1개): 들여쓸 하위 항목이 없으므로 한 행으로 표시
      const c = g.children[0];
      const row = ws.addRow([
        i + 1, g.raw_code || "", g.raw_name || "", c.inci_en, c.inci_kr,
        c.component_percent ?? "-", c.final_percent, c.cas_no || "-", c.function_text,
      ]);
      row.alignment = { vertical: "middle" };
      border(ws, row.number, 1, row.number, 9);
    }
  });

  await downloadWorkbook(wb, `복합성분표_${formula.formula_code}_${formula.revision}.xlsx`);
}
