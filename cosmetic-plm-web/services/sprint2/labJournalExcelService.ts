"use client";

import ExcelJS from "exceljs";
import { fetchFormulaLinesForPdf } from "@/services/sprint2/documentPdfService";

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
  opts: { bold?: boolean; align?: Partial<ExcelJS.Alignment> } = {}
) {
  ws.mergeCells(r1, c1, r2, c2);
  const cell = ws.getCell(r1, c1);
  cell.value = value;
  cell.font = { bold: opts.bold ?? false };
  cell.alignment = opts.align ?? CENTER;
  border(ws, r1, c1, r2, c2);
}

// 실험일지.xlsx 원본의 셀 레이아웃/병합 구조를 그대로 재현한다 (사용자가 다운로드 후 직접 편집하는 내부 R&D 양식).
export async function buildLabJournalWorkbook(formula: any, lines: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("실험일지");

  ws.columns = [
    { width: 2 }, { width: 6.25 }, { width: 7.625 }, { width: 20.875 },
    { width: 10.25 }, { width: 10.25 }, { width: 10.25 }, { width: 10.25 }, { width: 10.25 }, { width: 10.25 },
    { width: 10.125 }, { width: 2 },
  ];

  const sorted = sortLinesForLabJournal(lines);
  const bomStart = 6;
  const bomEnd = bomStart + Math.max(sorted.length, 1) - 1; // 라인이 0개여도 합계 행 자리는 확보
  const totalRow = bomEnd + 1;
  const physicalStart = totalRow + 1;
  const physicalEnd = physicalStart + 5; // 원단/필름/칼선/두께(㎛)/pH/액단가 6줄
  const processRow = physicalEnd + 1;
  const noteRow = processRow + 1;
  const signRow = noteRow + 1;

  ws.getRow(1).height = 22.5;
  ws.getRow(2).height = 14.25;
  ws.getRow(3).height = 29.25;
  ws.getRow(4).height = 16.5;
  ws.getRow(5).height = 16.5;
  for (let r = bomStart; r <= totalRow; r++) ws.getRow(r).height = 21.95;
  for (let r = physicalStart; r <= physicalEnd; r++) ws.getRow(r).height = 16.5;
  ws.getRow(processRow).height = 16.5;
  ws.getRow(noteRow).height = 17.25;
  ws.getRow(signRow).height = 16.5;

  // R1: 제목
  mergeLabel(ws, 1, 1, 1, 12, "실험일지", { bold: true, align: CENTER });
  ws.getCell(1, 1).font = { bold: true, size: 14 };

  // R2~R3: 베이스처방 / 처방명 / 처방코드 (라벨행 + 값행)
  mergeLabel(ws, 2, 1, 2, 3, "베이스처방", { bold: true });
  mergeLabel(ws, 2, 4, 2, 9, "처방명", { bold: true });
  mergeLabel(ws, 2, 10, 2, 12, "처방코드", { bold: true });
  mergeLabel(ws, 3, 1, 3, 3, "");
  mergeLabel(ws, 3, 4, 3, 9, formula.formula_name || "");
  mergeLabel(ws, 3, 10, 3, 12, formula.formula_code || "");

  // R4~R5: 표 헤더 (Phase/원료코드/원료명은 2행 병합, 원처방/Revision은 별도 행)
  mergeLabel(ws, 4, 1, 5, 2, "Phase", { bold: true });
  mergeLabel(ws, 4, 3, 5, 3, "원료코드", { bold: true });
  mergeLabel(ws, 4, 4, 5, 4, "원료명", { bold: true });
  mergeLabel(ws, 4, 5, 4, 5, "원처방", { bold: true });
  mergeLabel(ws, 5, 5, 5, 5, formula.revision || "");
  for (const r of [4, 5]) {
    for (let c = 6; c <= 10; c++) border(ws, r, c, r, c);
    mergeLabel(ws, r, 11, r, 12, "");
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
    border(ws, row, 3, row, 3);
    border(ws, row, 4, row, 4);
    border(ws, row, 5, row, 5);
    for (let c = 6; c <= 10; c++) border(ws, row, c, row, c);
    mergeLabel(ws, row, 11, row, 12, "");

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
    mergeLabel(ws, bomStart, 11, bomStart, 12, "");
  }

  // 합계 행
  const total = Number(lines.reduce((s, x) => s + n(x.percentage), 0).toFixed(4));
  mergeLabel(ws, totalRow, 1, totalRow, 4, "합     계", { bold: true });
  ws.getCell(totalRow, 5).value = total;
  ws.getCell(totalRow, 5).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalRow, 5).font = { bold: true };
  border(ws, totalRow, 5, totalRow, 5);
  for (let c = 6; c <= 10; c++) border(ws, totalRow, c, totalRow, c);
  mergeLabel(ws, totalRow, 11, totalRow, 12, "");

  // 물성/사용감 및 기타사항 (라벨 6행 병합 + 항목별 라벨/입력칸)
  mergeLabel(ws, physicalStart, 1, physicalEnd, 3, "물성, 사용감 및 기타사항", { bold: true });
  const physicalLabels = ["원단", "필름", "칼선", "두께(㎛)", "pH", "액단가(원/kg)"];
  physicalLabels.forEach((label, i) => {
    const row = physicalStart + i;
    ws.getCell(row, 4).value = label;
    ws.getCell(row, 4).alignment = CENTER_V_ONLY;
    border(ws, row, 4, row, 4);
    border(ws, row, 5, row, 5);
  });
  for (let c = 6; c <= 10; c++) mergeLabel(ws, physicalStart, c, physicalEnd, c, "");
  mergeLabel(ws, physicalStart, 11, physicalEnd, 12, "");

  // 공정 / 특이사항 (우측 입력란은 두 행을 합쳐 하나의 박스로 병합 - 원본 구조 그대로)
  mergeLabel(ws, processRow, 1, processRow, 3, "공정", { bold: true });
  mergeLabel(ws, noteRow, 1, noteRow, 3, "특이사항", { bold: true });
  mergeLabel(ws, processRow, 4, noteRow, 12, "");

  // 마지막 서명란 (빈 병합 칸 3개)
  mergeLabel(ws, signRow, 2, signRow, 5, "");
  mergeLabel(ws, signRow, 6, signRow, 8, "");
  mergeLabel(ws, signRow, 9, signRow, 11, "");

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
