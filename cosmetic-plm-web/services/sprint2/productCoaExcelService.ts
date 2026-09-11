"use client";

import ExcelJS from "exceljs";
import type { ProductCoa } from "./productCoaService";
import { border, downloadWorkbook } from "./documentExcelService";

// 제품 COA 엑셀 - 업로드된 영문 양식(제품 COA 양식.docx)의 구성을 6개 컬럼(A~F)으로 재현한다.
// 결재란은 시험성적서와 달리 "고정 도장 이미지"가 아니라, 확정한 담당자 본인이 등록해둔 서명 이미지
// (plm_signatures)를 그대로 삽입한다 - 브라우저에서 URL을 fetch해 base64로 변환한 뒤 addImage로 넣는다.

function setCell(ws: ExcelJS.Worksheet, r: number, c: number, value: any, opts?: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; wrap?: boolean }) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = { name: "Arial", size: opts?.size ?? 10, bold: !!opts?.bold };
  cell.alignment = { horizontal: opts?.align ?? "center", vertical: "middle", wrapText: opts?.wrap ?? true };
  return cell;
}

function estimateLines(text: string, colChars = 30): number {
  const parts = String(text || "").split("\n");
  let lines = 0;
  for (const p of parts) lines += Math.max(1, Math.ceil(p.length / colChars));
  return Math.max(1, lines);
}

export type CoaSignatureImage = { base64: string; extension: "png" | "jpeg" | "gif" } | null;
export type CoaSignatureImages = { writer?: CoaSignatureImage; reviewer?: CoaSignatureImage; approver?: CoaSignatureImage };

function signatureCell(
  ws: ExcelJS.Worksheet,
  r: number,
  c1: number,
  c2: number,
  name: string,
  confirmedAt: string | null | undefined,
  image: CoaSignatureImage | undefined,
  wb: ExcelJS.Workbook
) {
  const hasPerson = !!name && name.trim() !== "" && name.trim() !== "-";
  const cell = ws.getCell(r, c1);
  if (!hasPerson) {
    cell.border = { ...cell.border, diagonal: { style: "thin", color: { argb: "FF94A3B8" }, up: true, down: false } };
    return;
  }
  if (confirmedAt && image) {
    try {
      const imageId = wb.addImage({ base64: image.base64, extension: image.extension });
      ws.addImage(imageId, { tl: { col: c1 - 1 + 0.3, row: r - 1 + 0.15 }, ext: { width: 90, height: 32 } });
    } catch {
      // 이미지 삽입 실패 시 조용히 넘어가고 아래 이름 행만 표시한다.
    }
  } else if (confirmedAt) {
    setCell(ws, r, c1, name, { bold: true, size: 11 });
  }
}

export function buildCoaWorkbook(coa: ProductCoa, signatures: CoaSignatureImages = {}): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Certificate of Analysis".slice(0, 31));
  ws.columns = [{ width: 6 }, { width: 22 }, { width: 26 }, { width: 20 }, { width: 13 }, { width: 14 }];

  let r = 1;
  ws.mergeCells(r, 4, r, 6);
  setCell(ws, r, 4, `Document No.: ${coa.doc_no || "-"}`, { align: "right", size: 9, wrap: false });
  ws.getRow(r).height = 16;
  r++;

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "CERTIFICATE OF ANALYSIS", { bold: true, size: 16 });
  ws.getRow(r).height = 26;
  r++;
  r++; // spacer

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "Product Information", { bold: true, size: 12, align: "left" });
  ws.getRow(r).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(r).height = 20;
  r++;

  const infoRows: Array<[string, string]> = [
    ["Product Name", coa.product_name || "-"],
    ["Manufacturer", coa.manufacturer || "-"],
    ["Address", coa.address || "-"],
    ["Product Code", coa.product_code || "-"],
    ["Batch No.", coa.batch_no || "-"],
    ["Product Category", coa.product_category || "-"],
    ["Test Date", `${coa.test_date_from || "-"} ~ ${coa.test_date_to || "-"}`],
  ];
  for (const [label, value] of infoRows) {
    ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, label, { bold: true, align: "left" });
    ws.mergeCells(r, 3, r, 6); setCell(ws, r, 3, value, { align: "left" });
    border(ws, r, 1, r, 6);
    ws.getRow(r).height = Math.max(20, estimateLines(value, 60) * 14 + 8);
    r++;
  }
  r++; // spacer

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "Test Results", { bold: true, size: 12, align: "left" });
  ws.getRow(r).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(r).height = 20;
  r++;

  const headerRow = r;
  setCell(ws, r, 1, "NO.", { bold: true });
  setCell(ws, r, 2, "Test Item", { bold: true });
  setCell(ws, r, 3, "Test Standard", { bold: true });
  setCell(ws, r, 4, "Test Method", { bold: true });
  setCell(ws, r, 5, "Test Date", { bold: true });
  setCell(ws, r, 6, "Result", { bold: true });
  ws.getRow(headerRow).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  border(ws, r, 1, r, 6);
  ws.getRow(r).height = 22;
  r++;

  for (const item of coa.items) {
    setCell(ws, r, 1, item.no);
    setCell(ws, r, 2, item.test_item, { align: "left" });
    setCell(ws, r, 3, item.test_standard, { align: "left" });
    setCell(ws, r, 4, item.test_method, { align: "left" });
    setCell(ws, r, 5, item.test_date || "-");
    setCell(ws, r, 6, item.result || "-");
    border(ws, r, 1, r, 6);
    const lines = Math.max(estimateLines(item.test_item, 20), estimateLines(item.test_standard, 26), estimateLines(item.test_method, 20));
    ws.getRow(r).height = Math.max(20, lines * 14 + 8);
    r++;
  }

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "* Average value of multiple measurements     ND = Not Detected", { align: "left", size: 9, bold: false });
  ws.getRow(r).height = 16;
  r++;
  r++; // spacer

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "Conclusion", { bold: true, size: 12, align: "left" });
  ws.getRow(r).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(r).height = 20;
  r++;

  const conclusionText = (coa.conclusion || "").replace(/\[Product Name\]/gi, coa.product_name?.trim() || "the product");
  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, conclusionText, { align: "left", size: 10 });
  ws.getRow(r).height = Math.max(30, estimateLines(conclusionText, 130) * 16 + 10);
  r++;
  r++; // spacer

  // 결재란 - 작성/검토/승인 (각 2개 컬럼씩 3쌍)
  const labelRow = r;
  ws.mergeCells(labelRow, 1, labelRow, 2); setCell(ws, labelRow, 1, "Prepared By", { bold: true });
  ws.mergeCells(labelRow, 3, labelRow, 4); setCell(ws, labelRow, 3, "Reviewed By", { bold: true });
  ws.mergeCells(labelRow, 5, labelRow, 6); setCell(ws, labelRow, 5, "Approved By", { bold: true });
  ws.getRow(labelRow).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(labelRow).height = 18;
  r++;

  const signRow = r;
  ws.mergeCells(signRow, 1, signRow, 2);
  ws.mergeCells(signRow, 3, signRow, 4);
  ws.mergeCells(signRow, 5, signRow, 6);
  ws.getRow(signRow).height = 34;
  r++;

  const nameRow = r;
  ws.mergeCells(nameRow, 1, nameRow, 2); setCell(ws, nameRow, 1, coa.writer_name || "-");
  ws.mergeCells(nameRow, 3, nameRow, 4); setCell(ws, nameRow, 3, coa.reviewer_name || "-");
  ws.mergeCells(nameRow, 5, nameRow, 6); setCell(ws, nameRow, 5, coa.approver_name || "-");
  ws.getRow(nameRow).height = 18;
  r++;

  border(ws, labelRow, 1, nameRow, 6);
  // 얇은 테두리를 먼저 깔고, 서명 이미지/사선 표시는 그 다음에 덮어써야 border() 호출이 지우지 않는다.
  signatureCell(ws, signRow, 1, 2, coa.writer_name || "", coa.writer_confirmed_at, signatures.writer, wb);
  signatureCell(ws, signRow, 3, 4, coa.reviewer_name || "", coa.reviewer_confirmed_at, signatures.reviewer, wb);
  signatureCell(ws, signRow, 5, 6, coa.approver_name || "", coa.approver_confirmed_at, signatures.approver, wb);

  ws.pageSetup = { orientation: "portrait", fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } };

  return wb;
}

function guessExtension(url: string): "png" | "jpeg" | "gif" {
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".gif")) return "gif";
  return "png";
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

async function loadSignatureImage(url: string | null | undefined): Promise<CoaSignatureImage> {
  if (!url) return null;
  const base64 = await urlToBase64(url);
  if (!base64) return null;
  return { base64, extension: guessExtension(url) };
}

export async function downloadCoaExcel(coa: ProductCoa, signatureUrls: { writer?: string | null; reviewer?: string | null; approver?: string | null } = {}) {
  const [writer, reviewer, approver] = await Promise.all([
    loadSignatureImage(signatureUrls.writer),
    loadSignatureImage(signatureUrls.reviewer),
    loadSignatureImage(signatureUrls.approver),
  ]);
  const wb = buildCoaWorkbook(coa, { writer, reviewer, approver });
  await downloadWorkbook(wb, `COA_${coa.product_code || coa.product_name || "product"}_${coa.batch_no || ""}.xlsx`);
}
