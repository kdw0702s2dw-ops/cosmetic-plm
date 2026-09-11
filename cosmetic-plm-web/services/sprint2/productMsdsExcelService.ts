"use client";

import ExcelJS from "exceljs";
import type { MsdsSection, ProductMsds } from "./productMsdsService";
import { border, downloadWorkbook } from "./documentExcelService";

// 제품 MSDS 엑셀 - 업로드된 영문 양식(제품 MSDS 양식.docx)의 구성을 6개 컬럼(A~F)으로 재현한다.
// 결재는 Approved By 단일 단계이며, 제품 COA와 동일하게 확정한 담당자 본인이 등록해둔 서명
// 이미지(plm_signatures)를 그대로 삽입한다 - 브라우저에서 URL을 fetch해 base64로 변환한 뒤
// addImage로 넣는다. 서명 중앙정렬 로직(캔버스 합성 + tl~br 셀 앵커)은 제품 COA 엑셀과 동일하다.

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

export type MsdsSignatureImage = { base64: string; extension: "png" | "jpeg" | "gif" } | null;
export type MsdsSignatureImages = { approver?: MsdsSignatureImage };

// PNG의 IHDR 청크에서 원본 가로/세로 픽셀 크기를 읽어온다 - 서명 이미지 비율을 유지한 채 확대하기 위함.
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

function fitSignatureSize(image: { base64: string; extension: "png" | "jpeg" | "gif" }, maxWidth: number, maxHeight: number) {
  const natural = image.extension === "png" ? getPngPixelSize(image.base64) : null;
  const aspect = natural ? natural.width / natural.height : 3.2;
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

// 서명 이미지를 결재란 박스와 정확히 같은 픽셀 크기의 새 캔버스 중앙에 미리 그려 넣는다 (제품 COA
// 엑셀과 동일한 이유: addImage의 앵커 해석이 프로그램마다 달라 "가운데 정렬" 자체를 이미지 픽셀
// 안에 미리 구워 넣고, 앵커는 박스를 오프셋 없이 꽉 채우도록만 사용한다).
async function composeSignatureIntoBox(
  image: { base64: string; extension: "png" | "jpeg" | "gif" },
  boxWidth: number,
  boxHeight: number,
  maxWidth: number,
  maxHeight: number
): Promise<{ base64: string; extension: "png" } | null> {
  if (typeof document === "undefined") return null;
  try {
    const mime = image.extension === "jpeg" ? "jpeg" : image.extension === "gif" ? "gif" : "png";
    const el: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("signature image decode failed"));
      img.src = `data:image/${mime};base64,${image.base64}`;
    });
    const naturalW = el.naturalWidth;
    const naturalH = el.naturalHeight;
    if (!naturalW || !naturalH) return null;

    const aspect = naturalW / naturalH;
    let drawW = Math.min(maxWidth, boxWidth);
    let drawH = drawW / aspect;
    if (drawH > Math.min(maxHeight, boxHeight)) {
      drawH = Math.min(maxHeight, boxHeight);
      drawW = drawH * aspect;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(boxWidth);
    canvas.height = Math.round(boxHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const dx = Math.round((boxWidth - drawW) / 2);
    const dy = Math.round((boxHeight - drawH) / 2);
    ctx.drawImage(el, dx, dy, Math.round(drawW), Math.round(drawH));
    const base64 = canvas.toDataURL("image/png").split(",")[1];
    if (!base64) return null;
    return { base64, extension: "png" };
  } catch {
    return null;
  }
}

async function signatureCell(
  ws: ExcelJS.Worksheet,
  r: number,
  c1: number,
  c2: number,
  name: string,
  confirmedAt: string | null | undefined,
  image: MsdsSignatureImage | undefined,
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
      const BOX_W = 199;
      const COL_E_W = 96;
      const BOX_H = 128;
      const MAX_W = 185;
      const MAX_H = 100;
      const composed = await composeSignatureIntoBox(image, BOX_W, BOX_H, MAX_W, MAX_H);
      if (composed) {
        const imageId = wb.addImage({ base64: composed.base64, extension: composed.extension });
        ws.addImage(imageId, { tl: { col: c1 - 1, row: r - 1 }, br: { col: c2, row: r } });
      } else {
        const imageId = wb.addImage({ base64: image.base64, extension: image.extension });
        const { width, height } = fitSignatureSize(image, MAX_W, MAX_H);
        const colOffset = Math.max(0, (BOX_W - width) / 2) / COL_E_W;
        const rowOffset = Math.max(0, (BOX_H - height) / 2) / BOX_H;
        ws.addImage(imageId, { tl: { col: c1 - 1 + colOffset, row: r - 1 + rowOffset }, ext: { width, height } });
      }
    } catch {
      // 이미지 삽입 실패 시 조용히 넘어가고 아래 이름 행만 표시한다.
    }
  } else if (confirmedAt) {
    setCell(ws, r, c1, name, { bold: true, size: 11 });
  }
}

function writeSection(ws: ExcelJS.Worksheet, r: number, section: MsdsSection): number {
  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, `${section.no}. ${section.title}`, { bold: true, size: 12, align: "left" });
  ws.getRow(r).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(r).height = 20;
  r++;

  if (section.introNote) {
    ws.mergeCells(r, 1, r, 6);
    setCell(ws, r, 1, section.introNote, { align: "left", size: 9.5 });
    ws.getRow(r).height = Math.max(16, estimateLines(section.introNote, 130) * 14 + 6);
    r++;
  }

  for (const row of section.rows) {
    if (row.label) {
      ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, row.label, { bold: true, align: "left" });
      ws.mergeCells(r, 3, r, 6); setCell(ws, r, 3, row.value, { align: "left" });
      border(ws, r, 1, r, 6);
      ws.getRow(r).height = Math.max(20, estimateLines(row.value, 60) * 14 + 8);
    } else {
      ws.mergeCells(r, 1, r, 6);
      setCell(ws, r, 1, row.value, { align: "left" });
      border(ws, r, 1, r, 6);
      ws.getRow(r).height = Math.max(20, estimateLines(row.value, 130) * 14 + 8);
    }
    r++;
  }

  if (section.outroNote) {
    ws.mergeCells(r, 1, r, 6);
    setCell(ws, r, 1, section.outroNote, { align: "left", size: 9.5 });
    ws.getRow(r).height = Math.max(16, estimateLines(section.outroNote, 130) * 14 + 6);
    r++;
  }

  r++; // spacer
  return r;
}

export async function buildMsdsWorkbook(msds: ProductMsds, signatures: MsdsSignatureImages = {}): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Material Safety Data Sheet".slice(0, 31));
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
  setCell(ws, r, 4, `Document No.: ${msds.doc_no || "-"}`, { align: "right", size: 9, wrap: false });
  ws.getRow(r).height = 20;
  r++;

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "MATERIAL SAFETY DATA SHEET (MSDS)", { bold: true, size: 15 });
  ws.getRow(r).height = 24;
  r++;
  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "Cosmetic Finished Product | For External Use Only", { size: 10 });
  ws.getRow(r).height = 16;
  r++;
  r++; // spacer

  ws.mergeCells(r, 1, r, 6);
  setCell(ws, r, 1, "1. IDENTIFICATION", { bold: true, size: 12, align: "left" });
  ws.getRow(r).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }; });
  ws.getRow(r).height = 20;
  r++;

  const idRows: Array<[string, string]> = [
    ["Product Name", msds.product_name || "-"],
    ["Product Code", msds.product_code || "-"],
    ["Product Type", msds.product_type || "-"],
    ["Revision", msds.revision || "-"],
    ["Manufacturer", msds.manufacturer || "-"],
    ["Address", msds.address || "-"],
    ["Tel / Emergency", msds.tel_emergency || "-"],
  ];
  for (const [label, value] of idRows) {
    ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, label, { bold: true, align: "left" });
    ws.mergeCells(r, 3, r, 6); setCell(ws, r, 3, value, { align: "left" });
    border(ws, r, 1, r, 6);
    ws.getRow(r).height = Math.max(20, estimateLines(value, 60) * 14 + 8);
    r++;
  }
  r++; // spacer

  for (const section of msds.sections || []) {
    r = writeSection(ws, r, section);
  }

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
  ws.mergeCells(nameRow, 5, nameRow, 6); setCell(ws, nameRow, 5, msds.approver_name || "-");
  ws.getRow(nameRow).height = 18;
  r++;

  border(ws, labelRow, 5, nameRow, 6);
  await signatureCell(ws, signRow, 5, 6, msds.approver_name || "", msds.approver_confirmed_at, signatures.approver, wb);

  const issueDateRow = r;
  ws.mergeCells(issueDateRow, 5, issueDateRow, 6);
  setCell(ws, issueDateRow, 5, `Issue Date: ${msds.issue_date || "-"}`, { align: "center", wrap: false });
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

    const ALPHA_THRESHOLD = 16;
    const LIGHT_THRESHOLD = 245;
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
    if (maxX < minX || maxY < minY) return image;

    const pad = Math.round(Math.max(w, h) * 0.02);
    const cx0 = Math.max(0, minX - pad);
    const cy0 = Math.max(0, minY - pad);
    const cx1 = Math.min(w, maxX + 1 + pad);
    const cy1 = Math.min(h, maxY + 1 + pad);
    const cw = cx1 - cx0;
    const ch = cy1 - cy0;
    if (cw <= 0 || ch <= 0 || (cw >= w * 0.98 && ch >= h * 0.98)) return image;

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
    return image;
  }
}

async function loadSignatureImage(url: string | null | undefined): Promise<MsdsSignatureImage> {
  if (!url) return null;
  const base64 = await urlToBase64(url);
  if (!base64) return null;
  return trimSignatureWhitespace({ base64, extension: guessExtension(url) });
}

export async function downloadMsdsExcel(msds: ProductMsds, signatureUrls: { approver?: string | null } = {}) {
  const approver = await loadSignatureImage(signatureUrls.approver);
  const wb = await buildMsdsWorkbook(msds, { approver });
  await downloadWorkbook(wb, `MSDS_${msds.product_code || msds.product_name || "product"}.xlsx`);
}
