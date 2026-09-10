"use client";

import ExcelJS from "exceljs";
import type { TestCertificate } from "./testCertificateService";
import { border, downloadWorkbook } from "./documentExcelService";

// 반제품/완제품 시험성적서 엑셀 - 업로드된 양식(A~M, 13개 컬럼: No./시험항목(B:C)/시험기준(D:G)/
// 시험방법(H:I)/시험일자(J:K)/시험결과및판정(L:M))의 병합 구조를 그대로 재현한다.

const MEDIUM: Partial<ExcelJS.Borders> = { top: { style: "medium" }, left: { style: "medium" }, bottom: { style: "medium" }, right: { style: "medium" } };

function setCell(ws: ExcelJS.Worksheet, r: number, c: number, value: any, opts?: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; wrap?: boolean }) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = { name: "굴림체", size: opts?.size ?? 10, bold: !!opts?.bold };
  cell.alignment = { horizontal: opts?.align ?? "center", vertical: "middle", wrapText: opts?.wrap ?? true };
  return cell;
}

export function buildCertificateWorkbook(cert: TestCertificate): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const sheetName = cert.product_type === "반제품" ? "반제품 시험성적서" : "완제품 시험성적서";
  const ws = wb.addWorksheet(sheetName.slice(0, 31));
  ws.columns = [
    { width: 4 }, { width: 10 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 11 },
    { width: 9 }, { width: 9 }, { width: 9 }, { width: 9 }, { width: 11 }, { width: 11 },
  ];

  // 제목 박스 (B1:G4) + 결재란 (J1:M4)
  ws.mergeCells(1, 2, 4, 7);
  const title = cert.product_type === "반제품" ? "반제품 시험성적서\nSemi-Finished Product (Bulk) Certificate of Analysis" : "완제품 시험성적서\nFinished Product Certificate of Analysis";
  setCell(ws, 1, 2, title, { bold: true, size: 16 });
  for (let r = 1; r <= 4; r++) for (let c = 2; c <= 7; c++) ws.getCell(r, c).border = MEDIUM;

  ws.mergeCells(1, 10, 4, 10);
  setCell(ws, 1, 10, "결\n재", { bold: true, size: 14 });
  setCell(ws, 1, 11, "작성", { bold: true });
  setCell(ws, 1, 12, "검토", { bold: true });
  setCell(ws, 1, 13, "승인", { bold: true });
  ws.mergeCells(2, 11, 3, 11);
  ws.mergeCells(2, 12, 3, 12);
  ws.mergeCells(2, 13, 3, 13);
  setCell(ws, 2, 11, "");
  setCell(ws, 2, 12, "");
  setCell(ws, 2, 13, "");
  setCell(ws, 4, 11, cert.writer_name || "-");
  setCell(ws, 4, 12, cert.reviewer_name || "-");
  setCell(ws, 4, 13, cert.approver_name || "-");
  border(ws, 1, 10, 4, 13);

  // 헤더 필드 (품목코드/고객사·제품명, 제조번호/시험부서/종합판정)
  let r = 6;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "품목코드", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.item_code || "-", { align: "left" });
  ws.mergeCells(r, 6, r, 7); setCell(ws, r, 6, "고객사/제품명", { bold: true });
  ws.mergeCells(r, 8, r, 13); setCell(ws, r, 8, cert.customer_product || "-", { align: "left" });
  border(ws, r, 1, r, 13);
  r++;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "제조번호", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.lot_no || "-", { align: "left" });
  ws.mergeCells(r, 6, r, 7); setCell(ws, r, 6, "시험부서", { bold: true });
  ws.mergeCells(r, 8, r, 9); setCell(ws, r, 8, cert.test_dept || "-");
  ws.mergeCells(r, 10, r, 11); setCell(ws, r, 10, "종합판정", { bold: true });
  ws.mergeCells(r, 12, r, 13); setCell(ws, r, 12, cert.overall_verdict || "-");
  border(ws, r, 1, r, 13);
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
  r++;

  // 데이터 행
  for (const item of cert.items) {
    if (item.subGroups && item.subGroups.length > 0) {
      const totalRows = item.subGroups.reduce((s, g) => s + Math.max(1, g.results.length), 0);
      const itemStart = r;
      let sub = r;
      for (const g of item.subGroups) {
        const resultRows = Math.max(1, g.results.length);
        const specStart = sub;
        for (let i = 0; i < resultRows; i++) {
          setCell(ws, sub, 12, g.results[i] || "");
          sub++;
        }
        if (resultRows > 1) ws.mergeCells(specStart, 4, specStart + resultRows - 1, 7);
        setCell(ws, specStart, 4, g.spec, { align: "left" });
        if (resultRows > 1) ws.mergeCells(specStart, 13, specStart + resultRows - 1, 13);
        setCell(ws, specStart, 13, g.verdict || "");
      }
      const itemEnd = r + totalRows - 1;
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
      setCell(ws, r, 1, item.no);
      ws.mergeCells(r, 2, r, 3); setCell(ws, r, 2, item.label, { align: "left" });
      ws.mergeCells(r, 4, r, 7); setCell(ws, r, 4, item.spec || "", { align: "left" });
      ws.mergeCells(r, 8, r, 9); setCell(ws, r, 8, item.method);
      ws.mergeCells(r, 10, r, 11); setCell(ws, r, 10, item.test_date || "");
      ws.mergeCells(r, 12, r, 13);
      const resultText = item.unit ? `${item.result || ""} ${item.unit}`.trim() : item.result || "";
      setCell(ws, r, 12, resultText);
      border(ws, r, 1, r, 13);
      r++;
    }
  }

  return wb;
}

export async function downloadCertificateExcel(cert: TestCertificate) {
  const wb = buildCertificateWorkbook(cert);
  await downloadWorkbook(wb, `${cert.product_type}_시험성적서_${cert.item_code || cert.formula_code || "cert"}_${cert.lot_no || ""}.xlsx`);
}
