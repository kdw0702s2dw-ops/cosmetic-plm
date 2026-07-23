"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchMaterialsWithWeight10x10, type Material } from "@/services/sprint2/materialService";

// 불용성/수용성 HG의 "10x10cm A4(종이) 중량" 입력란 옆에 붙는 부자재 검색 버튼.
// weight_10x10cm이 등록된 부자재만 검색 결과에 노출하고, 선택 시 onPick으로 값을 넘긴다.
export default function MaterialWeightSearchButton({ onPick }: { onPick: (material: Material) => void }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [hits, setHits] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number; top: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function search(k: string) {
    setLoading(true);
    try {
      setHits(await searchMaterialsWithWeight10x10(k));
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setKeyword("");
    search("");
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setPos({ left: r.left, width: Math.max(r.width, 280), top: r.bottom + 4 });
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onKeywordChange(v: string) {
    setKeyword(v);
    search(v);
  }

  function pick(m: Material) {
    onPick(m);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className="v50-button-light" onClick={() => setOpen((v) => !v)}>
        부자재 검색
      </button>
      {open && pos &&
        createPortal(
          <div
            style={{
              position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top,
              background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 8,
            }}
          >
            <input
              ref={inputRef} className="v50-input" placeholder="부자재코드/명 검색"
              value={keyword} onChange={(e) => onKeywordChange(e.target.value)}
            />
            <div style={{ maxHeight: 240, overflow: "auto", marginTop: 6 }}>
              {loading && <div style={{ padding: 8, fontSize: 12, color: "#94a3b8" }}>검색 중…</div>}
              {!loading &&
                hits.map((m) => (
                  <div
                    key={m.material_code} onClick={() => pick(m)}
                    style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    <b>{m.material_code}</b> {m.material_name}
                    <span style={{ color: "#16a34a", marginLeft: 8 }}>{m.weight_10x10cm}g</span>
                  </div>
                ))}
              {!loading && hits.length === 0 && (
                <div style={{ padding: 8, fontSize: 12, color: "#94a3b8" }}>10x10cm 중량이 등록된 부자재가 없습니다.</div>
              )}
            </div>
            <button type="button" className="v50-button-light" style={{ marginTop: 6, width: "100%" }} onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
