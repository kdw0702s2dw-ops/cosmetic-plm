"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchMaterialsAutocomplete, type Material } from "@/services/sprint2/materialService";

// 부자재코드 입력란 - 타이핑 중 자동완성 드롭다운(코드/명/10x10cm 중량)을 보여주고,
// 항목을 선택하면 onPick으로 부자재 전체 정보를 넘긴다. 단순 타이핑은 onChange만 호출한다.
export default function MaterialCodeAutocompleteInput({
  value, onChange, onPick, placeholder = "부자재코드",
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (material: Material) => void;
  placeholder?: string;
}) {
  const [hits, setHits] = useState<Material[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number; top: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ left: r.left, width: Math.max(r.width, 260), top: r.bottom + 4 });
    }
  }, [open, hits]);

  function handleChange(v: string) {
    onChange(v);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    if (!v.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        setHits(await searchMaterialsAutocomplete(v.trim()));
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function pick(m: Material) {
    onPick(m);
    setHits([]);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        ref={inputRef} className="v50-input" placeholder={placeholder} value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => value.trim() && setOpen(true)}
      />
      {open && loading && <span style={{ fontSize: 11, color: "#94a3b8" }}>검색 중…</span>}
      {open && hits.length > 0 && pos &&
        createPortal(
          <div
            style={{
              position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top,
              background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflow: "auto",
            }}
          >
            {hits.map((m) => (
              <div
                key={m.material_code} onClick={() => pick(m)}
                style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                <b>{m.material_code}</b> {m.material_name}
                {m.weight_10x10cm != null && <span style={{ color: "#16a34a", marginLeft: 8 }}>{m.weight_10x10cm}g</span>}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
