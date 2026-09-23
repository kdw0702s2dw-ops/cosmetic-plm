"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchRecentSystemUpdates,
  addSystemUpdate,
  deleteSystemUpdate,
  SYSTEM_UPDATE_VISIBLE_DAYS,
  type SystemUpdate,
} from "@/services/home/systemUpdateService";
import "@/styles/enterprise-v50.css";

interface Props {
  canWrite: boolean; // Admin만 true - 등록/삭제 UI는 Admin에게만 노출
  createdBy?: string;
}

function fmtDateTime(v: string) {
  const d = new Date(v);
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * 연구원 홈 상단에 배치하는 "시스템 업데이트" 표. 등록 후 SYSTEM_UPDATE_VISIBLE_DAYS(2일)가
 * 지나면 조회 자체에서 걸러져 화면에서 자동으로 사라진다 - 별도 삭제 배치나 크론 없이, 볼 때마다
 * "최근 2일" 기준으로 다시 걸러서 보여주는 방식.
 */
export default function SystemUpdatesSection({ canWrite, createdBy }: Props) {
  const [items, setItems] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setItems(await fetchRecentSystemUpdates());
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "업데이트 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await addSystemUpdate({ title, description, createdBy });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: SystemUpdate) {
    if (!confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) return;
    try {
      await deleteSystemUpdate(item.id);
      await load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <article className="v50-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>시스템 업데이트</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            최근 {SYSTEM_UPDATE_VISIBLE_DAYS}일 이내에 등록된 내용만 표시되고, 그 이후로는 자동으로 사라집니다.
          </p>
        </div>
        <button className="v50-button-light" onClick={() => load()} disabled={loading}>
          {loading ? "새로고침 중…" : "새로고침"}
        </button>
      </div>

      {errorMsg && <p style={{ color: "#dc2626", fontWeight: 800 }}>{errorMsg}</p>}

      {canWrite && (
        <div style={{ display: "grid", gap: 8, margin: "12px 0", padding: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}>
          <input
            className="v50-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="업데이트 제목 (예: 원료관리 서류 현황 화면 추가)"
          />
          <textarea
            className="v50-textarea"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 설명 (선택)"
          />
          <div>
            <button className="v50-button" onClick={handleAdd} disabled={saving || !title.trim()}>
              {saving ? "등록 중…" : "업데이트 등록"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {items.map((item) => (
          <div key={item.id} className="v50-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <strong>{item.title}</strong>
              <span style={{ color: "#64748b", fontSize: 12 }}>{fmtDateTime(item.created_at)}</span>
            </div>
            {item.description && (
              <div style={{ color: "#334155", fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>{item.description}</div>
            )}
            {canWrite && (
              <div style={{ marginTop: 8 }}>
                <button className="v50-button-light" style={{ color: "#dc2626", fontSize: 11, padding: "3px 8px" }} onClick={() => handleDelete(item)}>
                  삭제
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && items.length === 0 && (
          <p style={{ color: "#94a3b8" }}>최근 {SYSTEM_UPDATE_VISIBLE_DAYS}일 내 등록된 업데이트가 없습니다.</p>
        )}
      </div>
    </article>
  );
}
