"use client";

import { useRawMaterialUsageLog, type DatePreset } from "@/hooks/useRawMaterialUsageLog";
import type { UsageLogRow } from "@/services/sprint2/rawMaterialUsageLogService";
import type { IncomingStockLogRow } from "@/services/sprint2/rawMaterialIncomingStockLogService";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { canWriteProduction } from "@/services/sprint1/authRbacService";
import RawMaterialUsageNotesSection from "@/components/sprint2/RawMaterialUsageNotesSection";
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

// 확정코드/제조량은 "처방 반영"에만 있는 값이라(수정 이력엔 없음) 별도 칸으로 바로 눈에 띄게 보여주고,
// fmt()가 null/undefined를 "-"로 바꿔주는 걸 그대로 활용해 수정 이력 행에서는 자동으로 "-"가 찍히게 한다.
function fmtKg(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${fmt(v)}kg`;
}

// 처방 반영/수정 이력 한 줄을 사람이 읽기 쉬운 문장으로 풀어준다 - 유형별로 담긴 필드가 달라서
// (처방반영: 처방정보+반영량 / 수정: 이전값→이후값) 표의 "상세" 칸 하나로 합쳐서 보여준다. 확정코드와
// 제조량은 "확정코드"/"제조량" 칸에 따로 나오므로 여기서는 중복 없이 처방코드/Rev/처방명과 반영량만 담는다.
function detailText(r: UsageLogRow): string {
  if (r.event_type === "apply_formula") {
    const parts = [r.formula_code, r.formula_revision ? `Rev ${r.formula_revision}` : null, r.formula_name].filter(Boolean);
    const head = parts.join(" · ") || "-";
    return `${head} → 이 원료에 ${fmtKg(r.applied_usage)} 반영`;
  }
  const delta = (r.new_usage_today ?? 0) - (r.old_usage_today ?? 0);
  const sign = delta > 0 ? "+" : "";
  return `${fmtKg(r.old_usage_today)} → ${fmtKg(r.new_usage_today)} (${sign}${fmtKg(delta)})`;
}

// 입고재고량 반영 이력 한 줄을 사람이 읽기 쉬운 문장으로 풀어준다 - 이 날짜에 처음 입력한 경우
// (old_incoming_stock이 null)와 이미 저장된 값을 나중에 고친 경우를 구분해서 보여준다.
function incomingDetailText(r: IncomingStockLogRow): string {
  if (r.old_incoming_stock === null) {
    return `${fmtKg(r.new_incoming_stock)} 입고 등록`;
  }
  const delta = r.new_incoming_stock - r.old_incoming_stock;
  const sign = delta > 0 ? "+" : "";
  return `${fmtKg(r.old_incoming_stock)} → ${fmtKg(r.new_incoming_stock)} (${sign}${fmtKg(delta)})`;
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
  const auth = useSprint1Auth();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        &ldquo;오늘 제조한 처방으로 금일사용량 자동 반영&rdquo;을 사용한 이력입니다. 어떤 처방을 언제 얼마나
        반영했는지, 그리고 이미 저장된 금일사용량이 나중에 수정됐다면(예: 250kg → 200kg) 이전값/이후값/
        수정자까지 확인할 수 있습니다.
      </p>
      {s.message && <p style={{ color: "#dc2626", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>처방 반영 요약</h3>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 0, marginBottom: 12 }}>
          어떤 처방을 언제·얼마나 제조했는지만 한 줄로 간략하게 봅니다(원료별 상세는 아래 표에서 확인).
        </p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>날짜</th><th>확정코드</th><th>처방코드</th><th>처방명</th><th>제조량(kg)</th>
                <th>반영 원료 수</th><th>처리자</th><th>처리시각</th>
              </tr>
            </thead>
            <tbody>
              {s.applyFormulaSummary.map((g) => (
                <tr key={g.key}>
                  <td>{g.ledger_date}</td>
                  <td style={{ fontWeight: 700 }}>{g.confirmed_code || "-"}</td>
                  <td>{[g.formula_code, g.formula_revision ? `Rev ${g.formula_revision}` : null].filter(Boolean).join(" · ") || "-"}</td>
                  <td>{g.formula_name || "-"}</td>
                  <td>{fmtKg(g.target_qty_kg)}</td>
                  <td>{g.raw_material_count}개</td>
                  <td>{s.resolveCreatedBy(g.created_by)}</td>
                  <td>{fmtTime(g.created_at)}</td>
                </tr>
              ))}
              {s.applyFormulaSummary.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "#94a3b8" }}>
                    {s.loading ? "불러오는 중..." : "해당 기간에 처방 반영 이력이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>입고재고량 반영 이력</h3>
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 0, marginBottom: 12 }}>
          칭량_원료재고에서 원료별 입고재고량을 입력·저장할 때마다 남는 이력입니다(최초 입력과 이후 수정 모두 표시).
        </p>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr>
                <th>날짜</th><th>원료코드</th><th>원료명</th><th style={{ minWidth: 200 }}>입고재고량 반영 내역</th>
                <th>처리자</th><th>처리시각</th>
              </tr>
            </thead>
            <tbody>
              {s.incomingStockRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.ledger_date}</td>
                  <td style={{ fontWeight: 700 }}>{r.raw_code}</td>
                  <td>{s.rawNameByCode.get(r.raw_code) || "-"}</td>
                  <td>{incomingDetailText(r)}</td>
                  <td>{s.resolveCreatedBy(r.created_by)}</td>
                  <td>{fmtTime(r.created_at)}</td>
                </tr>
              ))}
              {s.incomingStockRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "#94a3b8" }}>
                    {s.loading ? "불러오는 중..." : "해당 기간에 입고재고량 반영 이력이 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <RawMaterialUsageNotesSection canWrite={canWriteProduction(auth.profile?.role)} createdBy={auth.profile?.email} />

      <section className="v50-panel">
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>상세 이력</h3>
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
                <th>날짜</th><th>유형</th><th>원료코드</th><th>원료명</th><th>확정코드</th><th>제조량(kg)</th>
                <th style={{ minWidth: 240 }}>상세</th><th>처리자</th><th>처리시각</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.ledger_date}</td>
                  <td><Badge eventType={r.event_type} /></td>
                  <td style={{ fontWeight: 700 }}>{r.raw_code}</td>
                  <td>{s.rawNameByCode.get(r.raw_code) || "-"}</td>
                  <td>{r.confirmed_code || "-"}</td>
                  <td>{fmtKg(r.target_qty_kg)}</td>
                  <td>{detailText(r)}</td>
                  <td>{s.resolveCreatedBy(r.created_by)}</td>
                  <td>{fmtTime(r.created_at)}</td>
                </tr>
              ))}
              {s.rows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ color: "#94a3b8" }}>
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
