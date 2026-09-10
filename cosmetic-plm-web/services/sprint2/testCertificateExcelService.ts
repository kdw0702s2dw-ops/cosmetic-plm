"use client";

import ExcelJS from "exceljs";
import type { TestCertificate } from "./testCertificateService";
import { border, downloadWorkbook } from "./documentExcelService";

// 반제품/완제품 시험성적서 엑셀 - 업로드된 양식(A~M, 13개 컬럼: No./시험항목(B:C)/시험기준(D:G)/
// 시험방법(H:I)/시험일자(J:K)/시험결과및판정(L:M))의 병합 구조를 그대로 재현한다.
// 행 높이를 지정하지 않으면(Excel 기본 15pt) 여러 줄 내용이 겹쳐 보이는 문제가 있어, 셀 내용의
// 줄 수를 추정해서 행마다 충분한 높이를 직접 지정한다.

const MEDIUM: Partial<ExcelJS.Borders> = { top: { style: "medium" }, left: { style: "medium" }, bottom: { style: "medium" }, right: { style: "medium" } };
const STAMP_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };

function setCell(ws: ExcelJS.Worksheet, r: number, c: number, value: any, opts?: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; wrap?: boolean; color?: string }) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = { name: "굴림체", size: opts?.size ?? 10, bold: !!opts?.bold, color: opts?.color ? { argb: opts.color } : undefined };
  cell.alignment = { horizontal: opts?.align ?? "center", vertical: "middle", wrapText: opts?.wrap ?? true };
  return cell;
}

// 줄바꿈(\n) + 대략적인 자동개행을 함께 추정 (한글 1자=2, 영숫자 1자=1 가중치, colChars는 병합 컬럼의
// 대략적인 수용 글자수). 정확한 Excel 레이아웃 엔진과 100% 같지는 않으나, 행 높이를 넉넉하게 잡아서
// 텍스트가 겹치거나 잘리는 대신 여백이 조금 남는 쪽으로 보수적으로 계산한다.
function estimateLines(text: string, colChars = 22): number {
  const parts = String(text || "").split("\n");
  let lines = 0;
  for (const p of parts) {
    const weighted = [...p].reduce((s, ch) => s + (/[가-힣]/.test(ch) ? 2 : 1), 0);
    lines += Math.max(1, Math.ceil(weighted / (colChars * 2)));
  }
  return Math.max(1, lines);
}

// 결재란 도장 셀 - 이름이 있으면 연두색 배경 + "승인" 텍스트, 없으면("-") 대각선(사선) 테두리로 표시
function stampCell(ws: ExcelJS.Worksheet, r: number, c: number, name: string) {
  const filled = !!name && name.trim() !== "" && name.trim() !== "-";
  const cell = ws.getCell(r, c);
  if (filled) {
    cell.value = "승인";
    cell.font = { name: "굴림체", size: 9, bold: true, color: { argb: "FF0F9D6A" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = STAMP_FILL;
  } else {
    cell.value = "";
    // 기존 얇은 테두리(top/left/right/bottom)는 유지하고 대각선만 추가한다 - border 객체를 통째로
    // 교체하면 앞서 border()로 깔아둔 바깥 테두리가 사라져 셀이 테두리 없이 붕 떠 보이는 문제가 있었다.
    cell.border = { ...cell.border, diagonal: { style: "thin", color: { argb: "FF94A3B8" }, up: true, down: false } };
  }
}

export function buildCertificateWorkbook(cert: TestCertificate): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const sheetName = cert.product_type === "반제품" ? "반제품 시험성적서" : "완제품 시험성적서";
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  ws.columns = [
    { width: 5 }, { width: 10 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 11 },
    { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 11 }, { width: 11 },
  ];

  // 문서번호 (우측 상단)
  ws.mergeCells(1, 8, 1, 13);
  setCell(ws, 1, 8, `문서번호 : ${cert.doc_no || "-"}`, { align: "right", bold: false, size: 10, wrap: false });
  ws.getRow(1).height = 16;

  // 제목 박스 (B2:G5) + 결재란 (J2:M5)
  ws.mergeCells(2, 2, 5, 7);
  const title = cert.product_type === "반제품" ? "반제품 시험성적서\nSemi-Finished Product (Bulk) Certificate of Analysis" : "완제품 시험성적서\nFinished Product Certificate of Analysis";
  setCell(ws, 2, 2, title, { bold: true, size: 16 });
  for (let r = 2; r <= 5; r++) for (let c = 2; c <= 7; c++) ws.getCell(r, c).border = MEDIUM;

  ws.mergeCells(2, 10, 5, 10);
  setCell(ws, 2, 10, "결\n재", { bold: true, size: 14 });
  setCell(ws, 2, 11, "작성", { bold: true });
  setCell(ws, 2, 12, "검토", { bold: true });
  setCell(ws, 2, 13, "승인", { bold: true });
  ws.mergeCells(3, 11, 4, 11);
  ws.mergeCells(3, 12, 4, 12);
  ws.mergeCells(3, 13, 4, 13);
  setCell(ws, 5, 11, cert.writer_name || "-");
  setCell(ws, 5, 12, cert.reviewer_name || "-");
  setCell(ws, 5, 13, cert.approver_name || "-");
  // 도장/사선(diagonal) 표시는 얇은 테두리보다 먼저 채워두면 다음 border() 호출이 덮어써버리므로,
  // 반드시 border() 호출보다 앞서 일반 THIN 테두리를 먼저 깔고, 그 다음에 stampCell로 개별 셀만 덮어쓴다.
  border(ws, 2, 10, 5, 13);
  for (let c = 10; c <= 13; c++) ws.getCell(2, c).border = { ...ws.getCell(2, c).border, top: { style: "medium" } };
  stampCell(ws, 3, 11, cert.writer_name || "");
  stampCell(ws, 3, 12, cert.reviewer_name || "");
  stampCell(ws, 3, 13, cert.approver_name || "");
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 20;

  ws.getRow(6).height = 8;

  // 헤더 필드 (품목코드/고객사·제품명, 제조번호/시험부서/종합판정)
  let r = 7;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "품목코드", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.item_code || "-", { align: "left" });
  ws.mergeCells(r, 6, r, 7); setCell(ws, r, 6, "고객사/제품명", { bold: true });
  ws.mergeCells(r, 8, r, 13); setCell(ws, r, 8, cert.customer_product || "-", { align: "left" });
  border(ws, r, 1, r, 13);
  ws.getRow(r).height = 26;
  r++;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "제조번호", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.lot_no || "-", { align: "left" });
  ws.mergeCells(r, 6, r, 7); setCell(ws, r, 6, "시험부서", { bold: true });
  ws.mergeCells(r, 8, r, 9); setCell(ws, r, 8, cert.test_dept || "-");
  ws.mergeCells(r, 10, r, 11); setCell(ws, r, 10, "종합판정", { bold: true });
  ws.mergeCells(r, 12, r, 13); setCell(ws, r, 12, cert.overall_verdict || "-");
  border(ws, r, 1, r, 13);
  ws.getRow(r).height = 26;
  r++;

  // 표 헤더
  const headerRow = r;
  setCell(ws, r, 1, "No.", { bold: true });
  ws.mergeCells(r, 2, r, 3); setCell(ws, r, 2, "시 험 항 목", { bold: true });
  ws.mergeCells(r, 4, r, 7); setCell(ws, r, 4, "시 험 기 준", { bold: true });
  ws.mergeCells(r, 8, r, 9); setCell(ws, r, 8, "시 험 방 법", { bold: true });
  ws.mergeCells(r, 10, r, 11); setCell(ws, r, 10, "시 험 일 자", { bold: true });
  ws.mergeCells(r, 12, r, 13); setCell(ws, r, 12, "시 험 결 과\n및 판 정", { bold: true });
  ws.getRow(headerRow).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  border(ws, r, 1, r, 13);
  ws.getRow(r).height = 30;
  r++;

  // 데이터 행
  for (const item of cert.items) {
    if (item.subGroups && item.subGroups.length > 0) {
      const totalRows = item.subGroups.reduce((s, g) => s + Math.max(1, g.results.length), 0);
      const itemStart = r;
      const headMinLines = Math.max(estimateLines(item.label, 10), estimateLines(item.method, 9));
      let sub = r;
      for (const g of item.subGroups) {
        const resultRows = Math.max(1, g.results.length);
        const specStart = sub;
        const specLines = estimateLines(g.spec, 22);
        const perRowHeight = Math.max(20, Math.ceil((specLines * 16 + 10) / resultRows));
        for (let i = 0; i < resultRows; i++) {
          setCell(ws, sub, 12, g.results[i] || "");
          ws.getRow(sub).height = perRowHeight;
          sub++;
        }
        if (resultRows > 1) ws.mergeCells(specStart, 4, specStart + resultRows - 1, 7);
        setCell(ws, specStart, 4, g.spec, { align: "left" });
        if (resultRows > 1) ws.mergeCells(specStart, 13, specStart + resultRows - 1, 13);
        setCell(ws, specStart, 13, g.verdict || "");
      }
      const itemEnd = r + totalRows - 1;
      // 라벨/방법 텍스트가 여러 줄이면 누적 행 높이가 부족할 수 있으므로 첫 행을 보정한다.
      const currentTotalHeight = ws.getRow(itemStart).height ? Array.from({ length: totalRows }, (_, i) => ws.getRow(itemStart + i).height || 20).reduce((a, b) => a + b, 0) : 20 * totalRows;
      const neededTotalHeight = headMinLines * 16 + 10;
      if (neededTotalHeight > currentTotalHeight) {
        ws.getRow(itemStart).height = (ws.getRow(itemStart).height || 20) + (neededTotalHeight - currentTotalHeight);
      }
      if (totalRows > 1) {
        ws.mergeCells(itemStart, 1, itemEnd, 1);
        ws.mergeCells(itemStart, 2, itemEnd, 3);
        ws.mergeCells(itemStart, 8, itemEnd, 9);
        ws.mergeCells(itemStart, 10, itemEnd, 11);
      }
      setCell(ws, itemStart, 1, item.no);
      setCell(ws, itemStart, 2, item.label, { align: "left" });
      setCell(ws, itemStart, 8, item.method);
      setCell(ws, itemStart, 10, item.test_date || "");
      border(ws, itemStart, 1, itemEnd, 13);
      r = itemEnd + 1;
    } else {
      const lines = Math.max(estimateLines(item.label, 10), estimateLines(item.spec || "", 22), estimateLines(item.method, 9));
      setCell(ws, r, 1, item.no);
      ws.mergeCells(r, 2, r, 3); setCell(ws, r, 2, item.label, { align: "left" });
      ws.mergeCells(r, 4, r, 7); setCell(ws, r, 4, item.spec || "", { align: "left" });
      ws.mergeCells(r, 8, r, 9); setCell(ws, r, 8, item.method);
      ws.mergeCells(r, 10, r, 11); setCell(ws, r, 10, item.test_date || "");
      ws.mergeCells(r, 12, r, 13);
      const resultText = item.unit ? `${item.result || ""} ${item.unit}`.trim() : item.result || "";
      setCell(ws, r, 12, resultText);
      border(ws, r, 1, r, 13);
      ws.getRow(r).height = Math.max(24, lines * 16 + 10);
      r++;
    }
  }

  ws.pageSetup = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };

  return wb;
}

export async function downloadCertificateExcel(cert: TestCertificate) {
  const wb = buildCertificateWorkbook(cert);
  await downloadWorkbook(wb, `${cert.product_type}_시험성적서_${cert.item_code || cert.formula_code || "cert"}_${cert.lot_no || ""}.xlsx`);
}
