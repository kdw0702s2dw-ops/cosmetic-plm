'use client';

// ============================================================
// KOVAS 양식 Excel 생성 유틸 (브라우저용, SheetJS)
// 설치 필요: npm install xlsx
// 복합성분표는 한 셀 안에서 성분마다 줄바꿈(세로 정렬)으로 출력합니다.
// ============================================================

import * as XLSX from 'xlsx';

export type KovasMeta = {
  frame_formulation_number?: string;
  doc_no?: string;
  doc_date?: string;
  manufacturer?: string;
  manufacturer_address?: string;
  qualified_person?: string;
  customer?: string;
  kovas_no?: string;
  product_name?: string;
  signature?: string;
};

// 뷰에서 오는 묶음 문자열. 성분 구분자는 ',  '(콤마+공백2), 구성비/CAS는 공백2
export type CompositeRow = {
  raw_code: string;
  raw_name: string;
  input_pct: number;
  inci_en_group: string;
  inci_kr_group: string;
  ratio_group: string;
  cas_group: string;
};

export type SingleRow = {
  inci_en: string;
  inci_kr: string;
  cas_no: string | null;
  final_pct: number;
  function_en?: string | null;
};

const META_LABELS: [keyof KovasMeta, string][] = [
  ['frame_formulation_number', 'Frame formulation number'],
  ['doc_no', 'No.'],
  ['doc_date', 'Date'],
  ['manufacturer', 'Manufacturer'],
  ['manufacturer_address', 'Manufacturer address'],
  ['qualified_person', 'Name of qualified person'],
  ['customer', 'Customer'],
  ['kovas_no', 'Kovas no'],
  ['product_name', 'Product name acc. To package'],
  ['signature', 'Signature'],
];

const NOTES = [
  '1) Raw material manufacturers can be changed without advance notice if it does not affect product functions.',
  '2) Viscosity and pH-related raw materials can be adjusted.',
  '3) Allergen Labeling: Leave-on >= 0.001% / Rinse-off >= 0.01%',
];
const CONFIDENTIAL =
  '본 문서는 지정된 수신인만을 위한 것이며 영업비밀·기밀정보를 포함할 수 있습니다. 무단 공개·배포·복사를 금합니다.';
const DOC_CODE = 'KVSP-738(4)-05 Ingredient list';

function splitGroup(s: string, byComma: boolean): string[] {
  if (!s) return [''];
  const parts = byComma ? s.split(/,\s\s/) : s.split(/\s\s+/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}
function toLines(s: string, byComma: boolean): string {
  return splitGroup(s, byComma).join('\n');
}

const wrap = { alignment: { wrapText: true, vertical: 'top' } };
const wrapC = { alignment: { wrapText: true, vertical: 'top', horizontal: 'center' } };

function metaBlock(meta: KovasMeta): any[][] {
  const rows: any[][] = [['Ingredient List for Development'], []];
  META_LABELS.forEach(([key, label]) => rows.push([label, ':', meta[key] ?? '']));
  rows.push([]);
  return rows;
}

function buildCompositeSheet(meta: KovasMeta, rows: CompositeRow[]) {
  const aoa: any[][] = metaBlock(meta);
  aoa.push(['No.', 'EU/USA INCI name', '국문명', '구성비(%)', '최종함량(%)', 'CAS No.', 'Function']);
  const dataStart = aoa.length;
  rows.forEach((r, i) => {
    aoa.push([
      i + 1,
      toLines(r.inci_en_group, true),
      toLines(r.inci_kr_group, true),
      r.ratio_group === '-' ? '-' : toLines(r.ratio_group, false),
      Number(r.input_pct),
      toLines(r.cas_group, false),
      '',
    ]);
  });
  const dataEnd = aoa.length;
  aoa.push([]);
  NOTES.forEach((n) => aoa.push([n]));
  aoa.push([], [CONFIDENTIAL], [], [DOC_CODE]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 5 }, { wch: 34 }, { wch: 24 }, { wch: 11 }, { wch: 11 }, { wch: 28 }, { wch: 20 }];
  for (let r = dataStart; r < dataEnd; r++) {
    for (let c = 0; c <= 6; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) ws[addr].s = c === 0 || c === 3 || c === 4 ? wrapC : wrap;
    }
  }
  return ws;
}

function buildSingleSheet(meta: KovasMeta, rows: SingleRow[]) {
  const aoa: any[][] = metaBlock(meta);
  aoa.push(['No.', 'EU/USA INCI name', '국문명', 'Percentage(%)', 'CAS No.', 'Function']);
  rows.forEach((r, i) =>
    aoa.push([i + 1, r.inci_en, r.inci_kr, Number(r.final_pct), r.cas_no ?? '', r.function_en ?? ''])
  );
  aoa.push([], [DOC_CODE]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 5 }, { wch: 34 }, { wch: 26 }, { wch: 14 }, { wch: 26 }, { wch: 22 }];
  return ws;
}

function buildFullSheet(meta: KovasMeta, rows: SingleRow[]) {
  const high = rows.filter((r) => r.final_pct >= 1).sort((a, b) => b.final_pct - a.final_pct);
  const low = rows.filter((r) => r.final_pct < 1).sort((a, b) => a.inci_kr.localeCompare(b.inci_kr, 'ko'));
  const ordered = [...high, ...low];
  const enFull = ordered.map((r) => r.inci_en).join(', ');
  const krFull = ordered.map((r) => r.inci_kr).join(', ');

  const aoa: any[][] = metaBlock(meta);
  // 박스 형태: 제목행 + 내용행 을 A~G 병합 + 테두리로 감쌈
  const titleEnRow = aoa.length; aoa.push(['Ingredient list']);
  const enRow = aoa.length; aoa.push([enFull]);
  aoa.push([]);
  const titleKrRow = aoa.length; aoa.push(['국문전성분']);
  const krRow = aoa.length; aoa.push([krFull]);
  aoa.push([], [CONFIDENTIAL], [], [DOC_CODE]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = Array.from({ length: 7 }, () => ({ wch: 18 }));

  // A~G 병합 (4개 박스 줄)
  ws['!merges'] = [titleEnRow, enRow, titleKrRow, krRow].map((r) => ({
    s: { r, c: 0 }, e: { r, c: 6 },
  }));

  // 테두리 + 정렬 스타일
  const box = { style: 'thin', color: { rgb: '888888' } };
  const border = { top: box, bottom: box, left: box, right: box };
  const titleStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border };
  const bodyStyle = { alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border };

  for (let c = 0; c <= 6; c++) {
    [titleEnRow, titleKrRow].forEach((r) => {
      const a = XLSX.utils.encode_cell({ r, c });
      if (!ws[a]) ws[a] = { t: 's', v: '' };
      ws[a].s = titleStyle;
    });
    [enRow, krRow].forEach((r) => {
      const a = XLSX.utils.encode_cell({ r, c });
      if (!ws[a]) ws[a] = { t: 's', v: '' };
      ws[a].s = bodyStyle;
    });
  }
  return ws;
}

export function downloadKovasWorkbook(
  meta: KovasMeta,
  composite: CompositeRow[],
  single: SingleRow[],
  filename = 'KOVAS_전성분문서.xlsx'
) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildCompositeSheet(meta, composite), '복합성분표');
  XLSX.utils.book_append_sheet(wb, buildSingleSheet(meta, single), '단일성분표');
  XLSX.utils.book_append_sheet(wb, buildFullSheet(meta, single), '전성분');
  XLSX.writeFile(wb, filename, { cellStyles: true });
}
