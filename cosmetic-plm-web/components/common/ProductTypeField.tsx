"use client";

import { useEffect, useRef, useState } from "react";
import { listProductTypes, addProductType, renameProductType, type ProductType } from "@/services/sprint1/productTypeService";

// 처방관리 "제품유형" 칸 - 기존에는 자유 입력이라 "플라스타"/"플라스타 패치"처럼 같은 유형이 사람마다
// 다르게 입력되어 통계(제품유형별 분포 등)가 흩어지는 문제가 있었다. plm_product_types 마스터 목록에서
// 고르는 드롭다운으로 바꾸고, 목록에 없는 새 유형은 이 칸에서 바로 추가할 수 있게 한다
// (CompanyAutocompleteField의 "새 업체 추가"와 같은 취지지만, 제품유형은 검색 없이 전체 목록을
// select로 바로 보여줄 만큼 수가 적어서 더 단순한 드롭다운+추가 버튼 형태로 만들었다).
// 지금 선택된 유형의 이름을 고치는 기능도 있다("수정" 링크) - 마스터 목록 이름만 바뀌는 게 아니라,
// 그 이름으로 저장된 다른 처방들도 renameProductType이 전부 함께 바꿔준다(서버의 plm_rename_product_type
// 함수가 한 트랜잭션으로 처리). 몇 건이 함께 바뀌었는지는 저장 후 안내 문구로 보여준다.
export default function ProductTypeField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProductTypes()
      .then((rows) => { if (!cancelled) setTypes(rows); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (editing) editInputRef.current?.focus();
  }, [editing]);

  // 지금 선택된 값이 마스터 목록에 없을 수 있다(목록을 아직 못 불러왔거나, 다른 곳에서 생긴 과거 값).
  // 그런 경우 옵션에서 조용히 사라지지 않도록 맨 앞에 그대로 끼워 넣는다.
  const options = value && loaded && !types.some((t) => t.name === value)
    ? [{ id: "__current__", name: value }, ...types]
    : types;
  // 수정 링크는 실제 마스터 목록 항목(id가 있는 것)을 선택했을 때만 보여준다 - 목록을 아직 못 불러왔거나
  // 위의 "__current__" 임시 항목인 경우는 바꿀 대상 id가 없어서 수정할 수 없다.
  const currentType = value ? types.find((t) => t.name === value) : undefined;

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await addProductType(name);
      setTypes((prev) => (prev.some((t) => t.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ko"))));
      onChange(created.name);
      setAdding(false);
      setNewName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "제품유형 추가 오류");
    } finally {
      setSaving(false);
    }
  }

  function cancelAdd() {
    setAdding(false);
    setNewName("");
  }

  function openEdit() {
    if (!currentType) return;
    setEditName(currentType.name);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditName("");
  }

  async function handleRename() {
    if (!currentType) return;
    const name = editName.trim();
    if (!name || name === currentType.name) { cancelEdit(); return; }
    if (!window.confirm(`"${currentType.name}" → "${name}"로 이름을 바꿀까요?\n이 이름으로 저장된 다른 처방들의 제품유형도 함께 바뀝니다.`)) return;
    setRenaming(true);
    try {
      const { name: finalName, renamedFormulaCount } = await renameProductType(currentType.id, name);
      setTypes((prev) => prev.map((t) => (t.id === currentType.id ? { ...t, name: finalName } : t)).sort((a, b) => a.name.localeCompare(b.name, "ko")));
      onChange(finalName);
      setEditing(false);
      setEditName("");
      alert(renamedFormulaCount > 0
        ? `이름을 "${finalName}"로 바꿨습니다. (같은 유형을 쓰던 처방 ${renamedFormulaCount}건도 함께 바뀜)`
        : `이름을 "${finalName}"로 바꿨습니다.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "제품유형 이름 수정 오류");
    } finally {
      setRenaming(false);
    }
  }

  return (
    <label style={{ display: "grid", gap: 6, fontWeight: 800 }}>
      제품유형
      {adding ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={inputRef} className="v50-input" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") { e.preventDefault(); cancelAdd(); }
            }}
            placeholder="새 제품유형 이름"
          />
          <button type="button" className="v50-button-light" disabled={saving || !newName.trim()} onClick={handleAdd}>
            {saving ? "추가 중…" : "추가"}
          </button>
          <button type="button" className="v50-button-light" onClick={cancelAdd} disabled={saving}>취소</button>
        </div>
      ) : editing ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            ref={editInputRef} className="v50-input" value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleRename(); }
              if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
            }}
          />
          <button type="button" className="v50-button-light" disabled={renaming || !editName.trim()} onClick={handleRename}>
            {renaming ? "저장 중…" : "저장"}
          </button>
          <button type="button" className="v50-button-light" onClick={cancelEdit} disabled={renaming}>취소</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            className="v50-input" value={value || ""} style={{ flex: 1 }}
            onChange={(e) => {
              if (e.target.value === "__add_new__") { setAdding(true); return; }
              onChange(e.target.value);
            }}
          >
            <option value="">선택 안 함</option>
            {options.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            <option value="__add_new__">+ 새 유형 추가…</option>
          </select>
          {currentType && (
            <button
              type="button" onClick={openEdit}
              style={{
                fontSize: 11, color: "#2563eb", fontWeight: 700, background: "none", border: "none",
                padding: 0, cursor: "pointer", textDecoration: "underline", whiteSpace: "nowrap",
              }}
            >
              수정
            </button>
          )}
        </div>
      )}
    </label>
  );
}
