"use client";

import { useEffect, useRef, useState } from "react";
import { listProductTypes, addProductType, type ProductType } from "@/services/sprint1/productTypeService";

// 처방관리 "제품유형" 칸 - 기존에는 자유 입력이라 "플라스타"/"플라스타 패치"처럼 같은 유형이 사람마다
// 다르게 입력되어 통계(제품유형별 분포 등)가 흩어지는 문제가 있었다. plm_product_types 마스터 목록에서
// 고르는 드롭다운으로 바꾸고, 목록에 없는 새 유형은 이 칸에서 바로 추가할 수 있게 한다
// (CompanyAutocompleteField의 "새 업체 추가"와 같은 취지지만, 제품유형은 검색 없이 전체 목록을
// select로 바로 보여줄 만큼 수가 적어서 더 단순한 드롭다운+추가 버튼 형태로 만들었다).
export default function ProductTypeField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // 지금 선택된 값이 마스터 목록에 없을 수 있다(목록을 아직 못 불러왔거나, 다른 곳에서 생긴 과거 값).
  // 그런 경우 옵션에서 조용히 사라지지 않도록 맨 앞에 그대로 끼워 넣는다.
  const options = value && loaded && !types.some((t) => t.name === value)
    ? [{ id: "__current__", name: value }, ...types]
    : types;

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
      ) : (
        <select
          className="v50-input" value={value || ""}
          onChange={(e) => {
            if (e.target.value === "__add_new__") { setAdding(true); return; }
            onChange(e.target.value);
          }}
        >
          <option value="">선택 안 함</option>
          {options.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          <option value="__add_new__">+ 새 유형 추가…</option>
        </select>
      )}
    </label>
  );
}
