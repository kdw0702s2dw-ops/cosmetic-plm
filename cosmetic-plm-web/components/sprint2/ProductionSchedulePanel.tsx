"use client";

import { useProductionSchedule } from "@/hooks/useProductionSchedule";
import { SCHEDULE_TYPE_COLORS, type ProductionSchedule, type ScheduleStatus, type ScheduleType } from "@/services/sprint2/productionScheduleService";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useProductionSchedule>;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// 달력 셀 배열 - 해당 월 1일의 요일만큼 앞을 비우고, 7의 배수가 되도록 뒤도 비운다 (빈 칸은 null).
function buildCalendarCells(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=일요일
  const daysInMonth = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month)}-${d < 10 ? "0" + d : d}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function DayCell({ date, s }: { date: string | null; s: S }) {
  if (!date) return <div style={{ minHeight: 76 }} />;
  const dayItems = s.itemsByDate.get(date) || [];
  const typesPresent = Array.from(new Set(dayItems.map((i) => i.schedule_type)));
  const isToday = date === todayStr();
  const isSelected = date === s.selectedDate;
  const anyOverdue = dayItems.some((i) => s.isScheduleOverdue(i));
  const dayNum = Number(date.slice(-2));
  return (
    <div
      onClick={() => s.selectDate(date)}
      style={{
        minHeight: 76,
        padding: 6,
        borderRadius: 8,
        cursor: "pointer",
        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
        background: isToday ? "#eff6ff" : "#fff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: anyOverdue ? "#dc2626" : "#334155" }}>
        {dayNum}
        {anyOverdue && " ●"}
      </div>
      {typesPresent.length > 0 && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
          {typesPresent.map((t) => (
            <span key={t} title={t} style={{ width: 7, height: 7, borderRadius: "50%", background: SCHEDULE_TYPE_COLORS[t] }} />
          ))}
        </div>
      )}
      {dayItems.length > 0 && <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{dayItems.length}건</div>}
    </div>
  );
}

function StatusSelect({ item, s }: { item: ProductionSchedule; s: S }) {
  return (
    <select
      className="v50-input"
      style={{ fontSize: 11, padding: "3px 6px", width: "auto" }}
      value={item.status}
      onChange={(e) => s.changeStatus(item.id!, e.target.value as ScheduleStatus)}
    >
      {s.statuses.map((st) => (
        <option key={st} value={st}>{st}</option>
      ))}
    </select>
  );
}

export default function ProductionSchedulePanel() {
  const s = useProductionSchedule();
  const monthLabel = `${s.year}년 ${s.month}월`;

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방을 검색해서 등록하면 칭량·제조·도포·타공·포장·출고 6개 공정 일정을 달력에서 관리할 수 있습니다.
        날짜를 지나도 완료 처리되지 않은 일정은 자동으로 지연(●) 표시됩니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>
        <section className="v50-panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button className="v50-button-light" onClick={s.prevMonth}>◀</button>
              <h2 style={{ margin: 0, fontSize: 16 }}>{monthLabel}</h2>
              <button className="v50-button-light" onClick={s.nextMonth}>▶</button>
              <button className="v50-button-light" onClick={s.goToday}>오늘</button>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
              {s.types.map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: SCHEDULE_TYPE_COLORS[t] }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 12 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{w}</div>
            ))}
            {buildCalendarCells(s.year, s.month).map((date, i) => (
              <DayCell key={date || `empty-${i}`} date={date} s={s} />
            ))}
          </div>

          {s.selectedDate && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>{s.selectedDate} 일정</span>
              <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => s.selectDate(s.selectedDate!)}>전체 보기로</button>
            </div>
          )}

          <div className="v50-table-wrap" style={{ marginTop: 10 }}>
            <table className="v50-table">
              <thead>
                <tr><th>날짜</th><th>유형</th><th>처방코드</th><th>처방명</th><th>수량</th><th>담당자</th><th>상태</th><th></th></tr>
              </thead>
              <tbody>
                {s.listItems.map((item) => {
                  const overdue = s.isScheduleOverdue(item);
                  return (
                    <tr key={item.id}>
                      <td style={{ color: overdue ? "#dc2626" : undefined, fontWeight: overdue ? 800 : undefined }}>
                        {item.schedule_date}{overdue && " (지연)"}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: SCHEDULE_TYPE_COLORS[item.schedule_type] }} />
                          {item.schedule_type}
                        </span>
                      </td>
                      <td>{item.formula_code}</td>
                      <td>{item.formula_name || "-"}</td>
                      <td>{item.quantity ?? "-"}</td>
                      <td>{item.assignee || "-"}</td>
                      <td><StatusSelect item={item} s={s} /></td>
                      <td style={{ display: "flex", gap: 4 }}>
                        <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => s.editItem(item)}>수정</button>
                        <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px", color: "#dc2626" }} onClick={() => s.removeItem(item.id!)}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
                {s.listItems.length === 0 && (
                  <tr><td colSpan={8} style={{ color: "#94a3b8", textAlign: "center" }}>{s.loading ? "불러오는 중..." : "일정이 없습니다."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="v50-panel">
          <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>{s.editingId ? "일정 수정" : "일정 등록"}</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="v50-input"
              value={s.keyword}
              onChange={(e) => s.setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && s.search()}
              placeholder="처방코드 또는 확정코드 검색"
              style={{ maxWidth: 220 }}
            />
            <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
            {s.editingId && <button className="v50-button-light" onClick={s.resetForm}>취소</button>}
          </div>

          {s.hits.length > 0 && (
            <div className="v50-table-wrap" style={{ marginTop: 8 }}>
              <table className="v50-table">
                <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
                <tbody>
                  {s.hits.map((f) => (
                    <tr key={`${f.formula_code}-${f.revision}`}>
                      <td>{f.formula_code}</td><td>{f.formula_name || "-"}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                      <td><button className="v50-button-light" onClick={() => s.selectFormula(f)}>선택</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {s.selectedFormula ? (
            <div style={{ fontSize: 13, color: "#334155", marginTop: 10 }}>
              <b>{s.selectedFormula.formula_code}</b> ({s.selectedFormula.revision}) {s.selectedFormula.formula_name || "-"}
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>처방을 검색해서 선택하세요.</p>
          )}

          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {s.types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => s.setScheduleType(t as ScheduleType)}
                className={s.scheduleType === t ? "v50-button" : "v50-button-light"}
                style={s.scheduleType === t ? { background: SCHEDULE_TYPE_COLORS[t], borderColor: SCHEDULE_TYPE_COLORS[t] } : undefined}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="v50-grid-2" style={{ marginTop: 10 }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              날짜
              <input className="v50-input" type="date" value={s.scheduleDate} onChange={(e) => s.setScheduleDate(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              수량
              <input className="v50-input" type="number" value={s.quantity} onChange={(e) => s.setQuantity(e.target.value)} placeholder="선택 입력" />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              담당자
              <div style={{ display: "flex", gap: 6 }}>
                <input className="v50-input" value={s.assignee} onChange={(e) => s.setAssignee(e.target.value)} placeholder="담당자 성함" />
                <button type="button" className="v50-button-light" onClick={s.assignToMe}>나로 지정</button>
              </div>
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              진행상태
              <select className="v50-input" value={s.status} onChange={(e) => s.setStatus(e.target.value as ScheduleStatus)}>
                {s.statuses.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>
            메모
            <textarea className="v50-textarea" rows={3} value={s.memo} onChange={(e) => s.setMemo(e.target.value)} />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="v50-button" onClick={s.save} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
          </div>
        </section>
      </div>
    </div>
  );
}
