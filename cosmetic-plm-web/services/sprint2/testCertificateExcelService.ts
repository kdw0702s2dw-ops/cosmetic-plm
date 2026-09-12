"use client";

import ExcelJS from "exceljs";
import type { TestCertificate } from "./testCertificateService";
import { border, downloadWorkbook } from "./documentExcelService";
import { NUTRIADVISOR_LOGO_JPEG_BASE64 } from "./testCertificateAssets";

// 반제품/완제품 시험성적서 엑셀 - 업로드된 양식(A~M, 13개 컬럼: No./시험항목(B:C)/시험기준(D:G)/
// 시험방법(H:I)/시험일자(J:K)/시험결과및판정(L:M))의 병합 구조를 그대로 재현한다.
// 행 높이를 지정하지 않으면(Excel 기본 15pt) 여러 줄 내용이 겹쳐 보이는 문제가 있어, 셀 내용의
// 줄 수를 추정해서 행마다 충분한 높이를 직접 지정한다.
//
// 결재란은 "고정 도장 이미지"가 아니라 확정한 담당자 본인이 등록해둔 서명 이미지(plm_signatures)를
// 그대로 삽입한다 - productCoaExcelService.ts에서 이미 검증된 캔버스 중앙 정렬 기법을 그대로
// 적용하되, 이미 동작이 검증된 그 파일을 건드리지 않기 위해 이 파일 안에 독립적으로 복제해서 쓴다.

const MEDIUM: Partial<ExcelJS.Borders> = { top: { style: "medium" }, left: { style: "medium" }, bottom: { style: "medium" }, right: { style: "medium" } };

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

export type CertSignatureImage = { base64: string; extension: "png" | "jpeg" | "gif" } | null;
export type CertSignatureImages = { writer?: CertSignatureImage; reviewer?: CertSignatureImage; approver?: CertSignatureImage };

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

// 서명란 안에서 비율이 깨지지 않도록 최대 폭/높이에 맞춰 축소 배치할 크기를 계산한다.
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

// 서명 이미지를 결재란 박스와 정확히 같은 픽셀 크기의 새 캔버스 중앙에 미리 그려 넣는다.
// Excel/LibreOffice/Google Sheets마다 addImage의 tl.col/tl.row 분수(offset) 앵커 해석이 서로
// 달라 앵커 좌표만으로는 어떤 프로그램에서든 가운데 정렬이 보장되지 않는다. 그래서 "가운데 정렬"
// 자체를 이미지의 픽셀 안에 미리 구워 넣고, 앵커는 박스를 오프셋 없이 꽉 채우도록만 사용한다.
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

// 결재란 서명 셀(작성/검토/승인, 각각 단일 컬럼 K/L/M x 병합된 행 r1~r2) - 담당자가 실제로 해당
// 단계를 "확정"해서 confirmedAt이 기록된 경우에만 서명 이미지를 삽입한다(이름만 적혀 있다고 서명이
// 찍히지 않음). 담당자 자체가 없으면(예: 검토자 미지정) 업로드 양식과 동일하게 대각선으로 "해당
// 없음"을 표시하고, 확정은 되었지만 아직 서명 이미지를 등록하지 않았으면 이름을 대신 표시한다.
// 셀 크기는 실제 지정된 컬럼 폭/행 높이로부터 추정하고, 서명 이미지는 그 박스에 꽉 차도록 중앙
// 정렬해 넣는다.
async function signatureCell(
  ws: ExcelJS.Worksheet,
  r1: number,
  r2: number,
  c: number,
  name: string,
  confirmedAt: string | null | undefined,
  image: CertSignatureImage | undefined,
  wb: ExcelJS.Workbook
) {
  const hasPerson = !!name && name.trim() !== "" && name.trim() !== "-";
  const cell = ws.getCell(r1, c);
  if (!hasPerson) {
    // 기존 얇은 테두리(top/left/right/bottom)는 유지하고 대각선만 추가한다 - border 객체를 통째로
    // 교체하면 앞서 border()로 깔아둔 바깥 테두리가 사라져 셀이 테두리 없이 붕 떠 보이는 문제가 있었다.
    cell.border = { ...cell.border, diagonal: { style: "thin", color: { argb: "FF94A3B8" }, up: true, down: false } };
    return;
  }
  if (confirmedAt && image) {
    try {
      const BOX_W = Math.round((ws.getColumn(c).width || 9) * 7 + 5);
      let rowHeightPtSum = 0;
      for (let rr = r1; rr <= r2; rr++) rowHeightPtSum += ws.getRow(rr).height || 15;
      const BOX_H = Math.round(rowHeightPtSum * (96 / 72));
      const MAX_W = Math.max(10, BOX_W - 10);
      const MAX_H = Math.max(10, BOX_H - 10);
      const composed = await composeSignatureIntoBox(image, BOX_W, BOX_H, MAX_W, MAX_H);
      if (composed) {
        // 이미지 내부에는 서명이 이미 가운데 정렬되어 있다. tl~br 셀 앵커로 지정하면 각 프로그램이
        // 그 시점의 실제 셀 픽셀 크기에 맞춰 이미지를 늘려서 병합 셀을 정확히 채우므로, 우리의
        // BOX_W/BOX_H 추정치가 실제와 조금 달라도 항상 중앙 정렬되어 보인다.
        const imageId = wb.addImage({ base64: composed.base64, extension: composed.extension });
        ws.addImage(imageId, { tl: { col: c - 1, row: r1 - 1 }, br: { col: c, row: r2 } });
      } else {
        // 캔버스 합성이 불가능한 환경이면 기존 방식(비율 유지 + 분수 오프셋)으로 대체한다.
        const imageId = wb.addImage({ base64: image.base64, extension: image.extension });
        const { width, height } = fitSignatureSize(image, MAX_W, MAX_H);
        const colOffset = Math.max(0, (BOX_W - width) / 2) / BOX_W;
        const rowOffset = Math.max(0, (BOX_H - height) / 2) / BOX_H;
        ws.addImage(imageId, { tl: { col: c - 1 + colOffset, row: r1 - 1 + rowOffset }, ext: { width, height } });
      }
    } catch {
      // 이미지 삽입 실패 시 조용히 넘어가고 아래 이름 행만 표시한다(이미 별도로 그려져 있음).
    }
  } else if (confirmedAt) {
    setCell(ws, r1, c, name, { bold: true, size: 10 });
  }
}

// pH 항목(양식상 3번, 반제품/완제품 공통)은 항목명 아래 측정조건 설명이 길어 업로드 양식처럼 작은
// 글자(7pt)로 줄여 표시한다. rich text로 첫 줄(pH)과 나머지 줄(측정조건)의 글자 크기를 다르게 준다.
function setItemLabelCell(ws: ExcelJS.Worksheet, r: number, c: number, item: { no: number; label: string }) {
  const cell = ws.getCell(r, c);
  const lines = String(item.label || "").split("\n");
  if (item.no === 3 && lines.length > 1) {
    cell.value = {
      richText: [
        { font: { name: "굴림체", size: 10 }, text: `${lines[0]}\n` },
        { font: { name: "굴림체", size: 7 }, text: lines.slice(1).join("\n") },
      ],
    };
  } else {
    cell.value = item.label;
    cell.font = { name: "굴림체", size: 10 };
  }
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
}

// 1행부터 lastRow까지 실제로 지정된 행 높이(pt)를 누적해, 그 세로 범위의 픽셀 기준 정중앙에
// imgHeightPx 높이의 이미지를 배치할 때 필요한 0-based 소수 행 앵커(tl.row)를 계산한다.
function computeCenterRowAnchor(ws: ExcelJS.Worksheet, lastRow: number, imgHeightPx: number): number {
  const heightsPx: number[] = [];
  for (let i = 1; i <= lastRow; i++) heightsPx.push((ws.getRow(i).height || 15) * (96 / 72));
  const totalPx = heightsPx.reduce((a, b) => a + b, 0);
  const targetPx = Math.max(0, totalPx / 2 - imgHeightPx / 2);
  let acc = 0;
  for (let i = 0; i < heightsPx.length; i++) {
    if (acc + heightsPx[i] >= targetPx) return i + Math.max(0, targetPx - acc) / heightsPx[i];
    acc += heightsPx[i];
  }
  return Math.max(0, heightsPx.length - 1);
}

// 위와 동일한 방식으로, 1열부터 lastCol까지 실제 컬럼 폭을 누적해 가로 방향 중앙 앵커(tl.col)를 계산한다.
function computeCenterColAnchor(ws: ExcelJS.Worksheet, lastCol: number, imgWidthPx: number): number {
  const widthsPx: number[] = [];
  for (let i = 1; i <= lastCol; i++) widthsPx.push((ws.getColumn(i).width || 8.43) * 7 + 5);
  const totalPx = widthsPx.reduce((a, b) => a + b, 0);
  const targetPx = Math.max(0, totalPx / 2 - imgWidthPx / 2);
  let acc = 0;
  for (let i = 0; i < widthsPx.length; i++) {
    if (acc + widthsPx[i] >= targetPx) return i + Math.max(0, targetPx - acc) / widthsPx[i];
    acc += widthsPx[i];
  }
  return Math.max(0, widthsPx.length - 1);
}

// nutriadvisor 로고를 목표 폭으로 축소해 캔버스에 그린 뒤, 흰색에 가까운 배경 픽셀은 완전 투명
// 처리하고 나머지(로고 선/글자) 픽셀은 지정한 불투명도만큼만 남긴다 - 문서 내용을 가리지 않는
// 옅은 워터마크를 만들기 위함.
async function prepareWatermarkImage(
  base64: string,
  extension: "png" | "jpeg" | "gif",
  opacity: number,
  targetWidthPx: number
): Promise<{ base64: string; width: number; height: number } | null> {
  if (typeof document === "undefined" || !base64) return null;
  try {
    const mime = extension === "png" ? "png" : extension === "gif" ? "gif" : "jpeg";
    const el: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("logo image decode failed"));
      img.src = `data:image/${mime};base64,${base64}`;
    });
    const naturalW = el.naturalWidth;
    const naturalH = el.naturalHeight;
    if (!naturalW || !naturalH) return null;

    const width = Math.round(targetWidthPx);
    const height = Math.round(targetWidthPx * (naturalH / naturalW));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(el, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const LIGHT_THRESHOLD = 245; // 거의 흰색이면 배경으로 간주해 완전히 투명 처리
    for (let i = 0; i < data.length; i += 4) {
      const isNearWhite = data[i] >= LIGHT_THRESHOLD && data[i + 1] >= LIGHT_THRESHOLD && data[i + 2] >= LIGHT_THRESHOLD;
      data[i + 3] = isNearWhite ? 0 : Math.round(data[i + 3] * opacity);
    }
    ctx.putImageData(imageData, 0, 0);

    const outBase64 = canvas.toDataURL("image/png").split(",")[1];
    if (!outBase64) return null;
    return { base64: outBase64, width, height };
  } catch {
    return null;
  }
}

// 페이지 정중앙(표 전체의 가로/세로 중앙)에 옅은 nutriadvisor 로고 워터마크를 삽입한다 - 실패해도
// 문서 생성 자체는 계속되도록 방어한다.
async function addWatermark(ws: ExcelJS.Worksheet, wb: ExcelJS.Workbook, lastRow: number, lastCol: number) {
  try {
    const prepared = await prepareWatermarkImage(NUTRIADVISOR_LOGO_JPEG_BASE64, "jpeg", 0.12, 200);
    if (!prepared) return;
    const imageId = wb.addImage({ base64: prepared.base64, extension: "png" });
    const tlCol = computeCenterColAnchor(ws, lastCol, prepared.width);
    const tlRow = computeCenterRowAnchor(ws, lastRow, prepared.height);
    ws.addImage(imageId, { tl: { col: tlCol, row: tlRow }, ext: { width: prepared.width, height: prepared.height } });
  } catch {
    // 워터마크 삽입 실패는 문서 생성 자체를 막지 않는다.
  }
}

export async function buildCertificateWorkbook(cert: TestCertificate, signatures: CertSignatureImages = {}): Promise<ExcelJS.Workbook> {
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
  const koreanTitle = cert.product_type === "반제품" ? "반제품 시험성적서" : "완제품 시험성적서";
  const englishTitle = cert.product_type === "반제품" ? "Semi-Finished Product (Bulk) Certificate of Analysis" : "Finished Product Certificate of Analysis";
  const titleCell = ws.getCell(2, 2);
  // 영문 부제는 12pt, 한글 제목은 기존과 같은 16pt로 유지 - rich text로 줄마다 다른 글자 크기를 준다.
  titleCell.value = {
    richText: [
      { font: { name: "굴림체", size: 16, bold: true }, text: `${koreanTitle}\n` },
      { font: { name: "굴림체", size: 12, bold: true }, text: englishTitle },
    ],
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
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
  border(ws, 2, 10, 5, 13);
  for (let c = 10; c <= 13; c++) ws.getCell(2, c).border = { ...ws.getCell(2, c).border, top: { style: "medium" } };
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 20;
  // 도장/사선(diagonal) 및 서명 이미지는 얇은 테두리보다 먼저 채워두면 다음 border() 호출이
  // 지워버리므로 반드시 border() 호출보다 뒤에서 개별 셀만 다시 그린다. 서명 이미지 크기 계산은
  // 위에서 지정한 행 높이(3~4행)를 사용하므로 반드시 그 다음에 호출해야 한다.
  await signatureCell(ws, 3, 4, 11, cert.writer_name || "", cert.writer_confirmed_at, signatures.writer, wb);
  await signatureCell(ws, 3, 4, 12, cert.reviewer_name || "", cert.reviewer_confirmed_at, signatures.reviewer, wb);
  await signatureCell(ws, 3, 4, 13, cert.approver_name || "", cert.approver_confirmed_at, signatures.approver, wb);

  ws.getRow(6).height = 8;

  // 헤더 필드 (품목코드/고객사·제품명, 제조번호/시험부서/종합판정)
  let r = 7;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "품목코드", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.item_code || "-");
  ws.mergeCells(r, 6, r, 7); setCell(ws, r, 6, "고객사/제품명", { bold: true });
  ws.mergeCells(r, 8, r, 13); setCell(ws, r, 8, cert.customer_product || "-");
  border(ws, r, 1, r, 13);
  ws.getRow(r).height = 26;
  r++;
  ws.mergeCells(r, 1, r, 2); setCell(ws, r, 1, "제조번호", { bold: true });
  ws.mergeCells(r, 3, r, 5); setCell(ws, r, 3, cert.lot_no || "-");
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
      setItemLabelCell(ws, itemStart, 2, item);
      setCell(ws, itemStart, 8, item.method);
      setCell(ws, itemStart, 10, item.test_date || "");
      border(ws, itemStart, 1, itemEnd, 13);
      r = itemEnd + 1;
    } else {
      const lines = Math.max(estimateLines(item.label, 10), estimateLines(item.spec || "", 22), estimateLines(item.method, 9));
      setCell(ws, r, 1, item.no);
      ws.mergeCells(r, 2, r, 3); setItemLabelCell(ws, r, 2, item);
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

  // 페이지(표 전체) 정중앙에 옅은 nutriadvisor 로고 워터마크 삽입 - 표 내용을 모두 그린 뒤(실제 행
  // 높이가 전부 확정된 뒤) 계산해야 세로 중앙 위치가 정확하다.
  await addWatermark(ws, wb, r - 1, 13);

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

async function loadSignatureImage(url: string | null | undefined): Promise<CertSignatureImage> {
  if (!url) return null;
  const base64 = await urlToBase64(url);
  if (!base64) return null;
  return trimSignatureWhitespace({ base64, extension: guessExtension(url) });
}

export async function downloadCertificateExcel(
  cert: TestCertificate,
  signatureUrls: { writer?: string | null; reviewer?: string | null; approver?: string | null } = {}
) {
  const [writer, reviewer, approver] = await Promise.all([
    loadSignatureImage(signatureUrls.writer),
    loadSignatureImage(signatureUrls.reviewer),
    loadSignatureImage(signatureUrls.approver),
  ]);
  const wb = await buildCertificateWorkbook(cert, { writer, reviewer, approver });
  await downloadWorkbook(wb, `${cert.product_type}_시험성적서_${cert.item_code || cert.formula_code || "cert"}_${cert.lot_no || ""}.xlsx`);
}
