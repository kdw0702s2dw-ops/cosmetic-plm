"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchIngredientDictionary, fetchIngredientById, checkIngredientDuplicate, saveIngredient, deleteIngredient,
  type IngredientDictionaryItem,
} from "@/services/sprint2/ingredientDictionaryService";
import Toast, { type ToastState } from "@/components/common/Toast";
import "@/styles/enterprise-v50.css";

const PAGE_SIZE = 20;

const emptyItem: IngredientDictionaryItem = {
  inci_kr: "", inci_en: "", inci_cn: "", inci_jp: "", cas_no: "", ec_no: "", function_kr: "", function_en: "", note: "",
};

export default function IngredientDictionaryManager() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<IngredientDictionaryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  const [item, setItem] = useState<IngredientDictionaryItem>(emptyItem);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const load = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchIngredientDictionary({ keyword, page, pageSize: PAGE_SIZE });
      setList(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setMsg("목록 조회 오류: " + e.message);
    } finally {
      setListLoading(false);
    }
  }, [keyword, page]);

  useEffect(() => { load(); }, [load]);

  function onSearch() {
    setPage(1);
    load();
  }

  function newItem() {
    setItem({ ...emptyItem });
    setMsg("새 성분 입력 모드");
  }

  async function selectItem(it: IngredientDictionaryItem) {
    setMsg("불러오는 중...");
    try {
      const full = await fetchIngredientById(it.id!);
      setItem(full);
      setMsg("");
    } catch (e: any) {
      setMsg("조회 오류: " + e.message);
    }
  }

  async function handleDelete(it: IngredientDictionaryItem) {
    if (!confirm(`"${it.inci_kr || it.inci_en}"을(를) 삭제하시겠습니까?\n(목록에서만 숨겨지고 완전히 지워지진 않습니다.)`)) return;
    try {
      await deleteIngredient(it.id!);
      if (item.id === it.id) newItem();
      setMsg("삭제 완료");
      await load();
    } catch (e: any) {
      setMsg("삭제 오류: " + e.message);
    }
  }

  async function handleSave() {
    if (!item.inci_kr?.trim() && !item.inci_en?.trim()) { setMsg("INCI 한글명 또는 영문명을 입력하세요."); return; }
    setSaving(true); setMsg("");
    try {
      const dup = await checkIngredientDuplicate({ casNo: item.cas_no || undefined, inciKr: item.inci_kr || undefined }, item.id);
      if (dup && !confirm(`이미 등록된 성분입니다 (기존: ${dup.inci_kr || dup.inci_en || "-"} / CAS ${dup.cas_no || "-"}). 그래도 저장하시겠습니까?`)) {
        return;
      }
      const saved = await saveIngredient(item);
      setItem(saved);
      setMsg("저장 완료");
      setToast({ type: "success", text: "저장되었습니다" });
      await load();
    } catch (e: any) {
      setMsg("저장 오류: " + e.message);
      setToast({ type: "error", text: "저장 실패: " + e.message });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">전성분관리</h1>
          <p className="v50-desc">INCI 표준 사전(plm_ingredient_dictionary)의 마스터 데이터를 관리합니다.</p>
        </div>
        <button className="v50-button" onClick={newItem}>+ 새 성분</button>
      </section>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {msg && <p style={{ color: "#2563eb", fontWeight: 800 }}>{msg}</p>}

      <section className="v50-panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>성분 목록</h2>
          <button className="v50-button-light" onClick={() => load()} disabled={listLoading}>
            {listLoading ? "새로고침 중…" : "새로고침"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: 12 }}>
          <input className="v50-input" value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="INCI 한글명/영문명/CAS No 검색"
            onKeyDown={(e) => e.key === "Enter" && onSearch()} style={{ flex: 1 }} />
          <button className="v50-button" onClick={onSearch}>검색</button>
        </div>
        <div className="v50-table-wrap" style={{ maxHeight: 480, overflow: "auto" }}>
          <table className="v50-table">
            <thead><tr><th>INCI 국문</th><th>INCI 영문</th><th>CAS No</th><th>EC No</th><th style={{ width: 120 }}>액션</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} style={{ background: item.id === r.id ? "#eff6ff" : undefined }}>
                  <td style={{ cursor: "pointer" }} onClick={() => selectItem(r)}>{r.inci_kr || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectItem(r)}>{r.inci_en || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectItem(r)}>{r.cas_no || "-"}</td>
                  <td style={{ cursor: "pointer" }} onClick={() => selectItem(r)}>{r.ec_no || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="v50-button-light" onClick={() => selectItem(r)}>수정</button>
                      <button className="v50-button-light" style={{ color: "#dc2626" }} onClick={() => handleDelete(r)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5}>성분이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button className="v50-button-light" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>이전</button>
          <span style={{ fontSize: 13, color: "#64748b" }}>{page} / {totalPages}페이지 (총 {total}건)</span>
          <button className="v50-button-light" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>다음</button>
        </div>
      </section>

      <section className="v50-panel">
        <h2>{item.id ? "성분 편집" : "새 성분 등록"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 8 }}>
          <Field label="INCI 국문명"><input className="v50-input" value={item.inci_kr || ""} onChange={(e) => setItem({ ...item, inci_kr: e.target.value })} /></Field>
          <Field label="INCI 영문명"><input className="v50-input" value={item.inci_en || ""} onChange={(e) => setItem({ ...item, inci_en: e.target.value })} /></Field>
          <Field label="INCI 중문명"><input className="v50-input" value={item.inci_cn || ""} onChange={(e) => setItem({ ...item, inci_cn: e.target.value })} /></Field>
          <Field label="INCI 일문명"><input className="v50-input" value={item.inci_jp || ""} onChange={(e) => setItem({ ...item, inci_jp: e.target.value })} /></Field>
          <Field label="CAS No"><input className="v50-input" value={item.cas_no || ""} onChange={(e) => setItem({ ...item, cas_no: e.target.value })} /></Field>
          <Field label="EC No"><input className="v50-input" value={item.ec_no || ""} onChange={(e) => setItem({ ...item, ec_no: e.target.value })} /></Field>
          <Field label="효능(국문)"><input className="v50-input" value={item.function_kr || ""} onChange={(e) => setItem({ ...item, function_kr: e.target.value })} /></Field>
          <Field label="효능(영문)"><input className="v50-input" value={item.function_en || ""} onChange={(e) => setItem({ ...item, function_en: e.target.value })} /></Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="비고">
              <textarea className="v50-textarea" rows={3}
                value={item.note || ""} onChange={(e) => setItem({ ...item, note: e.target.value })} />
            </Field>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="v50-button" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중…" : "성분 저장"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#475569", fontWeight: 700, display: "block", marginBottom: 2 }}>{label}</label>
      {children}
    </div>
  );
}
