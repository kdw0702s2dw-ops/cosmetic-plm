"use client";

import ExcelJS from "exceljs";
import { fetchRawMaterialsByCodes } from "@/services/sprint2/rawMaterialService";
import { fetchIngredientFunctionEntries } from "@/services/sprint2/ingredientDictionaryService";
import {
  ALLERGEN_BASE_LINE,
  basisFileSuffix,
  basisTitleSuffix,
  type BasisAllergenAlert,
  buildComplexGroupedRows,
  buildIngredientFunctionLookup,
  complexRows,
  computeBasisAllergenAlerts,
  computeUniformFinalPercentDecimals,
  computeUniformPercentDecimals,
  CONFIDENTIAL,
  type DocBasis,
  type DocLang,
  exactAdd,
  exactDecimalToNumber,
  exactDecimalToString,
  fetchFormulaLinesForPdf,
  fixedPct,
  kovasMeta,
  langColumns,
  langFileSuffix,
  langListBoxTitle,
  mergeRows,
  pickLangValue,
  NOTES,
  orderSheetMeta,
  OrderSheetRow,
  pct,
  resolveLinesForBasis,
  singleRows,
  toExactDecimal,
} from "@/services/sprint2/documentPdfService";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

export function border(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = THIN_BORDER;
    }
  }
}

// PDF(baseHtml)의 <div class="doctitle">와 동일한 문서 제목 1행 (전체 폭 병합, 굵게, 가운데정렬)
export function writeTitleRow(ws: ExcelJS.Worksheet, title: string, colCount: number) {
  const row = ws.addRow([title]);
  ws.mergeCells(row.number, 1, row.number, colCount);
  const cell = ws.getCell(row.number, 1);
  cell.font = { bold: true, size: 14 };
  cell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(row.number).height = 24;
}

// PDF(kovasMeta)의 <table class="meta"> 라벨:값 6행과 동일한 내용을 그대로 재사용
// 라벨을 1~2번 컬럼에 병합해서 쓴다 - 표 본문의 "No." 컬럼(폭 6)과 컬럼을 공유하다 보니
// 라벨(예: "Product name acc. To package")이 한 컬럼 폭만으로는 잘려 보이는 문제가 있었음.
export function writeMetaRows(ws: ExcelJS.Worksheet, meta: Record<string, string>, colCount: number) {
  for (const [label, value] of Object.entries(meta)) {
    const row = ws.addRow(["", "", "", ""]);
    ws.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: false, color: { argb: "FF334155" } };
    row.getCell(3).value = ":";
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(4).value = value;
    if (colCount > 4) {
      ws.mergeCells(row.number, 4, row.number, colCount);
    }
  }
  ws.addRow([]);
}

// PDF(NOTES + ALLERGEN_BASE_LINE + CONFIDENTIAL)와 텍스트를 한 글자도 다르지 않게 그대로 재사용
function writeFooterNotes(ws: ExcelJS.Worksheet, colCount: number) {
  ws.addRow([]);
  for (const note of [...NOTES, ALLERGEN_BASE_LINE]) {
    const row = ws.addRow([note]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).font = { italic: true, size: 9, color: { argb: "FF475569" } };
  }
  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };
}

// PDF(allergenSection)와 동일한 "표시대상 성분" 표를 하단에 렌더링한다. 지금까지 엑셀은 이 표 없이
// ALLERGEN_BASE_LINE 각주 문구만 텍스트로 써왔는데, PDF 미리보기에는 있는 표가 엑셀 다운로드에는
// 통째로 빠져 있던 것 - "PDF는 업데이트됐는데 엑셀은 그대로다"라고 보고받은 문제의 실제 원인이다.
// exposure_type 미지정/표시대상 0건/표시대상 있음 3가지 분기와 문구를 PDF와 동일하게 맞춘다.
function writeFooterNotesWithAllergenTable(
  ws: ExcelJS.Worksheet,
  colCount: number,
  formula: any,
  basisAlerts: BasisAllergenAlert[] | null
) {
  ws.addRow([]);
  for (const note of NOTES) {
    const row = ws.addRow([note]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).font = { italic: true, size: 9, color: { argb: "FF475569" } };
  }

  const italicNote = (text: string, color = "FF475569") => {
    const row = ws.addRow([text]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).font = { italic: true, size: 9, color: { argb: color } };
  };

  if (!formula.exposure_type) {
    italicNote(ALLERGEN_BASE_LINE);
    italicNote(
      "제품 사용유형이 미지정되어 알러젠 표시 여부를 계산할 수 없습니다. 처방관리에서 Leave-on/Rinse-off를 먼저 지정해주세요.",
      "FFB91C1C"
    );
  } else {
    const label = formula.exposure_type === "LEAVE_ON" ? "Leave-on" : "Rinse-off";
    italicNote(`${ALLERGEN_BASE_LINE} (적용기준: ${label})`);

    // 표시 의무가 있는(기준치 초과) 알러젠만 표에 올린다 - PDF와 동일한 필터링.
    const requiredAlerts = (basisAlerts || []).filter((a) => a.label_required);
    if (requiredAlerts.length === 0) {
      italicNote("표시 대상 알러젠 성분 없음 (No allergen ingredient requires labeling)", "FF64748B");
    } else {
      // 표 컬럼 폭이 문서마다(단일/복합/전성분) 다르므로 고정 컬럼 수 대신 마지막 2개 컬럼을
      // 최종함량/표시여부로 쓰고 나머지 전부를 성분명 칸으로 병합한다.
      const nameColEnd = Math.max(1, colCount - 2);
      const percentCol = nameColEnd + 1;
      const requiredCol = colCount;

      const headerRow = ws.addRow([]);
      ws.mergeCells(headerRow.number, 1, headerRow.number, nameColEnd);
      headerRow.getCell(1).value = "표시대상 성분 (Allergen Ingredient)";
      headerRow.getCell(percentCol).value = "최종함량(%) (Final Content(%))";
      if (requiredCol > percentCol) {
        ws.mergeCells(headerRow.number, requiredCol, headerRow.number, requiredCol);
      }
      headerRow.getCell(requiredCol).value = "표시여부 (Labeling Required)";
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      });
      border(ws, headerRow.number, 1, headerRow.number, colCount);

      // 이 표에는 위에서 이미 label_required(기준치 초과)만 걸러 두었으므로 표시여부는 항상 Y.
      // 국문명이 없는 항목(plm_allergen_master.allergen_name_kr 미입력)은 PDF와 동일하게 영문명만 단독 표기.
      for (const a of requiredAlerts) {
        const row = ws.addRow([]);
        ws.mergeCells(row.number, 1, row.number, nameColEnd);
        row.getCell(1).value = a.allergen_name_kr ? `${a.allergen_name_kr} (${a.allergen_name_en})` : a.allergen_name_en;
        row.getCell(percentCol).value = `${pct(a.formula_percent)}%`;
        row.getCell(percentCol).alignment = { horizontal: "right" };
        if (requiredCol > percentCol) {
          ws.mergeCells(row.number, requiredCol, row.number, requiredCol);
        }
        row.getCell(requiredCol).value = "Y";
        row.getCell(requiredCol).alignment = { horizontal: "center" };
        row.alignment = { vertical: "middle" };
        border(ws, row.number, 1, row.number, colCount);
      }
    }
  }

  const confRow = ws.addRow([CONFIDENTIAL]);
  ws.mergeCells(confRow.number, 1, confRow.number, colCount);
  confRow.getCell(1).font = { size: 8, color: { argb: "FF94A3B8" } };
}

// wrapText 셀의 필요한 행 높이를 텍스트 길이 기준으로 추정한다.
// Excel의 "열 너비" 단위는 대략 라틴 문자 1개 폭과 비슷하고 한글 등 전각 문자는 그 2배 폭을 차지하므로,
// 문자마다 가중치를 둬서 총 폭 대비 줄바꿈 횟수를 계산한다. 실제 Excel 폭 계산과 완전히 같지는 않으므로
// 보수적으로(칸수를 살짝 줄이고 줄 높이를 넉넉히 잡아) 텍스트가 잘리는 대신 여백이 조금 남는 쪽으로 잡는다.
function estimateWrappedRowHeight(text: string, totalColWidth: number, lineHeightPt = 15) {
  let weightedLength = 0;
  for (const ch of text) {
    weightedLength += /[가-힣]/.test(ch) ? 2 : 1;
  }
  const charsPerLine = Math.max(10, Math.floor(totalColWidth * 0.9));
  const estimatedLines = Math.max(1, Math.ceil(weightedLength / charsPerLine));
  return estimatedLines * lineHeightPt + 8;
}

export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadExpandedRows(formula: any, basis: DocBasis = "MIX") {
  const rawLines = await fetchFormulaLinesForPdf(formula.formula_code, formula.revision);
  const { lines, components } = await resolveLinesForBasis(formula, rawLines, basis);
  return { lines, components };
}

// ============================================================
// 단일성분표 엑셀: PDF(No/INCI/국문명/%/CAS/EC/Function)와 동일한 컬럼 + 상단정보/하단각주 추가
// ============================================================
// 엑셀 컬럼 폭 - 언어별로 예상 텍스트 길이가 달라 표마다(단일/복합) 다른 폭을 쓴다.
const SINGLE_LANG_COL_WIDTH: Record<string, number> = { en: 30, kr: 20, ja: 24, zh: 24 };
const COMPLEX_LANG_COL_WIDTH: Record<string, number> = { en: 40, kr: 30, ja: 32, zh: 32 };

export async function downloadSingleComponentExcel(formula: any, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const { lines, components } = await loadExpandedRows(formula, basis);
  const basisAlerts = await computeBasisAllergenAlerts(formula, lines, components);
  const functionLookup = buildIngredientFunctionLookup(await fetchIngredientFunctionEntries());
  // 중문/일문(EN_JA/EN_ZH)은 plm_formula_lines에 스냅샷이 없어 원료관리(plm_raw_materials)에서 바로
  // 조회해야 한다 - PDF(buildSingleComponentTableHtml)와 동일한 패턴.
  const materials = await fetchRawMaterialsByCodes(lines.map((x) => x.raw_code));
  const materialsByRawCode = new Map(materials.map((m) => [m.raw_code, m]));
  const allRows = mergeRows([
    ...complexRows(lines, components, functionLookup, materialsByRawCode),
    ...singleRows(lines, components, functionLookup, materialsByRawCode),
  ]);
  // 알러젠(향료 등의 100% 자체 항목 안에 이미 포함된 하위 성분)은 PDF와 동일하게 이 표에서 아예
  // 제외한다 - 등록된 알러젠을 전부 나열하면 실제로는 표시기준 미만인 것까지 포함되어 "이 알러젠들이
  // 모두 유의미하게 들어있다"는 오해를 줄 수 있고, 실제 표시 대상 여부/함량은 하단 "표시대상 성분"
  // 표(기준치 초과분만 표시)로 이미 충분히 확인 가능하다는 사용자 피드백에 따른 것. 제외하면 향료
  // 자신의 몫과 중복 집계될 일도 없어 합계가 정확히 100%가 된다.
  const rows = allRows.filter((x) => !(x.is_allergen && x.allergen_id));
  // 문서 전체에서 "값이 정확히 끝나는" 최대 자릿수(8~15자리)로 통일. 셀 값은 정확한 실제 숫자를 그대로
  // 저장하고, numFmt로 그 자릿수만큼 0-패딩해서 보여준다 (PDF의 문자열 표시와 자릿수는 동일하되,
  // 엑셀에서는 숫자 그대로라 정렬/필터/수식 계산이 가능함).
  // 건조 후(DRY)는 나눗셈이 섞여 들어가 딱 떨어지지 않는 소수가 나오므로 PDF와 동일하게 8자리 고정 반올림.
  const decimals = basis === "DRY" ? 8 : computeUniformPercentDecimals(rows);
  const percentNumFmt = "0." + "0".repeat(decimals);
  const cols = langColumns(lang);
  const langColCount = cols.length;
  const percentColIndex = 1 + langColCount + 1;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("단일성분표");
  const colCount = 5 + langColCount;
  ws.columns = [
    { width: 6 },
    ...cols.map((c) => ({ width: SINGLE_LANG_COL_WIDTH[c.key] || 24 })),
    { width: 8 + decimals },
    { width: 16 },
    { width: 12 },
    { width: 20 },
  ];

  writeTitleRow(ws, `Ingredient List (Single)${basisTitleSuffix(basis)}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const headerRow = ws.addRow([
    "No.",
    ...cols.map((c) => c.header),
    "Percentage(%)",
    "CAS No.",
    "EC No.",
    "Function",
  ]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (rows.length === 0) {
    ws.addRow(["", "단일성분 데이터가 없습니다.", ...Array(colCount - 2).fill("")]);
  }
  rows.forEach((x, i) => {
    // 건조 후(DRY)는 나눗셈이 섞여 exactPercent(배합시 전용 정확값)가 실제 값과 어긋날 수 있으므로
    // PDF와 동일하게 항상 final_percent(8자리 반올림)를 쓴다. exactPercent는 MIX 기준일 때만 사용.
    const percentValue = basis === "DRY" ? Number(pct(x.final_percent)) : (x.exactPercent ? exactDecimalToNumber(x.exactPercent) : Number(pct(x.final_percent)));
    const row = ws.addRow([
      i + 1,
      ...cols.map((c) => pickLangValue(x, c.key)),
      percentValue,
      x.cas_no || "-",
      x.ec_no || "-",
      x.function_text,
    ]);
    row.alignment = { vertical: "middle" };
    row.getCell(percentColIndex).numFmt = percentNumFmt;
    border(ws, row.number, 1, row.number, colCount);
  });

  // 합계(Total) 행 - PDF와 동일하게 배합 시(MIX)는 BigInt 정확 덧셈, 건조 후(DRY)는 반올림된
  // final_percent를 그대로 더한다. 알러젠 행은 위에서 이미 제외했으므로 100%에 정확히 맞는다.
  if (rows.length > 0) {
    const totalValue =
      basis !== "DRY"
        ? exactDecimalToNumber(rows.reduce((acc, x) => exactAdd(acc, x.exactPercent || toExactDecimal(x.final_percent)), toExactDecimal(0)))
        : Number(rows.reduce((sum, x) => sum + x.final_percent, 0).toFixed(decimals));
    const totalRow = ws.addRow(["합계 (Total)", ...Array(langColCount).fill(""), totalValue, "", "", ""]);
    ws.mergeCells(totalRow.number, 1, totalRow.number, 1 + langColCount);
    totalRow.font = { bold: true };
    totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    totalRow.getCell(1).alignment = { horizontal: "right" };
    totalRow.getCell(percentColIndex).numFmt = percentNumFmt;
    totalRow.getCell(percentColIndex).alignment = { horizontal: "right" };
    border(ws, totalRow.number, 1, totalRow.number, colCount);
  }

  writeFooterNotesWithAllergenTable(ws, colCount, formula, basisAlerts);
  await downloadWorkbook(wb, `단일성분표_${formula.formula_code}_${formula.revision}${basisFileSuffix(basis)}${langFileSuffix(lang)}.xlsx`);
}

// ============================================================
// 전성분표 엑셀: PDF(박스 2개 - Ingredient list 영문 / 국문전성분)와 동일한 문장형 레이아웃
// ============================================================
export async function downloadInciListExcel(formula: any, basis: DocBasis = "MIX", lang: DocLang = "BOTH") {
  const { lines, components } = await loadExpandedRows(formula, basis);
  // 중문/일문(EN_JA/EN_ZH)은 plm_formula_lines에 스냅샷이 없어 원료관리(plm_raw_materials)에서 바로
  // 조회해야 한다 - PDF(buildInciListHtml)와 동일한 패턴.
  const materials = await fetchRawMaterialsByCodes(lines.map((x) => x.raw_code));
  const materialsByRawCode = new Map(materials.map((m) => [m.raw_code, m]));
  const rows = mergeRows([
    ...complexRows(lines, components, undefined, materialsByRawCode),
    ...singleRows(lines, components, undefined, materialsByRawCode),
  ]);
  const basisAlerts = await computeBasisAllergenAlerts(formula, lines, components);
  // PDF(buildInciListHtml)와 동일하게, 이 basis 기준으로 실제 표시기준 미만인 알러젠은 전성분/국문전성분
  // 이름 목록 자체에서도 제외한다 - 표시 의무가 없는 성분을 이름으로 노출할 이유가 없기 때문.
  // 이 필터가 엑셀에는 지금까지 빠져있었다(PDF에만 적용돼 있던 것).
  const suppressedAllergenIds = new Set(
    (basisAlerts || []).filter((a) => !a.label_required).map((a) => a.allergen_id)
  );
  const visibleRows = rows.filter(
    (r) => !(r.is_allergen && r.allergen_id && suppressedAllergenIds.has(r.allergen_id))
  );
  const cols = langColumns(lang);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("전성분표");
  const colCount = 6;
  const colWidths = [28, 4, 24, 24, 24, 24];
  ws.columns = colWidths.map((width) => ({ width }));
  const totalColWidth = colWidths.reduce((s, w) => s + w, 0);

  writeTitleRow(ws, `Ingredient List for Development${basisTitleSuffix(basis)}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const writeBox = (title: string, content: string) => {
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, colCount);
    titleRow.getCell(1).font = { bold: true };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    border(ws, titleRow.number, 1, titleRow.number, colCount);

    const bodyRow = ws.addRow([content || "-"]);
    ws.mergeCells(bodyRow.number, 1, bodyRow.number, colCount);
    bodyRow.getCell(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    border(ws, bodyRow.number, 1, bodyRow.number, colCount);
    // PDF는 텍스트 양에 따라 박스 높이가 자동으로 늘어나지만 엑셀은 고정 행 높이라
    // 뷰어에 따라 자동 재계산에 의존하지 못하므로, 텍스트 길이 기준으로 직접 계산해서 지정한다.
    ws.getRow(bodyRow.number).height = estimateWrappedRowHeight(content || "-", totalColWidth);
  };

  for (const c of cols) {
    const content = visibleRows.map((x) => pickLangValue(x, c.key)).filter(Boolean).join(", ");
    writeBox(langListBoxTitle(c.key), content);
  }

  writeFooterNotesWithAllergenTable(ws, colCount, formula, basisAlerts);
  await downloadWorkbook(wb, `전성분표_${formula.formula_code}_${formula.revision}${basisFileSuffix(basis)}${langFileSuffix(lang)}.xlsx`);
}

// ============================================================
// 복합성분표 엑셀: PDF와 동일하게 원료 1개 = 1행, 구성성분은 셀 내 줄바꿈(\n + wrapText)
// buildComplexGroupedRows()를 그대로 재사용 (PDF의 <br> 대신 \n으로 줄바꿈)
// ============================================================
// withTradeName=true: "복합성분표(Trade Name)" 전용 - No.와 EU/USA INCI name 사이에 원료관리
// (plm_raw_materials.trade_name)에 등록된 영문 Trade Name 컬럼을 추가로 넣는다. 그 외 계산 로직
// (합계/알러젠 처리 등)은 documentPdfService.ts의 buildComplexComponentTableHtml과 완전히 동일하다.
export async function downloadComplexComponentExcel(formula: any, basis: DocBasis = "MIX", lang: DocLang = "BOTH", withTradeName = false) {
  const { lines, components } = await loadExpandedRows(formula, basis);
  const basisAlerts = await computeBasisAllergenAlerts(formula, lines, components);
  const materials = await fetchRawMaterialsByCodes(lines.map((x) => x.raw_code));
  const materialsByRawCode = new Map(materials.map((m) => [m.raw_code, m]));
  const grouped = buildComplexGroupedRows(lines, components, materialsByRawCode, basis);
  const inputDecimals = basis === "DRY" ? 2 : 8;
  // PDF와 동일한 규칙: 건조 후(DRY)는 8자리 고정, 배합 시(MIX)/공개처방(일반, PUBLIC)은 정확히 끝나는 자리까지 동적으로 늘림
  const finalPercentDecimals = basis !== "DRY" ? computeUniformFinalPercentDecimals(grouped) : 8;
  const cols = langColumns(lang);
  const langColCount = cols.length;
  const tradeNameColCount = withTradeName ? 1 : 0;
  // 언어 컬럼 뒤에 오는 고정 컬럼들의 1-based 인덱스 (No.=1 -> Trade Name(있으면) -> 언어 컬럼 -> %Sub~Function)
  const ratioCol = 1 + tradeNameColCount + langColCount + 1;
  const inputCol = ratioCol + 1;
  const finalCol = inputCol + 1;
  const casCol = finalCol + 1;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(withTradeName ? "복합성분표(Trade Name)" : "복합성분표");
  const colCount = 6 + langColCount + tradeNameColCount;
  ws.columns = [
    { width: 6 },
    ...(withTradeName ? [{ width: 26 }] : []),
    ...cols.map((c) => ({ width: COMPLEX_LANG_COL_WIDTH[c.key] || 30 })),
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 24 },
    { width: 20 },
  ];

  writeTitleRow(ws, `Ingredient List for Development${basisTitleSuffix(basis)}${withTradeName ? " (Trade Name)" : ""}`, colCount);
  writeMetaRows(ws, kovasMeta(formula), colCount);

  const headerRow = ws.addRow([
    "No.",
    ...(withTradeName ? ["Trade Name"] : []),
    ...cols.map((c) => c.header),
    "% Sub Ingredient in Raw Ingredient",
    "%Raw Ingredient in Formula",
    "Final % in Formula",
    "CAS No.",
    "Function",
  ]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (grouped.length === 0) {
    ws.addRow(["", "복합원료 구성성분 데이터가 없습니다.", ...Array(colCount - 2).fill("")]);
  }

  grouped.forEach((g, i) => {
    const langValues = cols.map((c) => g.items.map((x) => pickLangValue(x, c.key)).join("\n"));
    const ratio = g.items.length === 1 && g.items[0].ratio === null ? "-" : g.items.map((x) => fixedPct(x.ratio, 8)).join("\n");
    const finalPercent = g.items
      .map((x) =>
        basis !== "DRY" && x.exactFinalPercent
          ? exactDecimalToString(x.exactFinalPercent, finalPercentDecimals)
          : fixedPct(x.finalPercent, finalPercentDecimals)
      )
      .join("\n");
    const cas = g.items.map((x) => x.cas).join("\n");

    const row = ws.addRow([
      i + 1,
      ...(withTradeName ? [g.trade_name || "-"] : []),
      ...langValues,
      ratio,
      fixedPct(g.input, inputDecimals),
      finalPercent,
      cas,
      g.func,
    ]);
    row.alignment = { vertical: "middle" };
    row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    let col = 2;
    if (withTradeName) { row.getCell(col).alignment = { vertical: "middle" }; col++; }
    for (let k = 0; k < cols.length; k++) { row.getCell(col).alignment = { vertical: "middle", wrapText: true }; col++; }
    row.getCell(ratioCol).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    row.getCell(inputCol).alignment = { vertical: "middle", horizontal: "center" };
    row.getCell(finalCol).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    row.getCell(casCol).alignment = { vertical: "middle", wrapText: true };
    border(ws, row.number, 1, row.number, colCount);
    // 행 높이를 고정값으로 지정하지 않는다 - Excel이 파일을 열 때 wrapText 셀 내용(개별 항목이
    // 컬럼 폭보다 길어 한 항목이 시각적으로 여러 줄로 접히는 경우 포함)에 맞춰 자동으로 행 높이를
    // 재계산하므로, 고정 높이를 주면 오히려 마지막 줄이 다음 행과 겹쳐 잘려 보이는 문제가 생긴다.

    // 알러젠 구성성분(향료 등의 자기 100% 안에 이미 포함된 하위 성분, g.allergenItems)은 이 표에
    // 아예 노출하지 않는다 - 등록된 알러젠을 전부 나열하면 실제로는 표시기준 미만인 것까지 포함되어
    // "이 알러젠들이 모두 유의미하게 들어있다"는 오해를 줄 수 있고, 실제 표시 대상 여부/함량은 하단
    // "표시대상 성분" 표(기준치 초과분만 표시)로 이미 충분히 확인 가능하다는 사용자 피드백에 따른
    // 것. items(비알러젠 항목)만으로 합계를 계산하므로 100%가 정확히 맞는 것은 그대로 유지된다.
  });

  // %Raw Ingredient in Formula 합계 - 원료별 투입 비율(g.input)을 그대로 더한 값이라, 향료 안의
  // 알러젠처럼 한 원료 안에 중첩 표기된 성분이 있어도 이중 집계되지 않는다. 건조 후 기준으로
  // 전체 배합이 실제로 100%에 맞는지 buyer가 한눈에 확인할 수 있게 한다.
  if (grouped.length > 0) {
    const totalInput = grouped.reduce((sum, g) => sum + g.input, 0);
    const totalFinalPercentDisplay =
      basis !== "DRY"
        ? exactDecimalToString(
            grouped.reduce(
              (acc, g) => g.items.reduce((a, x) => (x.exactFinalPercent ? exactAdd(a, x.exactFinalPercent) : a), acc),
              toExactDecimal(0)
            ),
            finalPercentDecimals
          )
        : fixedPct(
            grouped.reduce((sum, g) => sum + g.items.reduce((s, x) => s + x.finalPercent, 0), 0),
            finalPercentDecimals
          );
    const totalRow = ws.addRow([
      "합계 (Total)",
      ...Array(tradeNameColCount).fill(""),
      ...Array(langColCount).fill(""),
      "",
      fixedPct(totalInput, inputDecimals),
      totalFinalPercentDisplay,
      "",
      "",
    ]);
    ws.mergeCells(totalRow.number, 1, totalRow.number, ratioCol);
    totalRow.font = { bold: true };
    totalRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    totalRow.getCell(1).alignment = { horizontal: "right" };
    totalRow.getCell(inputCol).alignment = { horizontal: "center" };
    totalRow.getCell(finalCol).alignment = { horizontal: "center" };
    border(ws, totalRow.number, 1, totalRow.number, colCount);
  }

  writeFooterNotesWithAllergenTable(ws, colCount, formula, basisAlerts);
  await downloadWorkbook(wb, `복합성분표${withTradeName ? "(TradeName)" : ""}_${formula.formula_code}_${formula.revision}${basisFileSuffix(basis)}${langFileSuffix(lang)}.xlsx`);
}

// ============================================================
// 원료발주가처방 엑셀: PDF(No/원료코드/원료명/함량(%)/신규 체크/공급사/연구 담당자)와 동일한 컬럼
// rows/personInCharge는 미리보기 팝업에서 사용자가 확정한 값을 그대로 받는다 (재계산하지 않음)
// ============================================================
export async function downloadRawMaterialOrderSheetExcel(formula: any, rows: OrderSheetRow[], personInCharge: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("원료발주가처방");
  const colCount = 9;
  ws.columns = [{ width: 6 }, { width: 18 }, { width: 30 }, { width: 12 }, { width: 12 }, { width: 22 }, { width: 24 }, { width: 16 }, { width: 16 }];

  writeTitleRow(ws, "원료발주가처방", colCount);
  writeMetaRows(ws, orderSheetMeta(formula), colCount);

  const headerRow = ws.addRow(["No.", "원료코드", "원료명", "함량(%)", "신규 체크", "공급사", "이메일", "전화번호", "연구 담당자"]);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  border(ws, headerRow.number, 1, headerRow.number, colCount);

  if (rows.length === 0) {
    ws.addRow(["", "BOM 데이터가 없습니다.", "", "", "", "", "", "", ""]);
  }
  // 이메일/전화번호는 신규 체크된 원료에 한해서만 채운다 - PDF와 동일한 규칙.
  rows.forEach((r, i) => {
    const row = ws.addRow([
      i + 1, r.raw_code, r.raw_name, Number(pct(r.percent)), r.isNew ? "O" : "", r.supplier || "-",
      r.isNew ? (r.email || "-") : "", r.isNew ? (r.phone || "-") : "", personInCharge || "-",
    ]);
    row.alignment = { vertical: "middle" };
    row.getCell(4).alignment = { vertical: "middle", horizontal: "right" };
    row.getCell(5).alignment = { vertical: "middle", horizontal: "center" };
    border(ws, row.number, 1, row.number, colCount);
  });

  writeFooterNotes(ws, colCount);
  await downloadWorkbook(wb, `원료발주가처방_${formula.formula_code}_${formula.revision}.xlsx`);
}
