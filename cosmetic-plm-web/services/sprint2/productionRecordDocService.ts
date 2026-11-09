"use client";

import ExcelJS from "exceljs";
import { CONFIDENTIAL } from "@/services/sprint2/documentPdfService";
import { border, downloadWorkbook, writeMetaRows, writeTitleRow } from "@/services/sprint2/documentExcelService";
import type { ProductionRecord } from "@/services/sprint2/productionRecordService";
import type { ProductionLotShipment } from "@/services/sprint2/productionLotShipmentService";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export async function downloadProductionRecordsExcel(
  formula: { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string },
  records: ProductionRecord[],
  // Lot No. -> 공통 출고 레코드 맵(이 처방에 한정, 호출 쪽의 useProductionRecord가 이미 들고 있음).
  // 출고수량(EA/PACK)은 Lot 단위로 1개 값만 관리되므로, 넘겨주면 그 값을 쓰고 없으면(과거 데이터 등)
  // 행 자신의 값으로 대체한다.
  lotShipments?: Map<string, ProductionLotShipment>
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("생산실적 검토");
  const colCount = 10;
  ws.columns = [
    { width: 14 }, { width: 14 }, { width: 18 }, { width: 16 }, { width: 14 }, { width: 14 },
    { width: 12 }, { width: 12 }, { width: 16 }, { width: 24 },
  ];

  writeTitleRow(ws, "생산실적 검토 - Lot No.별 이력", colCount);
  writeMetaRows(
    ws,
    {
      "처방코드": formula.formula_code ?? "",
      "처방명": formula.formula_name ?? "",
      "Revision": formula.revision ?? "",
      "확정코드": formula.confirmed_code ?? "",
    },
    colCount
  );

  const headerRow = ws.addRow([
    "생산일자", "EXP", "Lot No.", "목표 제조량(kg)", "코팅량 (단위: m)", "성형품 수량 (단위: EA)",
    "출고수량(EA, Lot 공통)", "출고수량(PACK, Lot 공통)", "등록자", "비고",
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  records.forEach((r) => {
    const shipment = lotShipments?.get(r.lot_no);
    const row = ws.addRow([
      r.production_date, r.exp_date || "-", r.lot_no, fmt(r.target_qty_kg), fmt(r.coating_qty), fmt(r.molded_qty),
      fmt(shipment ? shipment.shipped_qty_ea : r.shipped_qty_ea),
      fmt(shipment ? shipment.shipped_qty_pack : r.shipped_qty_pack),
      r.created_by || "-", r.note || "-",
    ]);
    border(ws, row.number, 1, row.number, colCount);
  });
  if (records.length === 0) {
    const row = ws.addRow(["저장된 이력이 없습니다."]);
    ws.mergeCells(row.number, 1, row.number, colCount);
  } else {
    const sum = (sel: (r: ProductionRecord) => number | null | undefined) =>
      records.reduce((acc, r) => acc + (sel(r) || 0), 0);
    // 출고수량(EA/PACK)은 Lot 단위로 1개 값만 관리되므로, 같은 Lot으로 등록된 행이 여러 개여도
    // 합계에는 그 Lot당 한 번만 더한다(코팅량/성형품 수량은 행 자체 값이라 그대로 합산).
    const seenLots = new Set<string>();
    let eaTotal = 0;
    let packTotal = 0;
    for (const r of records) {
      if (seenLots.has(r.lot_no)) continue;
      seenLots.add(r.lot_no);
      const shipment = lotShipments?.get(r.lot_no);
      eaTotal += (shipment ? shipment.shipped_qty_ea : r.shipped_qty_ea) || 0;
      packTotal += (shipment ? shipment.shipped_qty_pack : r.shipped_qty_pack) || 0;
    }
    const totalRow = ws.addRow([
      "합계", "", "", "", fmt(sum((r) => r.coating_qty)), fmt(sum((r) => r.molded_qty)),
      fmt(eaTotal), fmt(packTotal), "", "",
    ]);
    totalRow.font = { bold: true };
    border(ws, totalRow.number, 1, totalRow.number, colCount);
  }

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  await downloadWorkbook(wb, `생산실적검토_${formula.formula_code}_${formula.revision}.xlsx`);
}
