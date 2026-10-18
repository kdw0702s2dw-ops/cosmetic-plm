"use client";

// 처방관리 "통계" 탭 계산 로직 - 순수 함수만 모아둔다(화면에 이미 떠있는 처방 목록을 그대로 집계하므로
// 별도 DB 조회가 필요 없다). FormulaCorePanel.tsx가 이미 쓰고 있는 "처방코드 1개당 1행(확정된
// Revision은 별도 행)" 그룹핑 결과(rowsWithPickedRevision의 pickedRow들)를 그대로 넘겨 써야, "전체
// (128)" 등 기존 탭에 보이는 건수와 통계 탭의 합계가 항상 일치한다.

export type FormulaStatRow = {
  formula_code: string;
  confirmed_code?: string | null;
  product_type?: string | null;
};

export const NO_YEAR_LABEL = "연도 없음(베이스 처방 등)";
export const NO_PRODUCT_TYPE_LABEL = "미지정";

// 처방코드가 "P2026-077" 형식일 때만 연도를 추출한다("26년에 개발을 위해 생성한 처방" 요청사항). 그
// 외 형식(HG-001, 3HGPA012A, TEST-01 등)은 연도를 매길 수 없으므로 null을 반환하고, 호출부에서
// NO_YEAR_LABEL로 묶는다.
export function extractDevYear(formulaCode: string): string | null {
  const m = /^P(\d{4})-/.exec(formulaCode || "");
  return m ? m[1] : null;
}

// "확정"의 기준은 FormulaCorePanel.tsx의 컨펌 탭/카운트와 동일하게 confirmed_code 존재 여부로 둔다
// (실제 값은 거의 전부 "3"으로 시작하지만, 그 접두사를 별도로 강제하지 않고 기존 화면과 같은 기준을
// 쓴다 - 두 화면의 숫자가 서로 어긋나지 않도록).
export function isConfirmed(row: FormulaStatRow): boolean {
  return Boolean(row.confirmed_code);
}

export type CountStat = { label: string; count: number };

export function computeYearStats(rows: FormulaStatRow[]): CountStat[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const year = extractDevYear(r.formula_code) || NO_YEAR_LABEL;
    counts.set(year, (counts.get(year) || 0) + 1);
  }
  const years = Array.from(counts.keys()).filter((y) => y !== NO_YEAR_LABEL).sort();
  const result = years.map((y) => ({ label: y, count: counts.get(y)! }));
  if (counts.has(NO_YEAR_LABEL)) result.push({ label: NO_YEAR_LABEL, count: counts.get(NO_YEAR_LABEL)! });
  return result;
}

export function computeProductTypeStats(rows: FormulaStatRow[]): CountStat[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const type = (r.product_type || "").trim() || NO_PRODUCT_TYPE_LABEL;
    counts.set(type, (counts.get(type) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export type YearProductTypeMatrix = {
  years: string[]; // NO_YEAR_LABEL이 있으면 마지막
  productTypes: string[]; // 전체 건수 내림차순
  cell: (year: string, productType: string) => number;
  rowTotal: (year: string) => number;
  colTotal: (productType: string) => number;
  grandTotal: number;
};

export function computeYearProductTypeMatrix(rows: FormulaStatRow[]): YearProductTypeMatrix {
  const years = computeYearStats(rows).map((s) => s.label);
  const productTypes = computeProductTypeStats(rows).map((s) => s.label);
  const counts = new Map<string, number>(); // key: `${year}__${type}`
  for (const r of rows) {
    const year = extractDevYear(r.formula_code) || NO_YEAR_LABEL;
    const type = (r.product_type || "").trim() || NO_PRODUCT_TYPE_LABEL;
    const key = `${year}__${type}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const cell = (year: string, productType: string) => counts.get(`${year}__${productType}`) || 0;
  const rowTotal = (year: string) => productTypes.reduce((sum, t) => sum + cell(year, t), 0);
  const colTotal = (productType: string) => years.reduce((sum, y) => sum + cell(y, productType), 0);
  return { years, productTypes, cell, rowTotal, colTotal, grandTotal: rows.length };
}

export type ConfirmationStat = { label: string; total: number; confirmed: number; rate: number };
export type ConfirmationStatsResult = {
  overall: ConfirmationStat;
  byYear: ConfirmationStat[];
  byProductType: ConfirmationStat[];
};

export function computeConfirmationStats(rows: FormulaStatRow[]): ConfirmationStatsResult {
  function toStat(label: string, group: FormulaStatRow[]): ConfirmationStat {
    const total = group.length;
    const confirmed = group.filter(isConfirmed).length;
    return { label, total, confirmed, rate: total > 0 ? (confirmed / total) * 100 : 0 };
  }

  const overall = toStat("전체", rows);

  const byYearGroups = new Map<string, FormulaStatRow[]>();
  for (const r of rows) {
    const year = extractDevYear(r.formula_code) || NO_YEAR_LABEL;
    const g = byYearGroups.get(year);
    if (g) g.push(r);
    else byYearGroups.set(year, [r]);
  }
  const years = Array.from(byYearGroups.keys()).filter((y) => y !== NO_YEAR_LABEL).sort();
  const byYear = years.map((y) => toStat(y, byYearGroups.get(y)!));
  if (byYearGroups.has(NO_YEAR_LABEL)) byYear.push(toStat(NO_YEAR_LABEL, byYearGroups.get(NO_YEAR_LABEL)!));

  const byTypeGroups = new Map<string, FormulaStatRow[]>();
  for (const r of rows) {
    const type = (r.product_type || "").trim() || NO_PRODUCT_TYPE_LABEL;
    const g = byTypeGroups.get(type);
    if (g) g.push(r);
    else byTypeGroups.set(type, [r]);
  }
  const byProductType = Array.from(byTypeGroups.entries())
    .map(([label, group]) => toStat(label, group))
    .sort((a, b) => b.total - a.total);

  return { overall, byYear, byProductType };
}
