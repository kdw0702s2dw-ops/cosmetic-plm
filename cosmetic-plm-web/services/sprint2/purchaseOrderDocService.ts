"use client";

import ExcelJS from "exceljs";
import { border, downloadWorkbook } from "@/services/sprint2/documentExcelService";
import { companyDisplayName, type Company } from "@/services/sprint2/companyService";
import type { PurchaseOrder } from "@/services/sprint2/purchaseOrderService";

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
        <td class="l">${esc(it.note || "")}</td>
      </tr>`
    )
    .join("");
  const blankCount = Math.max(0, MIN_ITEM_ROWS - order.items.length);
  const blankRows = Array.from({ length: blankCount })
    .map(() => `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td class="r">-</td><td class="r">-</td><td></td></tr>`)
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
  .seal { width:72px; height:72px; border:1px solid #333; display:flex; align-items:center; justify-content:center; font-size:12px; }
  table.meta { width:100%; border-collapse:collapse; margin-bottom:0; }
  table.meta td { border:1px solid #333; padding:6px 9px; font-size:12px; vertical-align:middle; }
  .label { background:#f3f4f6; font-weight:700; text-align:center; white-space:nowrap; }
  .sum { font-weight:700; padding:7px 9px; border:1px solid #333; border-top:none; font-size:13px; }
  table.items { width:100%; border-collapse:collapse; margin-top:0; }
  table.items th, table.items td { border:1px solid #333; padding:5px 6px; font-size:11.5px; text-align:center; }
  table.items th { background:#f3f4f6; font-weight:700; }
  .l { text-align:left; }
  .r { text-align:right; }
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
    <div class="seal">승 인</div>
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
  <div class="sum">합계금액 : 일금 ${numberToKoreanWon(grandTotal)}</div>

  <table class="items">
    <thead>
      <tr>
        <th style="width:5%;">순번</th><th>품목명/규격</th><th style="width:6%;">단위</th>
        <th style="width:9%;">수량</th><th style="width:11%;">단가</th>
        <th style="width:12%;">공급가액</th><th style="width:11%;">세액</th><th style="width:14%;">비고</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${blankRows}
      <tr>
        <td colspan="5" style="font-weight:700;">합 계</td>
        <td class="r" style="font-weight:700;">${fmtAmount(supplyTotal)}</td>
        <td class="r" style="font-weight:700;">${fmtAmount(vatTotal)}</td>
        <td></td>
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
// ============================================================
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

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

export async function downloadPurchaseOrderExcel(order: PurchaseOrder, supplier: Company | null | undefined, extra: PurchaseOrderDocExtra) {
  const supplierName = companyDisplayName(supplier) || "-";
  const supplyTotal = sumField(order, "supply_amount");
  const vatTotal = sumField(order, "vat_amount");
  const grandTotal = supplyTotal + vatTotal;
  const colCount = 8;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("발주서");
  ws.columns = [{ width: 6 }, { width: 30 }, { width: 8 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 16 }];

  // NO / PAGE
  setCell(ws, 1, 1, `NO : ${order.order_no || ""}`, { align: "left", wrap: false });
  ws.mergeCells(1, 1, 1, 4);
  setCell(ws, 1, 5, "PAGE : 1 / 1", { align: "right", wrap: false });
  ws.mergeCells(1, 5, 1, 8);

  // 제목
  setCell(ws, 2, 1, "발   주   서", { bold: true, size: 20 });
  ws.mergeCells(2, 1, 2, 8);
  ws.getRow(2).height = 32;
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
  ws.mergeCells(metaStart, 4, metaStart, 8);
  setCell(ws, metaStart, 4, PO_ISSUER.biz_no, { align: "left" });

  setCell(ws, metaStart + 1, 3, "상호", { bold: true, fill: true });
  ws.mergeCells(metaStart + 1, 4, metaStart + 1, 5);
  setCell(ws, metaStart + 1, 4, PO_ISSUER.name_kr, { align: "left" });
  setCell(ws, metaStart + 1, 6, "성명", { bold: true, fill: true });
  ws.mergeCells(metaStart + 1, 7, metaStart + 1, 8);
  setCell(ws, metaStart + 1, 7, PO_ISSUER.ceo_name, { align: "left" });

  setCell(ws, metaStart + 2, 3, "주소", { bold: true, fill: true });
  ws.mergeCells(metaStart + 2, 4, metaStart + 2, 8);
  setCell(ws, metaStart + 2, 4, PO_ISSUER.address, { align: "left" });

  setCell(ws, metaStart + 3, 3, "업태", { bold: true, fill: true });
  ws.mergeCells(metaStart + 3, 4, metaStart + 3, 5);
  setCell(ws, metaStart + 3, 4, PO_ISSUER.biz_type, { align: "left" });
  setCell(ws, metaStart + 3, 6, "종목", { bold: true, fill: true });
  ws.mergeCells(metaStart + 3, 7, metaStart + 3, 8);
  setCell(ws, metaStart + 3, 7, PO_ISSUER.biz_item, { align: "left" });

  border(ws, metaStart, 1, metaStart + 3, colCount);

  // 합계금액(일금)
  const sumRowNum = metaStart + 4;
  setCell(ws, sumRowNum, 1, `합계금액 : 일금 ${numberToKoreanWon(grandTotal)}`, { bold: true, align: "left" });
  ws.mergeCells(sumRowNum, 1, sumRowNum, colCount);
  border(ws, sumRowNum, 1, sumRowNum, colCount);

  // 품목 표 헤더
  const tableHeaderRow = sumRowNum + 1;
  const headerLabels = ["순번", "품목명/규격", "단위", "수량", "단가", "공급가액", "세액", "비고"];
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
    setCell(ws, r, 8, it.note || "", { align: "left" });
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
  setCell(ws, r, 8, "", { wrap: false });
  border(ws, r, 1, r, colCount);
  r++;

  // 납기일자/납품장소, 유효일자/결제조건, 비고
  setCell(ws, r, 1, "납기일자", { bold: true, fill: true });
  setCell(ws, r, 2, extra.delivery_date || "", { align: "left" });
  ws.mergeCells(r, 2, r, 3);
  setCell(ws, r, 4, "납품장소", { bold: true, fill: true });
  setCell(ws, r, 5, extra.delivery_place || "", { align: "left" });
  ws.mergeCells(r, 5, r, 8);
  border(ws, r, 1, r, colCount);
  r++;

  setCell(ws, r, 1, "유효일자", { bold: true, fill: true });
  setCell(ws, r, 2, extra.valid_date || "", { align: "left" });
  ws.mergeCells(r, 2, r, 3);
  setCell(ws, r, 4, "결제조건", { bold: true, fill: true });
  setCell(ws, r, 5, extra.payment_terms || "", { align: "left" });
  ws.mergeCells(r, 5, r, 8);
  border(ws, r, 1, r, colCount);
  r++;

  setCell(ws, r, 1, "비고", { bold: true, fill: true });
  setCell(ws, r, 2, extra.note || "", { align: "left" });
  ws.mergeCells(r, 2, r, 8);
  ws.getRow(r).height = Math.max(40, (extra.note || "").split("\n").length * 16);
  border(ws, r, 1, r, colCount);

  await downloadWorkbook(wb, `발주서_${order.order_no || "draft"}_${supplierName}.xlsx`);
}
