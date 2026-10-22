"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addUsageNote,
  deleteUsageNote,
  fetchUsageNotes,
  type UsageNote,
} from "@/services/sprint2/rawMaterialUsageNoteService";
import { fetchUserDisplayNames } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

interface Props {
  canWrite: boolean;
  createdBy?: string;
}

function fmtDateTime(v: string) {
  const d = new Date(v);
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * 사용량 이력 화면의 "처방 반영 요약" 아래에 두는 자유 비고 섹션. 특정 반영 건(날짜+처방)에 매이지
 * 않는 생산 특이사항 등을 자유롭게 적어두는 용도 - 연구원 홈 "시스템 업데이트"와 입력칸 크기/형태는
 * 같지만, 일정 기간 뒤 자동으로 사라지지 않고 계속 남는다(최근 50건).
 */
export default function RawMaterialUsageNotesSection({ canWrite, createdBy }: Props) {
  const [items, setItems] = useState<UsageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // "처리자"를 이메일이 아니라 이름으로 보여주기 위한 이메일->이름 맵 - 바로 옆 사용량 이력 표들
  // (useRawMaterialUsageLog의 resolveCreatedBy)과 같은 방식. 이 섹션은 그 훅을 쓰지 않는 독립
  // 컴포넌트라 동일한 패턴을 그대로 다시 가져왔다.
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  useEffect(() => {
    fetchUserDisplayNames().then(setDisplayNames).catch(() => {});
  }, []);
  function resolveCreatedBy(email?: string | null): string {
    if (!email) return "-";
    return displayNames[email] || email;
  }

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setItems(await fetchUsageNotes());
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "비고 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!note.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await addUsageNote(note, createdBy);
      setNote("");
      await load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: UsageNote) {
    if (!confirm("이 비고를 삭제하시겠습니까?")) return;
    try {
      await deleteUsageNote(item.id);
      await load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <section className="v50-panel" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>비고</h3>
        <button className="v50-button-light" onClick={() => load()} disabled={loading}>
          {loading ? "새로고침 중…" : "새로고침"}
        </button>
      </div>

      {errorMsg && <p style={{ color: "#dc2626", fontWeight: 800 }}>{errorMsg}</p>}

      {canWrite && (
        <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
          <textarea
            className="v50-textarea"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="생산 특이사항 등 자유롭게 메모하세요."
          />
          <div>
            <button className="v50-button" onClick={handleAdd} disabled={saving || !note.trim()}>
              {saving ? "등록 중…" : "등록"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {items.map((item) => (
          <div key={item.id} className="v50-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div style={{ color: "#334155", fontSize: 13, whiteSpace: "pre-wrap" }}>{item.note}</div>
              <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                {resolveCreatedBy(item.created_by)} · {fmtDateTime(item.created_at)}
              </span>
            </div>
            {canWrite && (
              <div style={{ marginTop: 8 }}>
                <button className="v50-button-light" style={{ color: "#dc2626", fontSize: 11, padding: "3px 8px" }} onClick={() => handleDelete(item)}>
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && items.length === 0 && <p style={{ color: "#94a3b8" }}>등록된 비고가 없습니다.</p>}
      </div>
    </section>
  );
}
