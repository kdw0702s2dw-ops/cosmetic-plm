"use client";

import ExcelJS from "exceljs";
import type { ProductCoa } from "./productCoaService";
import { border, downloadWorkbook } from "./documentExcelService";

// 제품 COA 엑셀 - 업로드된 영문 양식(제품 COA 양식.docx)의 구성을 6개 컬럼(A~F)으로 재현한다.
// 결재는 Approved By 단일 단계이며, "고정 도장 이미지"가 아니라 확정한 담당자 본인이 등록해둔
// 서명 이미지(plm_signatures)를 그대로 삽입한다 - 브라우저에서 URL을 fetch해 base64로 변환한 뒤
// addImage로 넣는다. 결재란(서명+이름, E~F 병합)은 크게 표시하고, 발행일(Issue Date)은 결재와
// 무관하게 사용자가 직접 입력한 값을 결재란 바로 아래에 표기한다.

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

// 서명란(E~F 병합) 안에서 비율이 깨지지 않도록 최대 폭/높이에 맞춰 축소 배치할 크기를 계산한다.
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
      // 서명란(E~F 병합, 대략 199px 폭) 안에서 비율을 유지한 채 큼직하게 키우고 가운데로 배치한다.
      const MAX_W = 185;
      const MAX_H = 100;
      const BOX_W = 199; // E~F 컬럼(13+14 단위) 대략 폭
      const COL_E_W = 96; // E 컬럼 대략 폭 - tl.col 오프셋 계산용
      const ROW_H_PX = 128; // 서명 행 높이(96pt) ≈ 128px - tl.row 오프셋 계산용
      const { width, height } = fitSignatureSize(image, MAX_W, MAX_H);
      const colOffset = Math.max(0, (BOX_W - width) / 2) / COL_E_W;
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

  // 결재란 - Approved By 단일 단계(서명란은 E~F 병합). 발행일(Issue Date)은 결재와 무관하게
  // 사용자가 직접 입력한 값을 결재란 바로 아래(같은 E~F 폭, 테두리 없이)에 표기한다.
  const labelRow = r;
  ws.mergeCells(labelRow, 5, labelRow, 6); setCell(ws, labelRow, 5, "Approved By", { bold: true });
  ws.getCell(labelRow, 5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getCell(labelRow, 6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
  ws.getRow(labelRow).height = 20;
  r++;

  const signRow = r;
  ws.mergeCells(signRow, 5, signRow, 6);
  ws.getRow(signRow).height = 96;
  r++;

  const nameRow = r;
  ws.mergeCells(nameRow, 5, nameRow, 6); setCell(ws, nameRow, 5, coa.approver_name || "-");
  ws.getRow(nameRow).height = 18;
  r++;

  border(ws, labelRow, 5, nameRow, 6);
  // 얇은 테두리를 먼저 깔고, 서명 이미지/사선 표시는 그 다음에 덮어써야 border() 호출이 지우지 않는다.
  signatureCell(ws, signRow, 5, 6, coa.approver_name || "", coa.approver_confirmed_at, signatures.approver, wb);

  const issueDateRow = r;
  ws.mergeCells(issueDateRow, 5, issueDateRow, 6);
  setCell(ws, issueDateRow, 5, `Issue Date: ${coa.issue_date || "-"}`, { align: "center", wrap: false });
  r++;

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

// 서명패드로 캡처한 PNG는 보통 고정 캔버스 크기로 저장되어 실제 잉크 주위에 여백이 많다.
// 이 여백을 그대로 두면 박스 안에서 서명이 작고 납작하게 보이므로, 잉크가 있는 영역만 남기고
// 잘라낸다. jpeg/gif이거나 브라우저 환경이 아니거나 잉크를 찾지 못하면 원본을 그대로 반환한다.
async function trimSignatureWhitespace(image: { base64: string; extension: "png" | "jpeg" | "gif" }): Promise<{ base64: string; extension: "png" | "jpeg" | "gif" }> {
  if (image.extension !== "png" || typeof document === "undefined") return image;
  try {
    const el: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("signature image decode failed"));
      img.src = `data:image/png;base64,${image.base64}`;
    });
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (!w || !h) return image;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return image;
    ctx.drawImage(el, 0, 0);
    const { data } = ctx.getImageData(0, 0, w, h);

    const ALPHA_THRESHOLD = 16; // 거의 투명하면 배경으로 간주
    const LIGHT_THRESHOLD = 245; // 거의 흰색이면 배경으로 간주
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] < ALPHA_THRESHOLD) continue;
        if (data[i] >= LIGHT_THRESHOLD && data[i + 1] >= LIGHT_THRESHOLD && data[i + 2] >= LIGHT_THRESHOLD) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) return image; // 잉크 픽셀을 찾지 못함

    const pad = Math.round(Math.max(w, h) * 0.02); // 잘라낼 때 살짝 여백을 남겨 획이 잘리지 않게 함
    const cx0 = Math.max(0, minX - pad);
    const cy0 = Math.max(0, minY - pad);
    const cx1 = Math.min(w, maxX + 1 + pad);
    const cy1 = Math.min(h, maxY + 1 + pad);
    const cw = cx1 - cx0;
    const ch = cy1 - cy0;
    if (cw <= 0 || ch <= 0 || (cw >= w * 0.98 && ch >= h * 0.98)) return image; // 잘라낼 여백이 거의 없음

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cw;
    cropCanvas.height = ch;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return image;
    cropCtx.drawImage(canvas, cx0, cy0, cw, ch, 0, 0, cw, ch);
    const trimmedBase64 = cropCanvas.toDataURL("image/png").split(",")[1];
    if (!trimmedBase64) return image;
    return { base64: trimmedBase64, extension: "png" };
  } catch {
    return image; // 실패 시 원본 이미지를 그대로 사용
  }
}

async function loadSignatureImage(url: string | null | undefined): Promise<CoaSignatureImage> {
  if (!url) return null;
  const base64 = await urlToBase64(url);
  if (!base64) return null;
  return trimSignatureWhitespace({ base64, extension: guessExtension(url) });
}

export async function downloadCoaExcel(coa: ProductCoa, signatureUrls: { approver?: string | null } = {}) {
  const approver = await loadSignatureImage(signatureUrls.approver);
  const wb = buildCoaWorkbook(coa, { approver });
  await downloadWorkbook(wb, `COA_${coa.product_code || coa.product_name || "product"}_${coa.batch_no || ""}.xlsx`);
}
