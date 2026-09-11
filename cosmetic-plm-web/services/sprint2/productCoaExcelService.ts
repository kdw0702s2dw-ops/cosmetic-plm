"use client";

import ExcelJS from "exceljs";
import type { ProductCoa } from "./productCoaService";
import { border, downloadWorkbook } from "./documentExcelService";

// 제품 COA 엑셀 - 업로드된 영문 양식(제품 COA 양식.docx)의 구성을 6개 컬럼(A~F)으로 재현한다.
// 결재는 Approved By 단일 단계이며, "고정 도장 이미지"가 아니라 확정한 담당자 본인이 등록해둔
// 서명 이미지(plm_signatures)를 그대로 삽입한다 - 브라우저에서 URL을 fetch해 base64로 변환한 뒤
// addImage로 넣는다. 발행일(Issue Date)은 결재와 무관하게 사용자가 직접 입력한 값을 좌측에 표기한다.

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
export type CoaSignatureImages = { approver?: CoaSignatureImage };

// PNG의 IHDR 청크에서 원본 가로/세로 픽셀 크기를 읽어온다 - 서명 이미지 비율을 유지한 채 확대하기 위함.
// (jpeg/gif는 파싱하지 않고 null을 반환, 이 경우 기본 비율로 대체한다)
function getPngPixelSize(base64: string): { width: number; height: number } | null {
  try {
    const bin = atob(base64);
    if (bin.length < 24) return null;
    const readU32 = (offset: number) =>
      (((bin.charCodeAt(offset) << 24) | (bin.charCodeAt(offset + 1) << 16) | (bin.charCodeAt(offset + 2) << 8) | bin.charCodeAt(offset + 3)) >>> 0);
    const width = readU32(16);
    const height = readU32(20);
    if (width > 0 && height > 0) return { width, height };
    return null;
  } catch {
    return null;
  }
}

// 서명란(D~F 병합) 안에서 비율이 깨지지 않도록 최대 폭/높이에 맞춰 축소 배치할 크기를 계산한다.
function fitSignatureSize(image: { base64: string; extension: "png" | "jpeg" | "gif" }, maxWidth: number, maxHeight: number) {
  const natural = image.extension === "png" ? getPngPixelSize(image.base64) : null;
  const aspect = natural ? natural.width / natural.height : 3.2; // 파싱 실패 시 일반적인 서명 비율로 대체
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

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
      // 서명란(D~F 병합, 대략 320px 폭) 안에서 비율을 유지한 채 이전보다 눈에 띄게 키우고 가운데로 배치한다.
      const MAX_W = 190;
      const MAX_H = 62;
      const BOX_W = 320; // D~F 컬럼(20+13+14 단위) 대략 폭
      const COL_D_W = 140; // D 컬럼 대략 폭 - tl.col 오프셋 계산용
      const ROW_H_PX = 80; // 서명 행 높이(60pt) ≈ 80px - tl.row 오프셋 계산용
      const { width, height } = fitSignatureSize(image, MAX_W, MAX_H);
      const colOffset = Math.max(0, (BOX_W - width) / 2) / COL_D_W;
      const rowOffset = Math.max(0, (ROW_H_PX - height) / 2) / ROW_H_PX;
      ws.addImage(imageId, { tl: { col: c1 - 1 + colOffset, row: r - 1 + rowOffset }, ext: { width, height } });
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
  ws.mergeCells(r, 1, r, 3);
  ws.getCell(r, 1).value = {
    richText: [
      { font: { name: "Arial", size: 14, bold: true, italic: true, color: { argb: "FF1F5C3F" } }, text: "nutri" },
      { font: { name: "Arial", size: 14, bold: true, italic: true, color: { argb: "FF7CB342" } }, text: "advisor" },
    ],
  };
  ws.getCell(r, 1).alignment = { horizontal: "left", vertical: "middle" };
  ws.mergeCells(r, 4, r, 6);
  setCell(ws, r, 4, `Document No.: ${coa.doc_no || "-"}`, { align: "right", size: 9, wrap: false });
  ws.getRow(r).height = 20;
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

  // 발행일(좌측, 결재와 무관하게 사용자가 직접 입력) + 결재란 - Approved By 단일 단계(우측)
  const labelRow = r;
  setCell(ws, labelRow, 1, `Issue Date: ${coa.issue_date || "-"}`, { align: "left", wrap: false });
  ws.mergeCells(labelRow, 1, labelRow, 3);
  ws.mergeCells(labelRow, 4, labelRow, 6); setCell(ws, labelRow, 4, "Approved By", { bold: true });
  ws.getCell(labelRow, 4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getCell(labelRow, 5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getCell(labelRow, 6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getRow(labelRow).height = 20;
  r++;

  const signRow = r;
  ws.mergeCells(signRow, 4, signRow, 6);
  ws.getRow(signRow).height = 60;
  r++;

  const nameRow = r;
  ws.mergeCells(nameRow, 4, nameRow, 6); setCell(ws, nameRow, 4, coa.approver_name || "-");
  ws.getRow(nameRow).height = 18;
  r++;

  border(ws, labelRow, 4, nameRow, 6);
  // 얇은 테두리를 먼저 깔고, 서명 이미지/사선 표시는 그 다음에 덮어써야 border() 호출이 지우지 않는다.
  signatureCell(ws, signRow, 4, 6, coa.approver_name || "", coa.approver_confirmed_at, signatures.approver, wb);

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

export async function downloadCoaExcel(coa: ProductCoa, signatureUrls: { approver?: string | null } = {}) {
  const approver = await loadSignatureImage(signatureUrls.approver);
  const wb = buildCoaWorkbook(coa, { approver });
  await downloadWorkbook(wb, `COA_${coa.product_code || coa.product_name || "product"}_${coa.batch_no || ""}.xlsx`);
}
