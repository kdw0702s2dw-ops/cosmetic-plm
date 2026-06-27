"use client";

import { useV51SmartDocumentBatchBridge } from "@/hooks/useV51SmartDocumentBatchBridge";

export default function SmartDocumentBatchBridgePanel() {
  const s = useV51SmartDocumentBatchBridge();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">스마트 문서·Batch 브릿지</h1>
          <p className="v50-desc">Smart Formula Engine 계산 결과를 문서와 제조 Batch로 바로 연결합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load} disabled={s.loading}>새로고침</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      <section className="v50-split">
        <article className="v50-panel">
          <h2>처방 선택</h2>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>버전</th><th>총합</th><th>선택</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td>
                    <td>{f.formula_name}</td>
                    <td>{f.revision}</td>
                    <td>{f.total_percent}%</td>
                    <td><button className="v50-button-light" onClick={() => s.openFormula(f)}>선택</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="v50-panel">
          <h2>스마트 실행</h2>
          {!s.selected ? <p>먼저 처방을 선택하세요.</p> : (
            <>
              <div className="v50-card" style={{ marginBottom: 12 }}>
                <strong>{s.selected.formula_name}</strong>
                <p style={{ color: "#64748b" }}>{s.selected.formula_code} / {s.selected.revision}</p>
              </div>

              <div className="v50-flow" style={{ marginBottom: 14 }}>
                <button onClick={s.createReport} disabled={s.loading}>스마트 리포트 생성</button>
                <button onClick={s.createPackage} disabled={s.loading}>스마트 문서 패키지 생성</button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input className="v50-input" type="number" value={s.batchSize} onChange={(e) => s.setBatchSize(Number(e.target.value))} placeholder="Batch kg" />
                <button className="v50-button" onClick={s.createBatch} disabled={s.loading}>Smart Batch 생성</button>
              </div>
            </>
          )}
        </article>
      </section>

      {s.selected && (
        <section className="v50-grid-2">
          <article className="v50-panel">
            <h2>생성 문서</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>문서코드</th><th>종류</th><th>제목</th><th>상태</th><th>생성일</th></tr></thead>
                <tbody>
                  {s.documents.map((d) => (
                    <tr key={d.document_code}>
                      <td>{d.document_code}</td><td>{d.document_type}</td><td>{d.title}</td><td>{d.status}</td><td>{d.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="v50-panel">
            <h2>생성 Batch</h2>
            <div className="v50-table-wrap">
              <table className="v50-table">
                <thead><tr><th>Batch</th><th>수량</th><th>상태</th><th>담당</th><th>생성일</th></tr></thead>
                <tbody>
                  {s.batches.map((b) => (
                    <tr key={b.batch_no}>
                      <td>{b.batch_no}</td><td>{b.batch_size_kg}kg</td><td>{b.status}</td><td>{b.operator_name}</td><td>{b.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
