"use client";

import { useStabilityHome } from "@/hooks/useStabilityHome";
import type { CheckpointWithContext } from "@/services/sprint2/stabilityTestService";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useStabilityHome>;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildCalendarCells(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month)}-${d < 10 ? "0" + d : d}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function statusOf(cp: CheckpointWithContext, s: S): "완료" | "지연" | "임박" | "예정" {
  if (cp.status === "완료") return "완료";
  if (s.isCheckpointOverdue(cp)) return "지연";
  if (s.isCheckpointDueSoon(cp)) return "임박";
  return "예정";
}

const DOT_COLOR: Record<string, string> = { 완료: "#16a34a", 지연: "#dc2626", 임박: "#d97706", 예정: "#94a3b8" };

function DayCell({ date, s }: { date: string | null; s: S }) {
  if (!date) return <div style={{ minHeight: 70 }} />;
  const items = s.itemsByDate.get(date) || [];
  const isToday = date === todayStr();
  const isSelected = date === s.selectedDate;
  const anyOverdue = items.some((cp) => s.isCheckpointOverdue(cp));
  const dayNum = Number(date.slice(-2));
  return (
    <div
      onClick={() => s.selectDate(date)}
      style={{
        minHeight: 70, padding: 6, borderRadius: 8, cursor: "pointer",
        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
        background: isToday ? "#eff6ff" : "#fff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: anyOverdue ? "#dc2626" : "#334155" }}>{dayNum}</div>
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
          {items.slice(0, 8).map((cp) => (
            <span key={cp.id} title={cp.condition?.test?.sample_name || cp.condition?.test?.formula_code || ""} style={{ width: 7, height: 7, borderRadius: "50%", background: DOT_COLOR[statusOf(cp, s)] }} />
          ))}
        </div>
      )}
      {items.length > 0 && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{items.length}건</div>}
    </div>
  );
}

export default function StabilityHomePanel({ onOpenTest }: { onOpenTest: (testId: string) => void }) {
  const s = useStabilityHome();
  const monthLabel = `${s.year}년 ${s.month}월`;
  const hasMyAlert = s.myOverdueCount + s.myDueSoonCount > 0;

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 10 }}>
        진행 중인 모든 시료의 시험 일정을 한눈에 확인합니다. 예정일이 지났는데 완료되지 않았으면 지연(빨강), 3일 이내로 다가왔으면 임박(주황)으로 표시됩니다.
      </p>

      {hasMyAlert && (
        <a
          href="#stability-home-list"
          style={{
            display: "inline-block", marginBottom: 10, color: "#dc2626", fontWeight: 800,
            background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 999, padding: "4px 12px", fontSize: 13,
          }}
        >
          ⚠ 내 담당 안정성시험 {s.myOverdueCount + s.myDueSoonCount}건 지연/임박 확인 필요 (지연 {s.myOverdueCount}건, 임박 {s.myDueSoonCount}건)
        </a>
      )}
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <div className="v50-card" style={{ padding: "10px 16px" }}><div style={{ fontSize: 12, color: "#64748b" }}>전체 지연</div><div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{s.overdueCount}건</div></div>
        <div className="v50-card" style={{ padding: "10px 16px" }}><div style={{ fontSize: 12, color: "#64748b" }}>임박(3일 이내)</div><div style={{ fontSize: 20, fontWeight: 800, color: "#d97706" }}>{s.dueSoonCount}건</div></div>
        <div className="v50-card" style={{ padding: "10px 16px" }}><div style={{ fontSize: 12, color: "#64748b" }}>진행 중인 시료</div><div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb" }}>{s.activeSampleCount}건</div></div>
      </div>

      <section className="v50-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="v50-button-light" onClick={s.prevMonth}>◀</button>
            <h2 style={{ margin: 0, fontSize: 16 }}>{monthLabel}</h2>
            <button className="v50-button-light" onClick={s.nextMonth}>▶</button>
            <button className="v50-button-light" onClick={s.goToday}>오늘</button>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={s.myOnly} onChange={(e) => s.setMyOnly(e.target.checked)} />
            내 담당만 보기
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12 }}>
          {WEEKDAYS.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{w}</div>)}
          {buildCalendarCells(s.year, s.month).map((date, i) => <DayCell key={date || `empty-${i}`} date={date} s={s} />)}
        </div>

        <div id="stability-home-list" className="v50-table-wrap" style={{ marginTop: 12 }}>
          <table className="v50-table">
            <thead><tr><th>날짜</th><th>시료</th><th>시험조건</th><th>담당자</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {s.listItems.map((cp) => {
                const st = statusOf(cp, s);
                const test = cp.condition?.test;
                return (
                  <tr key={cp.id}>
                    <td style={{ color: st === "지연" ? "#dc2626" : undefined, fontWeight: st === "지연" ? 800 : undefined }}>{cp.due_date}</td>
                    <td>{test?.sample_name || test?.formula_name || test?.formula_code || "-"}</td>
                    <td>{cp.condition?.condition_label || "-"} · {cp.checkpoint_label}</td>
                    <td>{test?.assignee || "-"}</td>
                    <td><span className={`v50-badge ${st === "지연" ? "danger" : st === "임박" ? "warn" : st === "완료" ? "ok" : ""}`}>{st}</span></td>
                    <td><button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => test?.id && onOpenTest(test.id)}>열기</button></td>
                  </tr>
                );
              })}
              {s.listItems.length === 0 && <tr><td colSpan={6} style={{ color: "#94a3b8", textAlign: "center" }}>{s.loading ? "불러오는 중..." : "일정이 없습니다."}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
