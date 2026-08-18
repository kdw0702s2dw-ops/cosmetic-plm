"use client";

import ExcelJS from "exceljs";
import { CONFIDENTIAL } from "@/services/sprint2/documentPdfService";
import { border, downloadWorkbook, writeMetaRows, writeTitleRow } from "@/services/sprint2/documentExcelService";
import type { ProductionRecord } from "@/services/sprint2/productionRecordService";

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

export async function downloadProductionRecordsExcel(
  formula: { formula_code: string; revision: string; formula_name?: string; confirmed_code?: string },
  records: ProductionRecord[]
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("생산실적 검토");
  const colCount = 8;
  ws.columns = [{ width: 14 }, { width: 14 }, { width: 18 }, { width: 16 }, { width: 12 }, { width: 12 }, { width: 16 }, { width: 24 }];

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

  const headerRow = ws.addRow(["생산일자", "EXP", "Lot No.", "목표 제조량(kg)", "코팅량", "성형품 수량", "등록자", "비고"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  records.forEach((r) => {
    const row = ws.addRow([
      r.production_date, r.exp_date || "-", r.lot_no, fmt(r.target_qty_kg), fmt(r.coating_qty), fmt(r.molded_qty), r.created_by || "-", r.note || "-",
    ]);
    border(ws, row.number, 1, row.number, colCount);
  });
  if (records.length === 0) {
    const row = ws.addRow(["저장된 이력이 없습니다."]);
    ws.mergeCells(row.number, 1, row.number, colCount);
  }

  ws.addRow([]);
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };

  await downloadWorkbook(wb, `생산실적검토_${formula.formula_code}_${formula.revision}.xlsx`);
}
