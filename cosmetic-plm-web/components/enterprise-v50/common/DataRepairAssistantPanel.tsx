"use client";

import { useV51DataRepair } from "@/hooks/useV51DataRepair";

export default function DataRepairAssistantPanel() {
  const s = useV51DataRepair();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">데이터 보정 도우미</h1>
          <p className="v50-desc">
            운영 전 자주 발생하는 데이터 오류를 안전한 범위에서 보정합니다. 자동보정 후 원료마스터의 상세 정보는 반드시 검토하세요.
          </p>
        </div>
        <div className="v50-flow">
          <button onClick={s.load} disabled={s.loading}>다시 조회</button>
          <button onClick={s.saveActivity} disabled={s.loading || s.results.length === 0}>보정 이력 저장</button>
        </div>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      {s.preview && (
        <section className="v50-grid-4" style={{ marginBottom: 18 }}>
          <Kpi label="총합 오류 처방" value={`${s.preview.wrong_total_formulas}건`} hint="정제수 보정 가능" />
          <Kpi label="없는 원료 참조" value={`${s.preview.orphan_lines}건`} hint="임시 원료 생성 가능" />
          <Kpi label="INCI 누락" value={`${s.preview.missing_inci_raws}건`} hint="수동 보완 필요" />
          <Kpi label="단가 누락" value={`${s.preview.missing_price_raws}건`} hint="단가 보완 필요" />
        </section>
      )}

      <section className="v50-grid-3">
        <article className="v50-card">
          <span className="v50-badge warn">안전 보정</span>
          <h3>처방 총합 100% 자동보정</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>총합이 100%가 아닌 처방을 정제수 기준으로 보정합니다.</p>
          <button className="v50-button" onClick={s.runWaterRepair} disabled={s.loading}>정제수 자동보정 실행</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">임시 보정</span>
          <h3>누락 원료 임시 생성</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>처방에서 참조하지만 원료마스터에 없는 원료코드를 임시 원료로 생성합니다.</p>
          <button className="v50-button-light" onClick={s.runOrphanRepair} disabled={s.loading}>임시 원료 생성</button>
        </article>

        <article className="v50-card">
          <span className="v50-badge warn">기초 보정</span>
          <h3>단가 NULL 보정</h3>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>단가가 NULL인 원료를 0으로 보정합니다. 실제 단가는 추후 입력해야 합니다.</p>
          <button className="v50-button-light" onClick={s.runPriceRepair} disabled={s.loading}>단가 NULL 보정</button>
        </article>
      </section>

      <section className="v50-panel" style={{ marginTop: 18 }}>
        <h2>보정 실행 결과</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>작업</th><th>영향 건수</th><th>메시지</th></tr></thead>
            <tbody>
              {s.results.map((r, idx) => (
                <tr key={`${r.action}-${idx}`}>
                  <td>{r.action}</td>
                  <td>{r.affected}</td>
                  <td>{r.message}</td>
                </tr>
              ))}
              {s.results.length === 0 && (
                <tr><td colSpan={3}>아직 실행한 보정 작업이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>중요 안내</h2>
        <p style={{ color: "#64748b", lineHeight: 1.8 }}>
          자동보정은 운영 편의를 위한 1차 보정입니다. 임시 생성된 원료는 반드시 원료마스터에서 INCI, CAS No., EC No., 공급사, 단가를 확인해 보완하세요.
        </p>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="v50-card">
      <div className="v50-kpi-label">{label}</div>
      <div className="v50-kpi-value">{value}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div>
    </article>
  );
}
