"use client";

import { useSprint0Status } from "@/hooks/useSprint0Status";
import "@/styles/enterprise-v50.css";

const labels: Record<string, string> = {
  plm_raw_materials: "표준 원료마스터",
  plm_raw_material_components: "복합원료 구성성분",
  plm_formulas: "표준 처방 Header",
  plm_formula_lines: "표준 처방 BOM",
  plm_documents: "표준 문서",
  plm_table_archive_registry: "Archive Registry",
  plm_user_profiles: "사용자/권한",
  plm_audit_logs: "Audit Log",
};

export default function Sprint0Dashboard() {
  const s = useSprint0Status();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">Sprint 0 기반 안정화</h1>
          <p className="v50-desc">중복 DB를 표준 테이블로 정리하고, 역할 기반 RLS 적용 상태를 확인합니다.</p>
        </div>
        <button className="v50-button" onClick={s.load} disabled={s.loading}>다시 점검</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>

      {s.status && (
        <section className="v50-grid-4" style={{ marginBottom: 18 }}>
          <Kpi label="전체 상태" value={s.status.overall} hint="Sprint 0" />
          <Kpi label="표준 테이블" value={`${s.status.tables.length}개`} hint="점검 대상" />
          <Kpi label="오류" value={`${s.status.tables.filter((x: any) => x.error).length}개`} hint="SQL 확인 필요" />
          <Kpi label="Archive 후보" value={`${s.archive.length}개`} hint="삭제하지 않음" />
        </section>
      )}

      <section className="v50-panel">
        <h2>표준 테이블 점검</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>테이블</th><th>역할</th><th>데이터 수</th><th>상태</th></tr></thead>
            <tbody>
              {(s.status?.tables || []).map((t: any) => (
                <tr key={t.table}>
                  <td>{t.table}</td>
                  <td>{labels[t.table] || t.table}</td>
                  <td>{t.count.toLocaleString()}</td>
                  <td><span className={`v50-badge ${t.error ? "danger" : t.count === 0 ? "warn" : "ok"}`}>{t.error ? "오류" : t.count === 0 ? "확인필요" : "정상"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>Archive Registry</h2>
        <p style={{ color: "#64748b" }}>기존 테이블은 삭제하지 않고, 표준 테이블로 대체될 후보로만 표시합니다.</p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>기존 테이블</th><th>구분</th><th>대체 표준 테이블</th><th>상태</th></tr></thead>
            <tbody>
              {s.archive.map((a) => (
                <tr key={a.table_name}>
                  <td>{a.table_name}</td>
                  <td>{a.category}</td>
                  <td>{a.replacement_table}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
