"use client";

import type { AnchorPos } from "@/hooks/useAnchorPosition";

// BOM 편집의 원료명 검색 드롭다운(RawDropdown)을 제네릭화한 공용 컴포넌트.
// 항목 렌더링만 호출부에서 넘겨받고, 위치/스타일/hover 처리는 여기서 공통으로 담당한다.
export default function SearchDropdown<T>({
  hits, onPick, pos, renderItem, keyExtractor,
}: {
  hits: T[];
  onPick: (item: T) => void;
  pos: AnchorPos;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}) {
  return (
    <div style={{
      position: "fixed", zIndex: 1000, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom,
      background: "white", border: "1px solid #cbd5e1", borderRadius: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflow: "auto", textAlign: "left",
    }}>
      {hits.map((item) => (
        <div key={keyExtractor(item)} onClick={() => onPick(item)}
          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
