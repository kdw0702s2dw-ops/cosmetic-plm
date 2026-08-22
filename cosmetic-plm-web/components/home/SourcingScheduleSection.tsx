"use client";

import { useSourcingSchedule } from "@/hooks/useSourcingSchedule";
import { isOverdue, isDueSoonOrOverdue, type SourcingScheduleNote, type SourcingStatus } from "@/services/sprint2/sourcingScheduleService";
import "@/styles/enterprise-v50.css";

type Sourcing = ReturnType<typeof useSourcingSchedule>;

function fmtDate(v: string | null | undefined) {
  if (!v) return "-";
  return v;
}

function Card({ item, s }: { item: SourcingScheduleNote; s: Sourcing }) {
  const overdue = isOverdue(item);
  const dueSoon = !overdue && isDueSoonOrOverdue(item);
  return (
    <div className="v50-card" style={{ padding: 12, display: "grid", gap: 6, border: overdue ? "1px solid #fca5a5" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 13 }}>{item.formula_code}</strong>
        <span style={{ color: "#64748b", fontSize: 12 }}>Rev {item.revision}</span>
      </div>
      <div style={{ fontSize: 13 }}>{item.formula_name || "-"}</div>
      <div style={{ color: "#64748b", fontSize: 12 }}>확정코드 {item.confirmed_code || "-"}</div>
      {item.assignee && <div style={{ color: "#334155", fontSize: 12 }}>담당자 {item.assignee}</div>}
      <div style={{ fontSize: 12, color: overdue ? "#dc2626" : dueSoon ? "#d97706" : "#64748b", fontWeight: overdue || dueSoon ? 800 : 400 }}>
        요청일 {fmtDate(item.requested_date)} · 예상입고 {fmtDate(item.expected_arrival_date)}
        {overdue && " (지연)"}
        {dueSoon && " (임박)"}
      </div>
      {item.note && <div style={{ fontSize: 12, color: "#334155", whiteSpace: "pre-wrap" }}>{item.note}</div>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => s.editItem(item)}>수정</button>
        <select
          className="v50-input"
          style={{ fontSize: 11, padding: "3px 6px", width: "auto" }}
          value={item.status}
          onChange={(e) => s.moveStatus(item.id!, e.target.value as SourcingStatus)}
        >
          {s.statuses.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
        </select>
        <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px", color: "#dc2626" }} onClick={() => s.removeItem(item.id!)}>삭제</button>
      </div>
    </div>
  );
}

export default function SourcingScheduleSection({ s }: { s: Sourcing }) {
  return (
    <article className="v50-panel" id="sourcing-schedule">
      <h2>원료 소싱 일정관리</h2>
      <p style={{ color: "#64748b", fontSize: 13 }}>
        처방코드 또는 확정코드를 검색해서 선택하면 처방코드·확정코드·처방명·Revision이 자동으로 채워집니다.
        요청일·예상입고일·담당자·비고를 작성/수정하고 저장하면 아래 칸반 보드에 반영됩니다.
        칼럼(단계)은 카드의 선택박스로 바로 옮길 수 있고, &quot;발송 완료&quot;로 옮기면 최근 항목 위주로만 노출됩니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="v50-input"
          value={s.keyword}
          onChange={(e) => s.setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.search()}
          placeholder="처방코드 또는 확정코드 검색"
          style={{ maxWidth: 280 }}
        />
        <button className="v50-button" onClick={s.search} disabled={s.searching}>{s.searching ? "검색 중…" : "검색"}</button>
        {s.selectedFormula && <button className="v50-button-light" onClick={s.reset}>선택 해제</button>}
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginLeft: "auto" }}>
          <input type="checkbox" checked={s.onlyMine} onChange={(e) => s.setOnlyMine(e.target.checked)} />
          내 담당 건만 보기
        </label>
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

      {s.selectedFormula && (
        <div className="v50-card" style={{ padding: 14, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#334155" }}>
            <span><b>처방코드</b> {s.selectedFormula.formula_code}</span>
            <span><b>확정코드</b> {s.selectedFormula.confirmed_code || "-"}</span>
            <span><b>처방명</b> {s.selectedFormula.formula_name || "-"}</span>
            <span><b>Revision</b> {s.selectedFormula.revision}</span>
            {s.editingItem && <span style={{ color: "#2563eb", fontWeight: 800 }}>기존 소싱 메모 수정 중 ({s.statuses.find((st) => st.key === s.editingItem!.status)?.label})</span>}
          </div>
          <div className="v50-grid-2" style={{ marginTop: 10 }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              요청일
              <input className="v50-input" type="date" value={s.requestedDate} onChange={(e) => s.setRequestedDate(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              예상 입고일
              <input className="v50-input" type="date" value={s.expectedArrivalDate} onChange={(e) => s.setExpectedArrivalDate(e.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
              담당자
              <div style={{ display: "flex", gap: 6 }}>
                <input className="v50-input" value={s.assignee} onChange={(e) => s.setAssignee(e.target.value)} placeholder="연구원 성함 입력" />
                <button type="button" className="v50-button-light" onClick={s.assignToMe}>나로 지정</button>
              </div>
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>
            비고 (원료 소싱 진행 상황)
            <textarea className="v50-textarea" rows={3} value={s.note} onChange={(e) => s.setNote(e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="v50-button" onClick={s.save} disabled={s.saving}>{s.saving ? "저장 중…" : "저장"}</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
        {s.statuses.map((st) => (
          <div key={st.key} style={{ background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 14, padding: 10, display: "grid", gap: 8, alignContent: "start", minHeight: 120 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: 13 }}>{st.label}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}>{s.board[st.key].length}건</span>
            </div>
            {s.board[st.key].map((item) => <Card key={item.id} item={item} s={s} />)}
            {s.board[st.key].length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 12 }}>{s.loading ? "불러오는 중..." : "없음"}</p>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
