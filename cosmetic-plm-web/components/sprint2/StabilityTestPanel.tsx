"use client";

import { useRef } from "react";
import { useStabilityTest } from "@/hooks/useStabilityTest";
import {
  STABILITY_CONDITION_PRESETS,
  type StabilityConditionType,
  type StabilityConditionWithCheckpoints,
  type StabilityCheckpoint,
  type StabilityTestStatus,
} from "@/services/sprint2/stabilityTestService";
import "@/styles/enterprise-v50.css";

type S = ReturnType<typeof useStabilityTest>;

function judgementBadgeClass(j: string) {
  if (j === "적합") return "ok";
  if (j === "부적합") return "danger";
  if (j === "관찰필요") return "warn";
  return "";
}

function TestForm({ s }: { s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="v50-input" value={s.formulaKeyword} onChange={(e) => s.setFormulaKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && s.searchFormula()}
          placeholder="처방코드 또는 확정코드 검색" style={{ maxWidth: 240 }}
        />
        <button className="v50-button" onClick={s.searchFormula} disabled={s.formulaSearching}>{s.formulaSearching ? "검색 중…" : "검색"}</button>
      </div>
      {s.formulaHits.length > 0 && (
        <div className="v50-table-wrap" style={{ marginTop: 8 }}>
          <table className="v50-table">
            <thead><tr><th>처방코드</th><th>처방명</th><th>Rev</th><th>확정코드</th><th></th></tr></thead>
            <tbody>
              {s.formulaHits.map((f) => (
                <tr key={`${f.formula_code}-${f.revision}`}>
                  <td>{f.formula_code}</td><td>{f.formula_name || "-"}</td><td>{f.revision}</td><td>{f.confirmed_code || "-"}</td>
                  <td><button className="v50-button-light" onClick={() => s.pickFormula(f)}>선택</button></td>
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

      <div className="v50-grid-2" style={{ marginTop: 10 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>시료명<input className="v50-input" value={s.sampleName} onChange={(e) => s.setSampleName(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>Lot No.<input className="v50-input" value={s.lotNo} onChange={(e) => s.setLotNo(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>제조일자<input className="v50-input" type="date" value={s.manufactureDate} onChange={(e) => s.setManufactureDate(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>보관 위치<input className="v50-input" value={s.storageLocation} onChange={(e) => s.setStorageLocation(e.target.value)} placeholder="예: 항온항습기 A" /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          담당자
          <div style={{ display: "flex", gap: 6 }}>
            <input className="v50-input" value={s.assignee} onChange={(e) => s.setAssignee(e.target.value)} />
            <button type="button" className="v50-button-light" onClick={() => s.setAssignee(s.myName)}>나로 지정</button>
          </div>
        </label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
          상태
          <select className="v50-input" value={s.testStatus} onChange={(e) => s.setTestStatus(e.target.value as StabilityTestStatus)}>
            {s.testStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </label>
      </div>
      <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>메모<textarea className="v50-textarea" rows={2} value={s.testMemo} onChange={(e) => s.setTestMemo(e.target.value)} /></label>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="v50-button" onClick={s.saveTest} disabled={s.savingTest}>{s.savingTest ? "저장 중…" : "저장"}</button>
        <button className="v50-button-light" onClick={() => s.setShowTestForm(false)}>취소</button>
      </div>
    </div>
  );
}

function AddConditionForm({ s }: { s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STABILITY_CONDITION_PRESETS.map((p) => (
          <button
            key={p.type} type="button"
            className={s.conditionType === p.type ? "v50-button" : "v50-button-light"}
            onClick={() => s.selectConditionType(p.type as StabilityConditionType)}
          >
            {p.type}
          </button>
        ))}
      </div>
      <div className="v50-grid-2" style={{ marginTop: 10 }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>조건 라벨<input className="v50-input" value={s.conditionLabel} onChange={(e) => s.setConditionLabel(e.target.value)} /></label>
        <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>시작일<input className="v50-input" type="date" value={s.conditionStartDate} onChange={(e) => s.setConditionStartDate(e.target.value)} /></label>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>평가 항목</div>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead><tr><th>항목명</th><th>유형</th><th>단위</th><th>기준</th><th></th></tr></thead>
            <tbody>
              {s.itemTemplates.map((it, i) => (
                <tr key={it.key}>
                  <td><input className="v50-input" value={it.label} onChange={(e) => s.updateItemTemplate(i, { label: e.target.value })} /></td>
                  <td>
                    <select className="v50-input" value={it.type} onChange={(e) => s.updateItemTemplate(i, { type: e.target.value as "text" | "number" })}>
                      <option value="text">텍스트(관찰)</option>
                      <option value="number">숫자</option>
                    </select>
                  </td>
                  <td><input className="v50-input" style={{ width: 70 }} value={it.unit || ""} onChange={(e) => s.updateItemTemplate(i, { unit: e.target.value })} /></td>
                  <td>
                    {it.type === "number" ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input className="v50-input" style={{ width: 70 }} type="number" placeholder="최소" value={it.spec_min ?? ""} onChange={(e) => s.updateItemTemplate(i, { spec_min: e.target.value === "" ? null : Number(e.target.value) })} />
                        ~
                        <input className="v50-input" style={{ width: 70 }} type="number" placeholder="최대" value={it.spec_max ?? ""} onChange={(e) => s.updateItemTemplate(i, { spec_max: e.target.value === "" ? null : Number(e.target.value) })} />
                      </div>
                    ) : (
                      <input className="v50-input" value={it.spec_text || ""} onChange={(e) => s.updateItemTemplate(i, { spec_text: e.target.value })} placeholder="예: 변화 없음" />
                    )}
                  </td>
                  <td><button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.removeItemTemplate(i)}>삭제</button></td>
                </tr>
              ))}
              {s.itemTemplates.length === 0 && <tr><td colSpan={5} style={{ color: "#94a3b8" }}>평가 항목이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        <button type="button" className="v50-button-light" style={{ marginTop: 6 }} onClick={s.addItemTemplateRow}>+ 항목 추가</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="v50-button" onClick={s.submitAddCondition} disabled={s.savingCondition}>{s.savingCondition ? "추가 중…" : "조건 추가"}</button>
        <button className="v50-button-light" onClick={() => s.setShowAddCondition(false)}>취소</button>
      </div>
    </div>
  );
}

function CheckpointResultForm({ s }: { s: S }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  if (!s.activeCheckpoint) return null;
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10, border: "2px solid #2563eb" }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
        {s.activeConditionForCheckpoint?.condition_label} · {s.activeCheckpoint.checkpoint_label} 결과 입력 (예정일 {s.activeCheckpoint.due_date})
      </div>
      <div className="v50-table-wrap">
        <table className="v50-table">
          <thead><tr><th>항목</th><th>측정값</th><th>판정</th></tr></thead>
          <tbody>
            {s.resultDraft.map((r, i) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td><input className="v50-input" value={r.value} onChange={(e) => s.updateResultValue(i, e.target.value)} /></td>
                <td>
                  <select className="v50-input" value={r.judgement} onChange={(e) => s.updateResultJudgement(i, e.target.value as typeof r.judgement)}>
                    <option value="">-</option>
                    <option value="적합">적합</option>
                    <option value="부적합">부적합</option>
                    <option value="관찰필요">관찰필요</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>외관 사진</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {s.photoDraft.map((url) => (
            <div key={url} style={{ position: "relative" }}>
              <img src={url} alt="시료 사진" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 6, border: "1px solid #cbd5e1" }} />
              <button type="button" onClick={() => s.removePhotoFromDraft(url)}
                style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: 11 }}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="v50-button-light" onClick={() => fileRef.current?.click()} disabled={s.uploadingPhoto}>
            {s.uploadingPhoto ? "업로드 중…" : "+ 사진 추가"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) s.addPhotoToDraft(f); e.target.value = ""; }} />
        </div>
      </div>

      <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 10 }}>메모<textarea className="v50-textarea" rows={2} value={s.checkpointMemo} onChange={(e) => s.setCheckpointMemo(e.target.value)} /></label>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="v50-button" onClick={s.submitCheckpointResult} disabled={s.savingCheckpoint}>{s.savingCheckpoint ? "저장 중…" : "결과 저장"}</button>
        <button className="v50-button-light" onClick={s.closeCheckpointForm}>닫기</button>
      </div>
    </div>
  );
}

function ConditionCard({ condition, s }: { condition: StabilityConditionWithCheckpoints; s: S }) {
  return (
    <div className="v50-card" style={{ padding: 14, marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <div>
          <b style={{ fontSize: 14 }}>{condition.condition_label}</b>
          <span style={{ color: "#64748b", fontSize: 12, marginLeft: 8 }}>시작일 {condition.start_date}</span>
        </div>
        {s.canWrite && <button className="v50-button-light" style={{ color: "#dc2626", fontSize: 11 }} onClick={() => s.removeCondition(condition.id)}>조건 삭제</button>}
      </div>
      <div className="v50-table-wrap" style={{ marginTop: 8 }}>
        <table className="v50-table">
          <thead><tr><th>시점</th><th>예정일</th><th>상태</th><th>종합판정</th><th></th></tr></thead>
          <tbody>
            {condition.checkpoints.map((cp: StabilityCheckpoint) => {
              const overdue = s.isCheckpointOverdue(cp);
              const overall = s.computeOverallJudgement(cp.results);
              return (
                <tr key={cp.id}>
                  <td>{cp.checkpoint_label}</td>
                  <td style={{ color: overdue ? "#dc2626" : undefined, fontWeight: overdue ? 800 : undefined }}>{cp.due_date}{overdue && " (지연)"}</td>
                  <td>
                    <span className={`v50-badge ${cp.status === "완료" ? "ok" : overdue ? "danger" : ""}`}>
                      {cp.status === "완료" ? "완료" : overdue ? "지연" : "예정"}
                    </span>
                  </td>
                  <td>{cp.status === "완료" ? <span className={`v50-badge ${judgementBadgeClass(overall)}`}>{overall}</span> : "-"}</td>
                  <td style={{ display: "flex", gap: 4 }}>
                    {s.canWrite && <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => s.openCheckpointForm(condition, cp)}>{cp.status === "완료" ? "수정" : "입력"}</button>}
                    {s.canWrite && <button className="v50-button-light" style={{ fontSize: 11, padding: "3px 8px", color: "#dc2626" }} onClick={() => s.removeCheckpoint(cp.id)}>삭제</button>}
                  </td>
                </tr>
              );
            })}
            {condition.checkpoints.length === 0 && <tr><td colSpan={5} style={{ color: "#94a3b8" }}>체크포인트가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StabilityTestPanel() {
  const s = useStabilityTest();

  return (
    <div>
      <p className="v50-desc" style={{ marginBottom: 14 }}>
        처방(시료)을 등록하고 시험조건(장기보존/가속/가혹/냉동해동/광안정성)을 추가하면 시작일 기준으로 체크포인트 일정이 자동 생성됩니다.
        예정일이 지났는데 결과 미입력이면 지연으로 표시됩니다.
      </p>
      {s.message && <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 18, alignItems: "start" }}>
        <section className="v50-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15 }}>시료 목록 ({s.allTestsCount})</h2>
            {s.canWrite && <button className="v50-button-light" onClick={s.newTestForm}>+ 새 시료</button>}
          </div>
          <input className="v50-input" style={{ marginTop: 8 }} value={s.listKeyword} onChange={(e) => s.setListKeyword(e.target.value)} placeholder="처방코드/시료명/Lot No 검색" />

          {s.showTestForm && <TestForm s={s} />}

          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
            {s.tests.map((t) => (
              <button
                key={t.id}
                onClick={() => t.id && s.selectTest(t.id)}
                className={s.selectedTestId === t.id ? "v50-button" : "v50-button-light"}
                style={{ textAlign: "left", justifyContent: "flex-start", display: "block", padding: "8px 10px" }}
              >
                <div style={{ fontWeight: 800, fontSize: 13 }}>{t.sample_name || t.formula_name || t.formula_code}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{t.formula_code} · Lot {t.lot_no || "-"} · {t.status}</div>
              </button>
            ))}
            {s.tests.length === 0 && <p style={{ color: "#94a3b8", fontSize: 12 }}>{s.loading ? "불러오는 중..." : "등록된 시료가 없습니다."}</p>}
          </div>
        </section>

        <div>
          {!s.selectedTest && <section className="v50-panel"><p style={{ color: "#94a3b8" }}>왼쪽 목록에서 시료를 선택하거나 새로 등록하세요.</p></section>}

          {s.selectedTest && (
            <>
              <section className="v50-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{s.selectedTest.sample_name || s.selectedTest.formula_name}</h2>
                    <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
                      {s.selectedTest.formula_code} (Rev {s.selectedTest.revision}) · 확정코드 {s.selectedTest.confirmed_code || "-"} · Lot {s.selectedTest.lot_no || "-"} · 담당자 {s.selectedTest.assignee || "-"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="v50-button-light" onClick={() => s.printCertificate(s.selectedTest!)}>성적서 인쇄/PDF</button>
                    <button className="v50-button-light" onClick={() => s.downloadCertificate(s.selectedTest!)}>HTML 다운로드</button>
                    {s.canWrite && <button className="v50-button-light" onClick={() => s.editTestForm(s.selectedTest!)}>수정</button>}
                    {s.canWrite && <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => s.selectedTest?.id && s.removeTest(s.selectedTest.id)}>삭제</button>}
                  </div>
                </div>
                {s.selectedTest.memo && <p style={{ fontSize: 12, color: "#334155", marginTop: 8, whiteSpace: "pre-wrap" }}>{s.selectedTest.memo}</p>}

                {s.canWrite && !s.showAddCondition && (
                  <button className="v50-button-light" style={{ marginTop: 10 }} onClick={() => s.setShowAddCondition(true)}>+ 시험조건 추가</button>
                )}
                {s.showAddCondition && <AddConditionForm s={s} />}
              </section>

              {s.activeCheckpoint && <CheckpointResultForm s={s} />}

              {s.conditionsLoading && <p style={{ color: "#94a3b8", marginTop: 10 }}>불러오는 중...</p>}
              {!s.conditionsLoading && s.conditions.map((c) => <ConditionCard key={c.id} condition={c} s={s} />)}
              {!s.conditionsLoading && s.conditions.length === 0 && (
                <section className="v50-panel" style={{ marginTop: 10 }}><p style={{ color: "#94a3b8" }}>등록된 시험조건이 없습니다. &quot;+ 시험조건 추가&quot;로 시작하세요.</p></section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
