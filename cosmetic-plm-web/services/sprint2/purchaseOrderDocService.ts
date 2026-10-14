"use client";

import ExcelJS from "exceljs";
import { border, downloadWorkbook } from "@/services/sprint2/documentExcelService";
import { companyDisplayName, type Company } from "@/services/sprint2/companyService";
import type { PurchaseOrder } from "@/services/sprint2/purchaseOrderService";
import { PO_APPROVAL_STAMP_PNG_BASE64 } from "@/services/sprint2/purchaseOrderAssets";

// 원료 발주관리에서 저장된 발주를 사용자가 올려준 회사 공식 "발주서" 양식(NO/PAGE, 승인란, 발주자/
// 공급받는자 정보, 품목표, 합계금액(일금 ...원정), 납기일자/유효일자/결제조건/비고)에 맞춰 PDF/엑셀로
// 출력한다. PDF는 이 프로젝트의 기존 관례(원료발주가처방 등)와 동일하게 "브라우저 인쇄 -> PDF로 저장"
// 방식을 그대로 따른다(검토 요청사항: 별도 PDF 라이브러리 없이 기존 방식과 일관되게).

// "발주자"(뉴트리어드바이저 자사) 고정 정보 - 사업자등록 정보라 자주 바뀌지 않으므로 설정 화면 없이
// 코드에 고정값으로 둔다(검토 요청사항: "코드에 고정값으로 넣기"). 나중에 바뀌면 이 상수만 수정하면 됨.
export const PO_ISSUER = {
  name_kr: "주식회사 뉴트리어드바이저",
  ceo_name: "이지혜",
  biz_no: "652-81-01833",
  address: "경상남도 김해시 인제로 197, 창조관 402-1(어방동, 인제대학교)",
  biz_type: "제조업",
  biz_item: "화장품책임판매업",
  tel: "-",
  fax: "-",
  email: "nutriadvisor@naver.com",
};

// 납기일자/유효일자/결제조건/비고/납품장소는 저장된 발주 데이터에 없는 항목이라, 발주서를 만들 때마다
// 화면에서 입력/수정하게 한다(검토 요청사항: 지금은 빈칸 기본값 + 그 자리에서 수정 가능하게).
// 아래 기본값은 사용자가 올려준 양식 예시에 있던 문구를 그대로 가져온 것으로, 매번 다르면 생성 시 고치면 됨.
export const DEFAULT_DELIVERY_PLACE = "㈜뉴트리어드바이저";
export const DEFAULT_PO_NOTE =
  "* 제품배송은 아래 주소로 부탁드립니다.\n" +
  "주소: 경기도 수원시 영통구 중부대로 448번길 97 삼성테크노파크 403호 뉴트리어드바이저 담당자 앞\n" +
  "연락처: 010-4938-8472 / 박선우";

export type PurchaseOrderDocExtra = {
  delivery_date?: string; // 납기일자
  valid_date?: string; // 유효일자
  payment_terms?: string; // 결제조건
  delivery_place?: string; // 납품장소
  note?: string; // 비고
};

// 품목 표 최소 줄 수 - 양식 예시처럼 품목이 적어도 표 아래쪽에 빈 줄(-)이 어느 정도 보이게 한다.
const MIN_ITEM_ROWS = 14;

function fmtAmount(n: number | null | undefined) {
  const v = Math.round(n || 0);
  return v.toLocaleString("ko-KR");
}
function fmtQty(n: number | null | undefined) {
  const v = Number(n || 0);
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 3 });
}

// ---- 금액을 한글 "일금 ...원정"으로 변환 ----
const KOR_DIGIT = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const KOR_SMALL_UNIT = ["", "십", "백", "천"];
const KOR_BIG_UNIT = ["", "만", "억", "조", "경"];

function fourDigitsToKorean(n: number): string {
  if (n <= 0) return "";
  const digits = String(n).padStart(4, "0").split("").map(Number);
  let s = "";
  digits.forEach((d, i) => {
    if (d === 0) return;
    const unit = KOR_SMALL_UNIT[3 - i];
    // 십/백/천 자리의 "1"은 관용적으로 생략(예: "일십" X -> "십")하되, 단위가 없는 마지막(일의) 자리는 그대로 "일" 표기.
    s += d === 1 && unit ? unit : KOR_DIGIT[d] + unit;
  });
  return s;
}

export function numberToKoreanWon(amount: number): string {
  const n = Math.round(Math.max(0, amount || 0));
  if (n === 0) return "영원정";
  let remain = n;
  let bigIdx = 0;
  const parts: string[] = [];
  while (remain > 0) {
    const group = remain % 10000;
    if (group > 0) parts.unshift(fourDigitsToKorean(group) + (KOR_BIG_UNIT[bigIdx] || ""));
    remain = Math.floor(remain / 10000);
    bigIdx++;
  }
  return parts.join("") + "원정";
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sumField(order: PurchaseOrder, field: "supply_amount" | "vat_amount" | "total_amount") {
  return order.items.reduce((s, i) => s + (i[field] || 0), 0);
}

// ============================================================
// PDF (브라우저 인쇄 -> PDF로 저장)
// ============================================================
export function buildPurchaseOrderHtml(order: PurchaseOrder, supplier: Company | null | undefined, extra: PurchaseOrderDocExtra): string {
  const supplierName = companyDisplayName(supplier) || "-";
  const supplyTotal = sumField(order, "supply_amount");
  const vatTotal = sumField(order, "vat_amount");
  const grandTotal = supplyTotal + vatTotal;

  // 품목별 "비고"(발주 초안 생성 시 자동으로 들어가는 "제조량 확인 · 합산 부족 원료 목록에서 생성" 같은
  // 내부용 문구)는 발주서에는 불필요한 내용이라 표에서 아예 뺀다(검토 요청사항). 전체 비고(아래 footer의
  // 배송 안내 등)는 별도 항목이라 그대로 유지한다.
  const itemRows = order.items
    .map(
      (it, idx) => `<tr>
        <td>${idx + 1}</td>
        <td class="l">${esc(it.raw_name || it.trade_name || it.raw_code)}</td>
        <td>${esc(it.unit || "")}</td>
        <td class="r">${fmtQty(it.quantity)}</td>
        <td class="r">${fmtAmount(it.unit_price)}</td>
        <td class="r">${fmtAmount(it.supply_amount)}</td>
        <td class="r">${fmtAmount(it.vat_amount)}</td>
      </tr>`
    )
    .join("");
  const blankCount = Math.max(0, MIN_ITEM_ROWS - order.items.length);
  const blankRows = Array.from({ length: blankCount })
    .map(() => `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td class="r">-</td><td class="r">-</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<title>발주서 ${esc(order.order_no || "")}</title>
<style>
  * { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; box-sizing: border-box; }
  body { padding: 26px; color: #111827; font-size: 12px; }
  .topline { display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; }
  .headrow { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
  .headrow .spacer { width:72px; }
  .headline { flex:1; text-align:center; font-size:26px; font-weight:800; letter-spacing:16px; }
  .seal { width:72px; height:72px; border:1px solid #333; display:flex; align-items:center; justify-content:center; font-size:12px; overflow:hidden; }
  .seal img { max-width:100%; max-height:100%; object-fit:contain; }
  table.meta { width:100%; border-collapse:collapse; margin-bottom:0; }
  table.meta td { border:1px solid #333; padding:6px 9px; font-size:12px; vertical-align:middle; }
  .label { background:#f3f4f6; font-weight:700; text-align:center; white-space:nowrap; }
  .sum { font-weight:700; padding:7px 9px; border:1px solid #333; border-top:none; font-size:13px; }
  table.items { width:100%; border-collapse:collapse; margin-top:0; }
  table.items th, table.items td { border:1px solid #333; padding:5px 6px; font-size:11.5px; text-align:center; }
  table.items th { background:#f3f4f6; font-weight:700; }
  .l { text-align:left; }
  .r { text-align:right; }
  .grandtotal td { font-weight:800; font-size:12.5px; background:#f8fafc; }
  table.footer { width:100%; border-collapse:collapse; margin-top:0; }
  table.footer td { border:1px solid #333; padding:6px 9px; font-size:12px; vertical-align:top; }
  .note-cell { white-space:pre-line; }
  @media print { body { padding:0; } }
</style></head>
<body>
  <div class="topline"><span>NO : ${esc(order.order_no || "")}</span><span>PAGE : 1 / 1</span></div>
  <div class="headrow">
    <div class="spacer"></div>
    <div class="headline">발 주 서</div>
    <div class="seal"><img src="data:image/png;base64,${PO_APPROVAL_STAMP_PNG_BASE64}" alt="승인" /></div>
  </div>

  <table class="meta">
    <tr>
      <td rowspan="4" style="width:34%;">
        <div style="font-size:14px;font-weight:700;">${esc(supplierName)} 귀하</div>
        <div style="margin-top:10px;">발주일자 : ${esc(order.order_date)}</div>
        <div>TEL : ${esc(supplier?.phone || "-")}&nbsp;&nbsp;&nbsp;&nbsp;FAX : -</div>
        <div style="margin-top:10px;">납기일 내에 인도해 주시기 바랍니다.</div>
      </td>
      <td class="label" style="width:11%;">등록번호</td>
      <td colspan="3">${esc(PO_ISSUER.biz_no)}</td>
    </tr>
    <tr>
      <td class="label">상호</td><td>${esc(PO_ISSUER.name_kr)}</td>
      <td class="label" style="width:9%;">성명</td><td>${esc(PO_ISSUER.ceo_name)}</td>
    </tr>
    <tr>
      <td class="label">주소</td><td colspan="3">${esc(PO_ISSUER.address)}</td>
    </tr>
    <tr>
      <td class="label">업태</td><td>${esc(PO_ISSUER.biz_type)}</td>
      <td class="label">종목</td><td>${esc(PO_ISSUER.biz_item)}</td>
    </tr>
  </table>
  <div class="sum">합계금액 : 일금 ${numberToKoreanWon(grandTotal)} (₩${fmtAmount(grandTotal)})</div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:6%;">순번</th><th>품목명/규격</th><th style="width:7%;">단위</th>
        <th style="width:10%;">수량</th><th style="width:13%;">단가</th>
        <th style="width:14%;">공급가액</th><th style="width:13%;">세액</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${blankRows}
      <tr>
        <td colspan="5" style="font-weight:700;">합 계</td>
        <td class="r" style="font-weight:700;">${fmtAmount(supplyTotal)}</td>
        <td class="r" style="font-weight:700;">${fmtAmount(vatTotal)}</td>
      </tr>
      <tr class="grandtotal">
        <td colspan="5">총 합계 (VAT 포함)</td>
        <td class="r" colspan="2">₩ ${fmtAmount(grandTotal)}</td>
      </tr>
    </tbody>
  </table>

  <table class="footer">
    <tr>
      <td class="label" style="width:15%;">납기일자</td><td style="width:35%;">${esc(extra.delivery_date || "")}</td>
      <td class="label" style="width:15%;">납품장소</td><td>${esc(extra.delivery_place || "")}</td>
    </tr>
    <tr>
      <td class="label">유효일자</td><td>${esc(extra.valid_date || "")}</td>
      <td class="label">결제조건</td><td>${esc(extra.payment_terms || "")}</td>
    </tr>
    <tr>
      <td class="label">비고</td><td colspan="3" class="note-cell">${esc(extra.note || "")}</td>
    </tr>
  </table>

  <script>window.onload = () => { window.print(); }</script>
</body></html>`;
}

export function printPurchaseOrder(order: PurchaseOrder, supplier: Company | null | undefined, extra: PurchaseOrderDocExtra) {
  const html = buildPurchaseOrderHtml(order, supplier, extra);
  const w = window.open("", "_blank");
  if (!w) {
    alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

// ============================================================
// 엑셀 (.xlsx) - 위 PDF 양식과 같은 구조를 exceljs 표/병합/테두리로 재현.
// 품목별 "비고" 컬럼은 발주서에 불필요해 뺐고(검토 요청사항), 그만큼 전체 7컬럼으로 줄었다
// (순번/품목명/단위/수량/단가/공급가액/세액).
// ============================================================
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
const COL_COUNT = 7;

function setCell(
  ws: ExcelJS.Worksheet,
  r: number,
  c: number,
  value: ExcelJS.CellValue,
  opts?: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; fill?: boolean; wrap?: boolean }
) {
  const cell = ws.getCell(r, c);
  cell.value = value;
  cell.font = { name: "굴림체", size: opts?.size ?? 10, bold: !!opts?.bold };
  cell.alignment = { horizontal: opts?.align ?? "center", vertical: "middle", wrapText: opts?.wrap ?? true };
  if (opts?.fill) cell.fill = HEADER_FILL;
  return cell;
}

// PNG의 IHDR 청크에서 원본 가로/세로 픽셀 크기를 읽어온다 - 도장 이미지 비율을 유지한 채 배치하기 위함
// (productCoaExcelService.ts의 동일한 헬퍼와 같은 방식).
function getPngPixelSize(base64: string): { width: number; height: number } | null {
  try {
    const bin = atob(base64);
    if (bin.length < 24) return null;
    const readU32 = (offset: number) =>
      (((bin.charCodeAt(offset) << 24) | (bin.charCodeAt(offset + 1) << 16) | (bin.charCodeAt(offset + 2) << 8) | bin.charCodeAt(offset + 3)) >>> 0);
    return { width: readU32(16), height: readU32(20) };
  } catch {
    return null;
  }
}

// 승인 도장을 박스(boxWidth x boxHeight)와 정확히 같은 픽셀 크기의 새 캔버스 중앙에 미리 그려 넣는다.
// Excel/LibreOffice/Google Sheets마다 addImage의 앵커 해석이 조금씩 달라, 셀 픽셀 크기를 우리가
// 추정한 값(estimate)과 실제 렌더링 값이 달라도 - 이 캔버스를 tl~br(셀을 정확히 채우는 앵커)로 넣으면
// 각 프로그램이 "그 시점의 실제 셀 크기"에 맞춰 캔버스 전체를 늘리므로 그 안에 이미 중앙 정렬해 그려둔
// 도장은 항상 박스 경계와 정확히 맞고, 패딩이 있어 약간 늘어나도 도장 자체가 찌그러져 보이지 않는다
// (지난 번 승인란이 "칸이랑 도장 사이즈가 안 맞는다"는 문제의 근본 원인 - 고정 ext 크기로 왼쪽 위에만
// 작게 배치했던 것을 이 방식으로 교체).
async function composeStampIntoBox(boxWidth: number, boxHeight: number, maxWidth: number, maxHeight: number): Promise<{ base64: string; extension: "png" } | null> {
  if (typeof document === "undefined") return null;
  try {
    const el: HTMLImageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("stamp image decode failed"));
      img.src = `data:image/png;base64,${PO_APPROVAL_STAMP_PNG_BASE64}`;
    });
    const naturalW = el.naturalWidth || getPngPixelSize(PO_APPROVAL_STAMP_PNG_BASE64)?.width || 1;
    const naturalH = el.naturalHeight || getPngPixelSize(PO_APPROVAL_STAMP_PNG_BASE64)?.height || 1;
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
    return base64 ? { base64, extension: "png" } : null;
  } catch {
    return null;
  }
}

// 승인 도장 박스(F1:G2 병합) 삽입 - composeStampIntoBox가 성공하면(브라우저 환경) 박스에 꽉 맞춘
// 캔버스를 tl~br로 채워 넣고, 실패하면(캔버스를 못 쓰는 환경 등) 기존처럼 비율 유지 + ext 고정 크기로
// 대체한다(완전히 실패하면 조용히 건너뛰고 빈 박스만 남긴다 - 승인란이 비어 있어도 나머지 발주서 생성은
// 막지 않는다).
async function addApprovalStamp(ws: ExcelJS.Worksheet, wb: ExcelJS.Workbook, r1: number, c1: number, r2: number, c2: number, boxWidth: number, boxHeight: number) {
  try {
    const composed = await composeStampIntoBox(boxWidth, boxHeight, 60, 60);
    if (composed) {
      const imageId = wb.addImage({ base64: composed.base64, extension: composed.extension });
      ws.addImage(imageId, { tl: { col: c1 - 1, row: r1 - 1 }, br: { col: c2, row: r2 } });
      return;
    }
    const natural = getPngPixelSize(PO_APPROVAL_STAMP_PNG_BASE64);
    const aspect = natural ? natural.width / natural.height : 1;
    let width = Math.min(60, boxWidth);
    let height = width / aspect;
    if (height > boxHeight) {
      height = boxHeight;
      width = height * aspect;
    }
    const colOffset = Math.max(0, (boxWidth - width) / 2) / boxWidth;
    const rowOffset = Math.max(0, (boxHeight - height) / 2) / boxHeight;
    const imageId = wb.addImage({ base64: PO_APPROVAL_STAMP_PNG_BASE64, extension: "png" });
    ws.addImage(imageId, { tl: { col: c1 - 1 + colOffset * (c2 - c1 + 1), row: r1 - 1 + rowOffset * (r2 - r1 + 1) }, ext: { width: Math.round(width), height: Math.round(height) } });
  } catch {
    // 도장 삽입 실패 시 조용히 넘어가고 빈 박스만 남긴다.
  }
}

export async function downloadPurchaseOrderExcel(order: PurchaseOrder, supplier: Company | null | undefined, extra: PurchaseOrderDocExtra) {
  const supplierName = companyDisplayName(supplier) || "-";
  const supplyTotal = sumField(order, "supply_amount");
  const vatTotal = sumField(order, "vat_amount");
  const grandTotal = supplyTotal + vatTotal;
  const colCount = COL_COUNT;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("발주서");
  // A 순번, B 품목명/규격, C 단위, D 수량, E 단가, F 공급가액, G 세액 (비고 컬럼 삭제로 7컬럼).
  // E/F/G를 넉넉히 잡아야 "상호"(발주자 상호 D:E 병합) 같은 긴 텍스트가 한 줄에서 잘리지 않는다
  // (지난 번 "주식회사 뉴트리어드바이저"가 칸에서 잘려 보이던 문제의 원인 - 좁은 컬럼 폭 + 얇은 행
  // 높이가 겹쳐서 줄바꿈된 두 번째 줄이 가려졌었다. 컬럼을 넓히고 아래에서 관련 행 높이도 함께 키운다).
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 8 }, { width: 10 }, { width: 16 }, { width: 14 }, { width: 16 }];

  // NO / PAGE - 오른쪽 위(F:G, 1~2행)는 승인 도장 박스로 비워둔다.
  setCell(ws, 1, 1, `NO : ${order.order_no || ""}`, { align: "left", wrap: false });
  ws.mergeCells(1, 1, 1, 3);
  setCell(ws, 1, 4, "PAGE : 1 / 1", { align: "right", wrap: false });
  ws.mergeCells(1, 4, 1, 5);
  ws.getRow(1).height = 26;

  // 제목
  setCell(ws, 2, 1, "발   주   서", { bold: true, size: 20 });
  ws.mergeCells(2, 1, 2, 5);
  ws.getRow(2).height = 34;

  // 승인 도장 박스 (F1:G2) - 박스 크기(픽셀)를 컬럼 폭(F=14,G=16 단위 -> 대략 103+117px)과 행 높이
  // (26+34pt -> 대략 80px)로 추정해서, 그 크기에 정확히 맞춘 캔버스를 addApprovalStamp가 그려 넣는다.
  ws.mergeCells(1, 6, 2, 7);
  border(ws, 1, 6, 2, 7);
  await addApprovalStamp(ws, wb, 1, 6, 2, 7, 220, 80);

  ws.addRow([]);

  // 공급받는자 / 발주자 정보 (4행, 공급받는자 칸은 세로 병합)
  const metaStart = 4;
  ws.mergeCells(metaStart, 1, metaStart + 3, 2);
  setCell(
    ws,
    metaStart,
    1,
    `${supplierName} 귀하\n\n발주일자 : ${order.order_date}\nTEL : ${supplier?.phone || "-"}    FAX : -\n\n납기일 내에 인도해 주시기 바랍니다.`,
    { align: "left", wrap: true }
  );
  ws.getRow(metaStart).height = 90;

  setCell(ws, metaStart, 3, "등록번호", { bold: true, fill: true });
  ws.mergeCells(metaStart, 4, metaStart, 7);
  setCell(ws, metaStart, 4, PO_ISSUER.biz_no, { align: "left" });

  setCell(ws, metaStart + 1, 3, "상호", { bold: true, fill: true });
  ws.mergeCells(metaStart + 1, 4, metaStart + 1, 5);
  setCell(ws, metaStart + 1, 4, PO_ISSUER.name_kr, { align: "left" });
  setCell(ws, metaStart + 1, 6, "성명", { bold: true, fill: true });
  setCell(ws, metaStart + 1, 7, PO_ISSUER.ceo_name, { align: "left" });

  setCell(ws, metaStart + 2, 3, "주소", { bold: true, fill: true });
  ws.mergeCells(metaStart + 2, 4, metaStart + 2, 7);
  setCell(ws, metaStart + 2, 4, PO_ISSUER.address, { align: "left" });

  setCell(ws, metaStart + 3, 3, "업태", { bold: true, fill: true });
  ws.mergeCells(metaStart + 3, 4, metaStart + 3, 5);
  setCell(ws, metaStart + 3, 4, PO_ISSUER.biz_type, { align: "left" });
  setCell(ws, metaStart + 3, 6, "종목", { bold: true, fill: true });
  setCell(ws, metaStart + 3, 7, PO_ISSUER.biz_item, { align: "left" });

  // 상호/주소/업태 행은 원래 기본 행 높이(약 15pt)로는 두 줄로 줄바꿈된 텍스트가 잘려 보일 수 있어
  // (예: "주식회사 뉴트리어드바이저" 13자) 세 행 모두 여유 있게 키운다 - 컬럼을 넓혀도 렌더러마다
  // 글자 폭 계산이 조금씩 달라(Excel/LibreOffice/Google Sheets) 한 줄에 다 안 들어갈 수 있는데,
  // 행이 충분히 높으면 두 줄로 줄바꿈되어도 잘리지 않고 전부 보인다.
  ws.getRow(metaStart + 1).height = 28;
  ws.getRow(metaStart + 2).height = 28;
  ws.getRow(metaStart + 3).height = 28;

  border(ws, metaStart, 1, metaStart + 3, colCount);

  // 합계금액(일금)
  const sumRowNum = metaStart + 4;
  setCell(ws, sumRowNum, 1, `합계금액 : 일금 ${numberToKoreanWon(grandTotal)} (₩${fmtAmount(grandTotal)})`, { bold: true, align: "left" });
  ws.mergeCells(sumRowNum, 1, sumRowNum, colCount);
  border(ws, sumRowNum, 1, sumRowNum, colCount);

  // 품목 표 헤더 - 품목별 "비고"는 발주서에 불필요해 뺐다(검토 요청사항).
  const tableHeaderRow = sumRowNum + 1;
  const headerLabels = ["순번", "품목명/규격", "단위", "수량", "단가", "공급가액", "세액"];
  headerLabels.forEach((label, i) => setCell(ws, tableHeaderRow, i + 1, label, { bold: true, fill: true }));
  border(ws, tableHeaderRow, 1, tableHeaderRow, colCount);

  let r = tableHeaderRow + 1;
  for (const it of order.items) {
    setCell(ws, r, 1, "", { wrap: false });
    ws.getCell(r, 1).value = order.items.indexOf(it) + 1;
    setCell(ws, r, 2, it.raw_name || it.trade_name || it.raw_code, { align: "left" });
    setCell(ws, r, 3, it.unit || "", { wrap: false });
    setCell(ws, r, 4, it.quantity || 0, { align: "right", wrap: false });
    ws.getCell(r, 4).numFmt = "#,##0.###";
    setCell(ws, r, 5, it.unit_price || 0, { align: "right", wrap: false });
    ws.getCell(r, 5).numFmt = "#,##0.###";
    setCell(ws, r, 6, it.supply_amount || 0, { align: "right", wrap: false });
    ws.getCell(r, 6).numFmt = "#,##0";
    setCell(ws, r, 7, it.vat_amount || 0, { align: "right", wrap: false });
    ws.getCell(r, 7).numFmt = "#,##0";
    border(ws, r, 1, r, colCount);
    r++;
  }
  const blankCount = Math.max(0, MIN_ITEM_ROWS - order.items.length);
  for (let i = 0; i < blankCount; i++) {
    setCell(ws, r, 6, "-", { align: "right", wrap: false });
    setCell(ws, r, 7, "-", { align: "right", wrap: false });
    border(ws, r, 1, r, colCount);
    r++;
  }

  setCell(ws, r, 1, "합    계", { bold: true });
  ws.mergeCells(r, 1, r, 5);
  setCell(ws, r, 6, supplyTotal, { bold: true, align: "right", wrap: false });
  ws.getCell(r, 6).numFmt = "#,##0";
  setCell(ws, r, 7, vatTotal, { bold: true, align: "right", wrap: false });
  ws.getCell(r, 7).numFmt = "#,##0";
  border(ws, r, 1, r, colCount);
  r++;

  // 총 합계(VAT 포함) - 공급가액/세액 합계는 바로 위 행에 이미 있지만, 그 둘을 더한 최종 금액이 따로
  // 안 보인다는 요청사항이 있어 강조된 한 줄로 추가한다(위쪽 "합계금액: 일금 ..." 줄은 한글 표기라
  // 숫자로도 바로 확인할 수 있게 여기 추가).
  setCell(ws, r, 1, "총 합계 (VAT 포함)", { bold: true, fill: true });
  ws.mergeCells(r, 1, r, 5);
  setCell(ws, r, 6, grandTotal, { bold: true, align: "right", wrap: false, size: 11 });
  ws.getCell(r, 6).numFmt = "#,##0";
  ws.mergeCells(r, 6, r, 7);
  border(ws, r, 1, r, colCount);
  ws.getRow(r).height = 20;
  r++;

  // 납기일자/납품장소, 유효일자/결제조건, 비고(전체 배송 안내 등 - 품목별 비고와는 다른 항목이라 유지)
  setCell(ws, r, 1, "납기일자", { bold: true, fill: true });
  setCell(ws, r, 2, extra.delivery_date || "", { align: "left" });
  ws.mergeCells(r, 2, r, 3);
  setCell(ws, r, 4, "납품장소", { bold: true, fill: true });
  setCell(ws, r, 5, extra.delivery_place || "", { align: "left" });
  ws.mergeCells(r, 5, r, 7);
  border(ws, r, 1, r, colCount);
  r++;

  setCell(ws, r, 1, "유효일자", { bold: true, fill: true });
  setCell(ws, r, 2, extra.valid_date || "", { align: "left" });
  ws.mergeCells(r, 2, r, 3);
  setCell(ws, r, 4, "결제조건", { bold: true, fill: true });
  setCell(ws, r, 5, extra.payment_terms || "", { align: "left" });
  ws.mergeCells(r, 5, r, 7);
  border(ws, r, 1, r, colCount);
  r++;

  setCell(ws, r, 1, "비고", { bold: true, fill: true });
  setCell(ws, r, 2, extra.note || "", { align: "left" });
  ws.mergeCells(r, 2, r, 7);
  ws.getRow(r).height = Math.max(40, (extra.note || "").split("\n").length * 16);
  border(ws, r, 1, r, colCount);

  await downloadWorkbook(wb, `발주서_${order.order_no || "draft"}_${supplierName}.xlsx`);
}
