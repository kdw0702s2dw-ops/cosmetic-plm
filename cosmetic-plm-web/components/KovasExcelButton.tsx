'use client';

// ============================================================
// KOVAS Excel 다운로드 버튼
// 처방 id를 받아 v_kovas_composite / v_single_ingredient / formula_meta 를
// 조회한 뒤, KOVAS 양식 .xlsx (3시트) 로 다운로드합니다.
// ============================================================

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { downloadKovasWorkbook, type KovasMeta, type CompositeRow, type SingleRow } from '@/lib/kovasExcel';

export default function KovasExcelButton({ formulaId }: { formulaId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleDownload() {
    setBusy(true);
    setMsg(null);
    try {
      const [cRes, sRes, mRes] = await Promise.all([
        supabase
          .from('v_kovas_composite')
          .select('raw_code, raw_name, input_pct, inci_en_group, inci_kr_group, ratio_group, cas_group')
          .eq('formula_id', formulaId)
          .order('input_pct', { ascending: false }),
        supabase
          .from('v_single_ingredient')
          .select('inci_en, inci_kr, cas_no, final_pct')
          .eq('formula_id', formulaId)
          .order('final_pct', { ascending: false }),
        supabase.from('formula_meta').select('*').eq('formula_id', formulaId).maybeSingle(),
      ]);

      if (cRes.error) throw cRes.error;
      if (sRes.error) throw sRes.error;
      // formula_meta 는 없을 수 있음(아직 입력 안 한 처방). 그래도 빈 헤더로 진행.

      const composite = (cRes.data ?? []) as CompositeRow[];
      const single = (sRes.data ?? []) as SingleRow[];
      const meta = (mRes.data ?? {}) as KovasMeta;

      if (composite.length === 0) {
        setMsg('구성성분이 등록된 원료가 없어 문서를 만들 수 없습니다.');
        return;
      }

      const fname = `KOVAS_전성분문서_${composite[0]?.raw_code ?? formulaId}.xlsx`;
      downloadKovasWorkbook(meta, composite, single, fname);
    } catch (e: any) {
      setMsg(`오류: ${e.message ?? '다운로드 실패'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
      >
        {busy ? '생성 중…' : 'KOVAS 양식 Excel 다운로드 (3시트)'}
      </button>
      {msg && <span className="text-xs text-red-600">{msg}</span>}
    </div>
  );
}
