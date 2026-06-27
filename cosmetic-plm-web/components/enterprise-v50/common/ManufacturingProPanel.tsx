"use client";

import { useV50ManufacturingPro } from "@/hooks/useV50DocMfgPro";

export default function ManufacturingProPanel() {
  const s = useV50ManufacturingPro();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">제조관리 PRO</h1>
          <p className="v50-desc">처방을 선택해 Batch를 생성하고, 원료 소요량과 제조 상태를 한 화면에서 확인합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load}>새로고침</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="Batch 수" value={String(s.batches.length)} hint="전체 제조 Batch" />
        <Kpi label="Batch Size" value={`${s.batchSize}kg`} hint="생성 기준" />
        <Kpi label="진행중" value={String(s.batches.filter((b) => b.status === "IN_PROGRESS").length)} hint="제조 진행" />
        <Kpi label="완료" value={String(s.batches.filter((b) => b.status === "COMPLETED" || b.status === "RELEASED").length)} hint="완료/출하" />
      </section>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방에서 Batch 생성</h2>
          <div style={{ marginBottom: 12 }}>
            <input className="v50-input" type="number" value={s.batchSize} onChange={(e) => s.setBatchSize(Number(e.target.value))} placeholder="Batch Size kg" />
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>생성</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td>
                    <td><button className="v50-button-light" onClick={() => s.createBatch(f)}>Batch 생성</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>Batch 목록</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>Batch</th><th>처방</th><th>수량</th><th>상태</th><th>열기</th></tr></thead>
              <tbody>
                {s.batches.map((b) => (
                  <tr key={b.batch_no}>
                    <td>{b.batch_no}</td><td>{b.formula_code}/{b.revision}</td><td>{b.batch_size_kg}kg</td><td>{b.status}</td>
                    <td><button className="v50-button-light" onClick={() => s.openBatch(b)}>열기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {s.selectedBatch && (
        <section className="v50-panel">
          <h2>{s.selectedBatch.batch_no} 원료 소요량</h2>
          <div className="v50-flow" style={{ marginBottom: 12 }}>
            <button onClick={() => s.changeStatus("IN_PROGRESS")}>제조 시작</button>
            <button onClick={() => s.changeStatus("QC_HOLD")}>QC 보류</button>
            <button onClick={() => s.changeStatus("COMPLETED")}>제조 완료</button>
            <button onClick={() => s.changeStatus("RELEASED")}>출하 가능</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>No</th><th>Phase</th><th>원료코드</th><th>원료명</th><th>투입량%</th><th>소요량 kg</th></tr></thead>
              <tbody>
                {s.materials.map((m) => (
                  <tr key={m.id}><td>{m.line_no}</td><td>{m.phase}</td><td>{m.raw_code}</td><td>{m.raw_name}</td><td>{m.percentage}</td><td>{m.required_kg}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}
