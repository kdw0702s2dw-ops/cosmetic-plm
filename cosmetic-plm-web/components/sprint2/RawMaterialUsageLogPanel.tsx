"use client";

import { useRawMaterialUsageLog, type DatePreset } from "@/hooks/useRawMaterialUsageLog";
import type { UsageLogRow } from "@/services/sprint2/rawMaterialUsageLogService";
import "@/styles/enterprise-v50.css";

const PRESET_OPTIONS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번주" },
  { key: "month", label: "이번달" },
];

const EVENT_BADGE: Record<UsageLogRow["event_type"], { bg: string; fg: string; label: string }> = {
  apply_formula: { bg: "#dbeafe", fg: "#1d4ed8", label: "처방 반영" },
  manual_edit: { bg: "#fef3c7", fg: "#b45309", label: "수정" },
};

function Badge({ eventType }: { eventType: UsageLogRow["event_type"] }) {
  const c = EVENT_BADGE[eventType];
  return (
    <span style={{ background: c.bg, color: c.fg, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function fmtTime(iso: string | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 처방 반영/수정 이력 한 줄을 사람이 읽기 쉬운 문장으로 풀어준다 - 유형별로 담긴 필드가 달라서
// (처방반영: 처방정보+제조량+반영량 / 수정: 이전값→이후값) 표의 "상세" 칸 하나로 합쳐서 보여준다.
function detailText(r: UsageLogRow): string {
  if (r.event_type === "apply_formula") {
    const parts = [r.formula_code, r.formula_revision ? `Rev ${r.formula_revision}` : null, r.formula_name].filter(Boolean);
    const head = parts.join(" · ") || "-";
    const confirmed = r.confirmed_code ? ` · 확정코드 ${r.confirmed_code}` : "";
    return `${head}${confirmed} · 제조량 ${fmt(r.target_qty_kg)}kg → 이 원료에 ${fmt(r.applied_usage)} 반영`;
  }
  const delta = (r.new_usage_today ?? 0) - (r.old_usage_today ?? 0);
  const sign = delta > 0 ? "+" : "";
  return `${fmt(r.old_usage_today)} → ${fmt(r.new_usage_today)} (${sign}${fmt(delta)})`;
}

/**
 * 칭량_원료재고 > "오늘 제조한 처방으로 금일사용량 자동 반영" 사용 이력 화면.
 * 여러 사람이 같은 날짜에 각자 처방을 불러와서 반영/수정할 수 있어서, (1) 어떤 처방을 언제·얼마나
 * 반영했는지, (2) 이미 저장된 금일사용량이 나중에 수정됐을 때 이전값/이후값/수정자가 무엇이었는지
 * 날짜 범위(오늘/이번주/이번달/직접 지정)로 확인할 수 있게 한다. 기록 자체는 useRawMaterialStockCheck
 * 훅이 반영/저장 시점에 자동으로 남기고, 이 화면은 조회 전용이다.
 */
export default function RawMaterialUsageLogPanel({ refreshTick }: { refreshTick?: number } = {}) {
  const s = useRawMaterialUsageLog(refreshTick);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        &ldquo;오늘 제조한 처방으로 금일사용량 자동 반영&rdquo;을 사용한 이력입니다. 어떤 처방을 언제 얼마나
        반영했는지, 그리고 이미 저장된 금일사용량이 나중에 수정됐다면(예: 250kg → 200kg) 이전값/이후값/
        수정자까지 확인할 수 있습니다.
      </p>
      {s.message && <p style={{ color: "#dc2626", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>기간</label>
            <div style={{ display: "flex", gap: 6 }}>
              {PRESET_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  className={s.preset === p.key ? "v50-button" : "v50-button-light"}
                  onClick={() => s.applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>시작일</label>
            <input className="v50-input" type="date" value={s.dateFrom} onChange={(e) => s.setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>종료일</label>
            <input className="v50-input" type="date" value={s.dateTo} onChange={(e) => s.setDateTo(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>검색(원료코드/처방코드/처방명/확정코드)</label>
            <input
              className="v50-input" style={{ minWidth: 220 }} value={s.keyword}
              onChange={(e) => s.setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && s.search()}
            />
          </div>
          <button className="v50-button" onClick={s.search} disabled={s.loading}>{s.loading ? "조회 중…" : "검색"}</button>
        </div>

        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>날짜</th><th>유형</th><th>원료코드</th><th>원료명</th><th style={{ minWidth: 280 }}>상세</th>
                <th>처리자</th><th>처리시각</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.ledger_date}</td>
                  <td><Badge eventType={r.event_type} /></td>
                  <td style={{ fontWeight: 700 }}>{r.raw_code}</td>
                  <td>{s.rawNameByCode.get(r.raw_code) || "-"}</td>
                  <td>{detailText(r)}</td>
                  <td>{r.created_by || "-"}</td>
                  <td>{fmtTime(r.created_at)}</td>
                </tr>
              ))}
              {s.rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "#94a3b8" }}>
                    {s.loading ? "불러오는 중..." : "해당 기간에 이력이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
