'use client';

import { useEffect, useState, useMemo } from 'react';

import { supabase } from '@/lib/supabase';

type CompositeRow = {
  raw_code: string;
  raw_name: string;
  input_pct: number;
  inci_en: string;
  inci_kr: string;
  ratio_pct: number;
  final_pct: number;
  cas_no: string | null;
  ec_no: string | null;
};

type SingleRow = {
  inci_en: string;
  inci_kr: string;
  cas_no: string | null;
  ec_no: string | null;
  final_pct: number;
};

const fmt = (n: number) => Number(n).toFixed(2);

export default function IngredientDocuments({ formulaId }: { formulaId: string }) {
  const [tab, setTab] = useState<'composite' | 'single' | 'full'>('composite');
  const [composite, setComposite] = useState<CompositeRow[]>([]);
  const [single, setSingle] = useState<SingleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      const [cRes, sRes] = await Promise.all([
        supabase
          .from('v_composite_breakdown')
          .select('raw_code, raw_name, input_pct, inci_en, inci_kr, ratio_pct, final_pct, cas_no, ec_no')
          .eq('formula_id', formulaId)
          .order('raw_code', { ascending: true })
          .order('final_pct', { ascending: false }),
        supabase
          .from('v_single_ingredient')
          .select('inci_en, inci_kr, cas_no, ec_no, final_pct')
          .eq('formula_id', formulaId)
          .order('final_pct', { ascending: false }),
      ]);

      if (cancelled) return;
      if (cRes.error || sRes.error) {
        setError(cRes.error?.message || sRes.error?.message || '조회 실패');
      } else {
        setComposite(cRes.data ?? []);
        setSingle(sRes.data ?? []);
      }
      setLoading(false);
    }
    if (formulaId) load();
    return () => {
      cancelled = true;
    };
  }, [formulaId]);

  // 전성분표: 1%↑ 함량 내림차순 + 1%↓ 국문명 가나다순 (DB와 동일 규칙)
  const fullList = useMemo(() => {
    const high = single.filter((r) => r.final_pct >= 1).sort((a, b) => b.final_pct - a.final_pct);
    const low = single.filter((r) => r.final_pct < 1).sort((a, b) => a.inci_kr.localeCompare(b.inci_kr, 'ko'));
    return [...high, ...low].map((r) => r.inci_kr).join(', ');
  }, [single]);

  // ---------- CSV 다운로드 ----------
  function exportCsv() {
    let rows: string[][] = [];
    let filename = '';
    if (tab === 'composite') {
      filename = '복합성분표.csv';
      rows = [['원료코드', '원료명', '원료투입량(%)', 'INCI', '국문명', '원료 내 구성비(%)', '최종함량(%)', 'CAS No.', 'EC No.']];
      composite.forEach((r) =>
        rows.push([r.raw_code, r.raw_name, fmt(r.input_pct), r.inci_en, r.inci_kr, fmt(r.ratio_pct), fmt(r.final_pct), r.cas_no ?? '', r.ec_no ?? '']));
    } else if (tab === 'single') {
      filename = '단일성분표.csv';
      rows = [['INCI', '국문명', 'CAS No.', 'EC No.', '최종함량(%)']];
      single.forEach((r) => rows.push([r.inci_en, r.inci_kr, r.cas_no ?? '', r.ec_no ?? '', fmt(r.final_pct)]));
    } else {
      filename = '전성분표.csv';
      rows = [['전성분'], [fullList]];
    }
    const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- PDF 다운로드 (브라우저 인쇄 → PDF로 저장) ----------
  function exportPdf() {
    const title = tab === 'composite' ? '복합성분표' : tab === 'single' ? '단일성분표' : '전성분표';
    let bodyHtml = '';

    if (tab === 'composite') {
      bodyHtml = `
        <table>
          <thead><tr>
            <th>원료코드</th><th>원료명</th><th class="r">투입량%</th><th>INCI</th>
            <th>국문명</th><th class="r">구성비%</th><th class="r">최종함량%</th><th>CAS</th>
          </tr></thead>
          <tbody>
            ${composite
              .map(
                (r) => `<tr>
              <td>${r.raw_code}</td><td>${r.raw_name}</td><td class="r">${fmt(r.input_pct)}</td>
              <td>${r.inci_en}</td><td>${r.inci_kr}</td><td class="r">${fmt(r.ratio_pct)}</td>
              <td class="r"><b>${fmt(r.final_pct)}</b></td><td>${r.cas_no || '—'}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>`;
    } else if (tab === 'single') {
      bodyHtml = `
        <table>
          <thead><tr>
            <th>INCI</th><th>국문명</th><th>CAS</th><th>EC</th><th class="r">최종함량%</th>
          </tr></thead>
          <tbody>
            ${single
              .map(
                (r) => `<tr>
              <td>${r.inci_en}</td><td>${r.inci_kr}</td><td>${r.cas_no || '—'}</td>
              <td>${r.ec_no || '—'}</td><td class="r"><b>${fmt(r.final_pct)}</b></td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>`;
    } else {
      bodyHtml = `
        <p class="note">1% 이상 함량 내림차순, 1% 미만 국문명 가나다순</p>
        <div class="full">${fullList}</div>`;
    }

    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
      <title>${title}</title>
      <style>
        * { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; }
        body { padding: 28px; color: #1b1f1d; }
        h1 { font-size: 18px; margin: 0 0 4px; }
        .sub { font-size: 12px; color: #6b716d; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th, td { border: 1px solid #d8d5cb; padding: 5px 7px; text-align: left; }
        th { background: #f1f0ec; }
        .r { text-align: right; }
        .note { font-size: 11px; color: #6b716d; }
        .full { background: #f7f6f2; border-radius: 6px; padding: 14px; font-size: 13px; line-height: 1.9; margin-top: 8px; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>
        <h1>${title}</h1>
        <div class="sub">생성일 ${new Date().toLocaleDateString('ko-KR')}</div>
        ${bodyHtml}
        <script>window.onload = () => { window.print(); }</script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  const tabs = [
    { id: 'composite' as const, label: '복합성분표' },
    { id: 'single' as const, label: '단일성분표' },
    { id: 'full' as const, label: '전성분표' },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                tab === t.id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={loading || !!error}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            CSV 다운로드
          </button>
          <button
            onClick={exportPdf}
            disabled={loading || !!error}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
          >
            PDF 다운로드
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        {loading && <p className="text-sm text-neutral-400">불러오는 중…</p>}
        {error && <p className="text-sm text-red-600">오류: {error}</p>}
        {!loading && !error && composite.length === 0 && (
          <p className="text-sm text-neutral-400">
            구성성분이 등록된 원료가 없습니다. 원료마스터에서 각 원료의 구성성분(단일원료는 자기 자신 100%)을 등록하세요.
          </p>
        )}

        {!loading && !error && composite.length > 0 && tab === 'composite' && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-500">
                <Th>원료코드</Th><Th>원료명</Th><Th right>투입량%</Th><Th>INCI</Th><Th>국문명</Th>
                <Th right>구성비%</Th><Th right>최종함량%</Th><Th>CAS</Th>
              </tr>
            </thead>
            <tbody>
              {composite.map((r, i) => (
                <tr key={i} className="border-t border-neutral-100">
                  <Td mono>{r.raw_code}</Td><Td>{r.raw_name}</Td><Td right mono>{fmt(r.input_pct)}</Td>
                  <Td mono>{r.inci_en}</Td><Td>{r.inci_kr}</Td><Td right mono>{fmt(r.ratio_pct)}</Td>
                  <Td right mono bold>{fmt(r.final_pct)}</Td><Td mono>{r.cas_no || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && tab === 'single' && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-500">
                <Th>INCI</Th><Th>국문명</Th><Th>CAS</Th><Th>EC</Th><Th right>최종함량%</Th>
              </tr>
            </thead>
            <tbody>
              {single.map((r, i) => (
                <tr key={i} className="border-t border-neutral-100">
                  <Td mono>{r.inci_en}</Td><Td>{r.inci_kr}</Td><Td mono>{r.cas_no || '—'}</Td>
                  <Td mono>{r.ec_no || '—'}</Td><Td right mono bold>{fmt(r.final_pct)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && tab === 'full' && (
          <div>
            <p className="mb-2 text-[11px] text-neutral-400">1% 이상 함량 내림차순, 1% 미만 국문명 가나다순</p>
            <div className="rounded-lg bg-neutral-50 p-4 font-mono text-sm leading-7">{fullList}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-2 py-1.5 font-semibold ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}
function Td({ children, right, mono, bold }: { children: React.ReactNode; right?: boolean; mono?: boolean; bold?: boolean }) {
  return (
    <td className={`px-2 py-1.5 ${right ? 'text-right' : 'text-left'} ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''} whitespace-nowrap`}>
      {children}
    </td>
  );
}
