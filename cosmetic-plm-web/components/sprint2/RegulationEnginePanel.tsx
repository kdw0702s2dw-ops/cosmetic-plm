"use client";

import { useRegulationEngine } from "@/hooks/useRegulationEngine";
import { useMfdsStaging } from "@/hooks/useMfdsStaging";
import type { RegulationRegion } from "@/services/sprint2/regulationEngineService";
import type { MfdsStagingRow } from "@/services/sprint2/mfdsRegulationService";
import "@/styles/enterprise-v50.css";

const REGION_LABEL: Record<string, string> = {
  KR: "한국", EU: "EU", CN: "중국", US: "미국", JP: "일본", ASEAN: "ASEAN", TW: "대만", AR: "아르헨티나", BR: "브라질", CA: "캐나다",
};

const regions: { code: RegulationRegion; label: string }[] = [
  { code: "KR", label: "한국" },
  { code: "EU", label: "EU" },
  { code: "CN", label: "중국" },
  { code: "US", label: "미국" },
  { code: "JP", label: "일본" },
  { code: "ASEAN", label: "ASEAN" },
  { code: "TW", label: "대만" },
  { code: "AR", label: "아르헨티나" },
  { code: "BR", label: "브라질" },
  { code: "CA", label: "캐나다" },
];

export default function RegulationEnginePanel() {
  const s = useRegulationEngine();
  const m = useMfdsStaging();

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">글로벌 규제검증</h1>
          <p className="v50-desc">한국, EU, 중국, 미국 등 국가별 규칙을 기준으로 처방 원료를 자동 점검합니다.</p>
          <p style={{ color: "#2563eb", fontWeight: 900 }}>{s.message}</p>
        </div>
        <div className="v50-flow">
          <button className="v50-button" onClick={s.validateAll} disabled={s.loading}>최근 처방 일괄검증</button>
          <button className="v50-button-light" onClick={s.load} disabled={s.loading}>새로고침</button>
        </div>
      </section>

      <section className="v50-grid-4" style={{ marginBottom: 18 }}>
        <Kpi label="전체 경고" value={String(s.summary.total)} hint="OPEN/CONFIRMED 포함" />
        <Kpi label="주의" value={String(s.summary.byLevel.WARNING || 0)} hint="함량/제한 확인" />
        <Kpi label="중대" value={String(s.summary.byLevel.CRITICAL || 0)} hint="사용금지/중대 검토" />
        <Kpi label="규칙" value={String(s.rules.length)} hint="현재 국가 필터 기준" />
      </section>

      <section className="v50-panel">
        <h2>검증 국가 선택</h2>
        <div className="v50-flow">
          {regions.map((r) => (
            <button key={r.code} className={s.regions.includes(r.code) ? "v50-button" : "v50-button-light"} onClick={() => s.toggleRegion(r.code)}>{r.label}</button>
          ))}
        </div>
        <p style={{ color: "#64748b", marginTop: 10 }}>선택된 국가: {s.regions.join(", ") || "없음"}</p>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>처방 선택 검증</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="v50-input" value={s.keyword} onChange={(e) => s.setKeyword(e.target.value)} placeholder="처방코드, 처방명, 고객사 검색" />
            <button className="v50-button" onClick={s.load}>검색</button>
          </div>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>총합</th><th>상태</th><th>검증</th></tr></thead>
              <tbody>
                {s.formulas.map((f) => (
                  <tr key={`${f.formula_code}-${f.revision}`}>
                    <td>{f.formula_code}</td><td>{f.formula_name}</td><td>{f.revision}</td><td>{f.total_percent}%</td><td>{f.status}</td>
                    <td><button className="v50-button-light" onClick={() => s.validateOne(f)}>검증</button></td>
                  </tr>
                ))}
                {s.formulas.length === 0 && <tr><td colSpan={6}>처방 데이터가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>국가별 규칙</h2>
          <select className="v50-input" value={s.activeRegion} onChange={(e) => s.setActiveRegion(e.target.value as any)} style={{ marginBottom: 12 }}>
            <option value="ALL">전체</option>
            {regions.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
          <div className="v50-table-wrap">
            <table className="v50-table">
              <thead><tr><th>국가</th><th>성분</th><th>상태</th><th>기준</th><th>설명</th></tr></thead>
              <tbody>
                {s.rules.map((r) => <tr key={r.rule_code}><td>{r.region}</td><td>{r.ingredient_keyword}</td><td>{r.allowed_status}</td><td>{r.max_percent ?? "-"}</td><td>{r.rule_title}</td></tr>)}
                {s.rules.length === 0 && <tr><td colSpan={5}>등록된 규칙이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>MFDS 데이터 검토</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              data.go.kr 공공 API에서 우리 원료(INCI) 기준으로 매칭된 배합금지/제한 성분을 검토해서 승인/거부합니다. 승인된 항목만 위 "국가별 규칙"에 반영됩니다.
            </p>
          </div>
          <button className="v50-button" onClick={m.sync} disabled={m.syncing}>{m.syncing ? "동기화 중…" : "MFDS 동기화"}</button>
        </div>
        {m.message && <p style={{ color: "#2563eb", fontWeight: 800, marginTop: 8 }}>{m.message}</p>}

        <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((st) => (
            <button key={st} className={m.statusFilter === st ? "v50-button" : "v50-button-light"} onClick={() => m.setStatusFilter(st)}>
              {st === "PENDING" ? "검토 대기" : st === "APPROVED" ? "승인됨" : st === "REJECTED" ? "거부됨" : "전체"}
            </button>
          ))}
        </div>

        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>성분</th><th>지역</th><th>유형</th><th style={{ minWidth: 220 }}>제한사항 원문</th>
                <th style={{ width: 100 }}>max %</th><th>매칭 원료</th><th>상태</th><th style={{ width: 160 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {m.rows.map((row) => <StagingRow key={row.id} row={row} m={m} />)}
              {m.rows.length === 0 && <tr><td colSpan={8}>{m.loading ? "불러오는 중..." : "표시할 항목이 없습니다. \"MFDS 동기화\"를 실행하세요."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>규제 경고 결과</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>국가</th><th>수준</th><th>처방</th><th>성분/원료</th><th>함량</th><th>기준</th><th>이슈</th><th>조치</th><th>상태</th></tr></thead>
            <tbody>
              {s.alerts.map((a) => (
                <tr key={a.id}>
                  <td>{a.region}</td><td>{a.warning_level}</td><td>{a.formula_name || a.formula_code}</td><td>{a.inci_kr || a.inci_en || a.raw_name}</td><td>{a.formula_percent}%</td><td>{a.max_percent ?? "-"}</td><td>{a.issue}</td><td>{a.action_suggestion}</td>
                  <td>
                    <select className="v50-input" value={a.status} onChange={(e) => s.setAlertStatus(a.id, e.target.value as any)}>
                      <option value="OPEN">OPEN</option><option value="CONFIRMED">CONFIRMED</option><option value="RESOLVED">RESOLVED</option><option value="IGNORED">IGNORED</option>
                    </select>
                  </td>
                </tr>
              ))}
              {s.alerts.length === 0 && <tr><td colSpan={9}>규제 경고가 없습니다. 처방 검증을 실행하세요.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <article className="v50-card"><div className="v50-kpi-label">{label}</div><div className="v50-kpi-value">{value}</div><div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{hint}</div></article>;
}

function StagingRow({ row, m }: { row: MfdsStagingRow; m: ReturnType<typeof useMfdsStaging> }) {
  const pending = row.review_status === "PENDING";
  return (
    <tr>
      <td>
        <b>{row.ingredient_name_kr || "-"}</b>
        {row.ingredient_name_en && <div style={{ color: "#64748b", fontSize: 12 }}>{row.ingredient_name_en}</div>}
        <div style={{ color: "#94a3b8", fontSize: 11 }}>{row.match_type} · {row.source_api}</div>
      </td>
      <td>
        {row.region_mapped ? REGION_LABEL[row.region_mapped] || row.region_mapped : (
          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 12 }}>지역 매핑 필요 ({row.region_raw})</span>
        )}
      </td>
      <td>{row.regulate_type || "-"}</td>
      <td style={{ maxWidth: 320, whiteSpace: "pre-wrap", fontSize: 12 }} title={row.limit_cond_raw || ""}>
        {(row.limit_cond_raw || "-").slice(0, 160)}{(row.limit_cond_raw || "").length > 160 ? "…" : ""}
      </td>
      <td>
        <input
          className="v50-input" type="number" style={{ width: 80 }}
          value={row.max_percent ?? ""}
          disabled={!pending}
          onChange={(e) => m.updateDraft(row.id, { max_percent: e.target.value === "" ? null : Number(e.target.value) })}
          onBlur={() => pending && m.saveDraft(row)}
        />
      </td>
      <td style={{ fontSize: 12 }}>{row.matched_raw_material_codes.join(", ") || "-"}</td>
      <td>{row.review_status === "PENDING" ? "대기" : row.review_status === "APPROVED" ? "승인됨" : "거부됨"}</td>
      <td>
        {pending ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="v50-button" onClick={() => m.approve(row)} disabled={!row.region_mapped}>승인</button>
            <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => m.reject(row)}>거부</button>
          </div>
        ) : (
          <span style={{ color: "#94a3b8", fontSize: 12 }}>{row.reviewed_by}</span>
        )}
      </td>
    </tr>
  );
}
