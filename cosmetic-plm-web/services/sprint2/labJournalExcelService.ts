"use client";

import ExcelJS from "exceljs";
import { fetchFormulaLinesForPdf } from "@/services/sprint2/documentPdfService";

const FONT_NAME = "맑은 고딕";

function n(v: any) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

// 처방관리 BOM 편집 화면과 동일한 표시 순서: Phase 오름차순 -> phase_seq(없으면 line_no) 오름차순.
// 실험일지의 Phase 세로병합은 이 순서로 연속된 구간을 기준으로 계산된다.
function sortLinesForLabJournal(lines: any[]) {
  return [...lines].sort((a, b) => {
    const phaseCmp = (a.phase || "A").localeCompare(b.phase || "A");
    if (phaseCmp !== 0) return phaseCmp;
    const seqA = a.phase_seq !== undefined && a.phase_seq !== null && a.phase_seq !== "" ? Number(a.phase_seq) : Number(a.line_no || 0);
    const seqB = b.phase_seq !== undefined && b.phase_seq !== null && b.phase_seq !== "" ? Number(b.phase_seq) : Number(b.line_no || 0);
    return seqA - seqB;
  });
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const CENTER: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "center", wrapText: true };
const CENTER_V_ONLY: Partial<ExcelJS.Alignment> = { vertical: "middle", wrapText: true };
const BOM_DATA_FONT: Partial<ExcelJS.Font> = { name: FONT_NAME, size: 9 };

function border(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = THIN_BORDER;
    }
  }
}

function mergeLabel(
  ws: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  value: string,
  opts: { bold?: boolean; align?: Partial<ExcelJS.Alignment>; size?: number } = {}
) {
  ws.mergeCells(r1, c1, r2, c2);
  const cell = ws.getCell(r1, c1);
  cell.value = value;
  cell.font = { name: FONT_NAME, bold: opts.bold ?? false, size: opts.size ?? 11 };
  cell.alignment = opts.align ?? CENTER;
  border(ws, r1, c1, r2, c2);
}

// 실험일지.xlsx 원본의 셀 레이아웃/병합 구조를 그대로 재현한다 (사용자가 다운로드 후 직접 편집하는 내부 R&D 양식).
export async function buildLabJournalWorkbook(formula: any, lines: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("실험일지");

  ws.columns = [
    { width: 2 }, { width: 6.25 }, { width: 10.5 }, { width: 24.25 },
    { width: 10.125 }, { width: 10.125 }, { width: 10.125 }, { width: 10.125 }, { width: 10.125 }, { width: 10.125 },
    { width: 10.125 },
  ];
  ws.columns.forEach((col) => {
    col.style = { font: { name: FONT_NAME } };
  });

  const sorted = sortLinesForLabJournal(lines);
  const bomStart = 6;
  const bomEnd = bomStart + Math.max(sorted.length, 1) - 1; // 라인이 0개여도 합계 행 자리는 확보
  const totalRow = bomEnd + 1;
  const physicalStart = totalRow + 1;
  const physicalEnd = physicalStart + 5; // 원단/필름/칼선/두께(㎛)/pH/액단가 6줄
  const noteStart = physicalEnd + 1; // 특이사항 라벨+박스가 차지하는 첫 번째 행 (구 공정 행 자리)
  const noteEnd = noteStart + 1; // 특이사항 라벨+박스 마지막 행 (구 특이사항 행 자리) - 여기서 끝, 서명란 없음

  ws.getRow(1).height = 22.5;
  ws.getRow(2).height = 14.25;
  ws.getRow(3).height = 29.25;
  ws.getRow(4).height = 16.5;
  ws.getRow(5).height = 16.5;
  for (let r = bomStart; r <= totalRow; r++) ws.getRow(r).height = 21.95;
  for (let r = physicalStart; r <= physicalEnd; r++) ws.getRow(r).height = 16.5;
  ws.getRow(noteStart).height = 16.5;
  ws.getRow(noteEnd).height = 17.25;

  // R1: 제목
  mergeLabel(ws, 1, 1, 1, 11, "실험일지", { bold: true, align: CENTER });
  ws.getCell(1, 1).font = { name: FONT_NAME, bold: true, size: 14 };

  // R2~R3: 베이스처방 / 처방명 / 처방코드 (라벨행 + 값행)
  mergeLabel(ws, 2, 1, 2, 3, "베이스처방", { bold: true });
  mergeLabel(ws, 2, 4, 2, 9, "처방명", { bold: true });
  mergeLabel(ws, 2, 10, 2, 11, "처방코드", { bold: true });
  mergeLabel(ws, 3, 1, 3, 3, "");
  mergeLabel(ws, 3, 4, 3, 9, formula.formula_name || "");
  mergeLabel(ws, 3, 10, 3, 11, formula.formula_code || "");

  // R4~R5: 표 헤더 (Phase/원료코드/원료명은 2행 병합, 원처방/Revision은 별도 행)
  mergeLabel(ws, 4, 1, 5, 2, "Phase", { bold: true });
  mergeLabel(ws, 4, 3, 5, 3, "원료코드", { bold: true });
  mergeLabel(ws, 4, 4, 5, 4, "원료명", { bold: true });
  mergeLabel(ws, 4, 5, 4, 5, "원처방", { bold: true });
  mergeLabel(ws, 5, 5, 5, 5, formula.revision || "", { size: 9 });
  for (const r of [4, 5]) {
    for (let c = 6; c <= 10; c++) border(ws, r, c, r, c);
    mergeLabel(ws, r, 11, r, 11, "");
  }

  // R6~: BOM 라인
  let groupStartRow = bomStart;
  let groupPhase = sorted.length > 0 ? sorted[0].phase || "A" : null;
  sorted.forEach((line, i) => {
    const row = bomStart + i;
    const phase = line.phase || "A";
    ws.getCell(row, 3).value = line.raw_code || "";
    ws.getCell(row, 4).value = line.raw_name || "";
    ws.getCell(row, 5).value = n(line.percentage);
    ws.getCell(row, 3).alignment = CENTER_V_ONLY;
    ws.getCell(row, 4).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    ws.getCell(row, 5).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 3).font = BOM_DATA_FONT;
    ws.getCell(row, 4).font = BOM_DATA_FONT;
    ws.getCell(row, 5).font = BOM_DATA_FONT;
    border(ws, row, 3, row, 3);
    border(ws, row, 4, row, 4);
    border(ws, row, 5, row, 5);
    for (let c = 6; c <= 10; c++) border(ws, row, c, row, c);
    mergeLabel(ws, row, 11, row, 11, "");

    const isLastLine = i === sorted.length - 1;
    const phaseChanges = isLastLine || (sorted[i + 1].phase || "A") !== phase;
    if (phaseChanges) {
      mergeLabel(ws, groupStartRow, 1, row, 2, groupPhase || "", { bold: true });
      if (!isLastLine) {
        groupStartRow = row + 1;
        groupPhase = sorted[i + 1].phase || "A";
      }
    }
  });
  if (sorted.length === 0) {
    mergeLabel(ws, bomStart, 1, bomStart, 2, "");
    border(ws, bomStart, 3, bomStart, 5);
    for (let c = 6; c <= 10; c++) border(ws, bomStart, c, bomStart, c);
    mergeLabel(ws, bomStart, 11, bomStart, 11, "");
  }

  // 합계 행 (값은 BOM 데이터 컬럼과 동일하게 9pt 볼드)
  const total = Number(lines.reduce((s, x) => s + n(x.percentage), 0).toFixed(4));
  mergeLabel(ws, totalRow, 1, totalRow, 4, "합     계", { bold: true });
  ws.getCell(totalRow, 5).value = total;
  ws.getCell(totalRow, 5).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalRow, 5).font = { name: FONT_NAME, bold: true, size: 9 };
  border(ws, totalRow, 5, totalRow, 5);
  for (let c = 6; c <= 10; c++) border(ws, totalRow, c, totalRow, c);
  mergeLabel(ws, totalRow, 11, totalRow, 11, "");

  // 물성/사용감 및 기타사항 (라벨 6행 병합 + 항목별 라벨/입력칸, 라벨은 오른쪽 정렬)
  mergeLabel(ws, physicalStart, 1, physicalEnd, 3, "물성, 사용감 및 기타사항", { bold: true });
  const physicalLabels = ["원단", "필름", "칼선", "두께(㎛)", "pH", "액단가(원/kg)"];
  physicalLabels.forEach((label, i) => {
    const row = physicalStart + i;
    ws.getCell(row, 4).value = label;
    ws.getCell(row, 4).alignment = { vertical: "middle", horizontal: "right", wrapText: true };
    ws.getCell(row, 4).font = { name: FONT_NAME, size: 11 };
    border(ws, row, 4, row, 4);
    border(ws, row, 5, row, 5);
  });
  for (let c = 6; c <= 10; c++) mergeLabel(ws, physicalStart, c, physicalEnd, c, "");
  mergeLabel(ws, physicalStart, 11, physicalEnd, 11, "");

  // 특이사항 (공정 행/서명란 제거 - 남은 2행을 특이사항 라벨+입력박스가 그대로 사용)
  mergeLabel(ws, noteStart, 1, noteEnd, 3, "특이사항", { bold: true });
  mergeLabel(ws, noteStart, 4, noteEnd, 11, "");

  return wb;
}

export async function downloadLabJournalDocument(formula: any) {
  const lines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const wb = await buildLabJournalWorkbook(formula, lines);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = `실험일지_${formula.formula_code}_${formula.revision}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
