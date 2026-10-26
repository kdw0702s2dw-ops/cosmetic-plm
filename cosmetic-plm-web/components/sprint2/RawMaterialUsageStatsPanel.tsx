"use client";

import { useMemo } from "react";
import { useRawMaterialUsageStats, type Granularity, type UsageStatRow } from "@/hooks/useRawMaterialUsageStats";
import "@/styles/enterprise-v50.css";

const GRANULARITY_OPTIONS: { key: Granularity; label: string }[] = [
  { key: "daily", label: "일별" },
  { key: "monthly", label: "월별" },
  { key: "yearly", label: "년별" },
];

// 색상/치수는 dataviz 가이드 기준(단일 계열 - 범례 없음): 막대 #2a78d6, 격자선 #e1e0d9(hairline),
// 기준선 #c3c2b7, 보조 텍스트(값 라벨/축) #52514e·#898781. 이 앱은 다크모드가 없어 고정 색상값만 쓴다.
const BAR_COLOR = "#2a78d6";
const GRIDLINE_COLOR = "#e1e0d9";
const BASELINE_COLOR = "#c3c2b7";
const AXIS_LABEL_COLOR = "#898781";
const VALUE_LABEL_COLOR = "#52514e";

const BAR_WIDTH = 20; // <= 24px 규격
const BAR_GAP = 14;
const SLOT = BAR_WIDTH + BAR_GAP;
const CHART_INNER_HEIGHT = 160;
const TOP_PAD = 28;
const BOTTOM_PAD = 34;
const LEFT_PAD = 56;
const RIGHT_PAD = 16;

function fmt(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return v.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") || "0";
}

function fmtKg(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${fmt(v)}kg`;
}

// 보기 좋은 눈금 최대값 계산 (0이면 1로 바닥을 깔아 분모 0을 막음) - 1/2/5/10 배수로 올림.
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const n = v / base;
  const niceN = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return niceN * base;
}

// 위쪽만 4px 둥글고 바닥은 각진 막대(dataviz 가이드 마크 규격) - SVG rect는 모서리별 라운딩을
// 지원하지 않아 path로 직접 그린다.
function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

function periodLabel(period: string, granularity: Granularity): string {
  if (granularity === "daily") return period.slice(5); // MM-DD
  if (granularity === "monthly") return period; // YYYY-MM
  return period; // YYYY
}

function UsageBarChart({ rows, granularity }: { rows: UsageStatRow[]; granularity: Granularity }) {
  const maxUsage = useMemo(() => niceMax(Math.max(...rows.map((r) => r.usage), 0)), [rows]);
  const maxIndex = useMemo(() => {
    if (rows.length === 0) return -1;
    let idx = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].usage > rows[idx].usage) idx = i;
    return rows[idx].usage > 0 ? idx : -1;
  }, [rows]);
  const lastIndex = rows.length - 1;

  const svgWidth = LEFT_PAD + Math.max(rows.length, 1) * SLOT + RIGHT_PAD;
  const svgHeight = TOP_PAD + CHART_INNER_HEIGHT + BOTTOM_PAD;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxUsage);

  // x축 라벨이 너무 촘촘하면 겹치니, 막대 수가 많을 때는 몇 개씩 건너뛰며 표시한다(선택적 라벨링).
  const labelStep = rows.length <= 14 ? 1 : Math.ceil(rows.length / 10);

  return (
    <div style={{ overflowX: "auto", background: "#fcfcfb", borderRadius: 8, border: "1px solid #ebebe6" }}>
      <svg width={svgWidth} height={svgHeight} role="img" aria-label="원료 사용량 막대그래프">
        {ticks.map((t, i) => {
          const y = TOP_PAD + CHART_INNER_HEIGHT - (maxUsage === 0 ? 0 : (t / maxUsage) * CHART_INNER_HEIGHT);
          return (
            <g key={i}>
              <line
                x1={LEFT_PAD} x2={svgWidth - RIGHT_PAD} y1={y} y2={y}
                stroke={i === 0 ? BASELINE_COLOR : GRIDLINE_COLOR} strokeWidth={1}
              />
              <text x={LEFT_PAD - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={AXIS_LABEL_COLOR}>
                {fmtKg(t)}
              </text>
            </g>
          );
        })}

        {rows.map((r, i) => {
          const x = LEFT_PAD + i * SLOT + (SLOT - BAR_WIDTH) / 2;
          const h = maxUsage === 0 ? 0 : (r.usage / maxUsage) * CHART_INNER_HEIGHT;
          const y = TOP_PAD + CHART_INNER_HEIGHT - h;
          const showLabel = i === maxIndex || i === lastIndex;
          const showTick = i % labelStep === 0 || i === lastIndex;
          return (
            <g key={r.period}>
              <path d={roundedTopBarPath(x, y, BAR_WIDTH, h, 4)} fill={BAR_COLOR}>
                <title>{`${r.period}: ${fmtKg(r.usage)}`}</title>
              </path>
              {showLabel && r.usage > 0 && (
                <text x={x + BAR_WIDTH / 2} y={y - 6} textAnchor="middle" fontSize={11} fill={VALUE_LABEL_COLOR}>
                  {fmtKg(r.usage)}
                </text>
              )}
              {showTick && (
                <text
                  x={x + BAR_WIDTH / 2} y={TOP_PAD + CHART_INNER_HEIGHT + 16}
                  textAnchor="middle" fontSize={11} fill={AXIS_LABEL_COLOR}
                >
                  {periodLabel(r.period, granularity)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function RawMaterialUsageStatsPanel({ refreshTick }: { refreshTick?: number } = {}) {
  const s = useRawMaterialUsageStats(refreshTick);

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        원료를 선택하면 일별/월별/년별 사용량(금일사용량 합계) 추이를 그래프와 표로 확인할 수 있습니다.
        (대상: 1ACA, 1BSA, 1CLA, 1FRA, 1OLA, 1LQA, 1WXA로 시작하는 원료)
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <h2>원료 선택</h2>
        <input
          className="v50-input" style={{ maxWidth: 320 }}
          placeholder="원료코드 또는 원료명 검색"
          value={s.keyword}
          onChange={(e) => s.setKeyword(e.target.value)}
        />
        {s.selected ? (
          <p style={{ color: "#16a34a", fontWeight: 800, marginTop: 8 }}>
            선택됨: {s.selected.raw_code} · {s.selected.raw_name}
          </p>
        ) : (
          <p style={{ color: "#94a3b8", marginTop: 8 }}>원료를 검색해서 선택하세요.</p>
        )}
        {s.keyword.trim() !== "" && (
          <div className="v50-table-wrap" style={{ marginTop: 8, maxHeight: 240, overflowY: "auto" }}>
            <table className="v50-table">
              <thead><tr><th>원료코드</th><th>원료명</th><th></th></tr></thead>
              <tbody>
                {s.filteredMaterials.map((m) => (
                  <tr key={m.raw_code}>
                    <td>{m.raw_code}</td><td>{m.raw_name}</td>
                    <td><button className="v50-button-light" onClick={() => s.selectMaterial(m)}>선택</button></td>
                  </tr>
                ))}
                {s.filteredMaterials.length === 0 && <tr><td colSpan={3}>검색 결과가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {s.selected && (
        <section className="v50-panel">
          <h2>{s.selected.raw_name} ({s.selected.raw_code}) 사용량 추이</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {GRANULARITY_OPTIONS.map((g) => (
              <button
                key={g.key}
                className={s.granularity === g.key ? "v50-button" : "v50-button-light"}
                onClick={() => s.setGranularity(g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>

          {s.loading ? (
            <p style={{ color: "#64748b" }}>불러오는 중...</p>
          ) : s.historyCount === 0 ? (
            <p style={{ color: "#64748b" }}>이 원료는 저장된 재고 이력이 없습니다.</p>
          ) : (
            <>
              <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
                선택 기간 합계 사용량: {fmtKg(s.totalUsage)}
              </p>

              <UsageBarChart rows={s.activeRows} granularity={s.granularity} />

              <div className="v50-table-wrap" style={{ marginTop: 14 }}>
                <table className="v50-table">
                  <thead><tr><th>기간</th><th>사용량(kg)</th><th>기간 말 최종재고량(kg)</th></tr></thead>
                  <tbody>
                    {[...s.activeRows].reverse().map((r) => (
                      <tr key={r.period}>
                        <td>{r.period}</td>
                        <td>{fmtKg(r.usage)}</td>
                        <td>{fmtKg(r.closingStock)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
