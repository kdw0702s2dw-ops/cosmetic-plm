"use client";

import { useEffect, useState } from "react";

export type AnchorPos = { left: number; width: number; top?: number; bottom?: number };

// 검색 드롭다운을 입력창 바로 아래(공간이 부족하면 위로 뒤집어서) 고정 배치하기 위한 좌표 계산.
// BOM 편집의 원료명 자동완성에서 쓰던 로직을 그대로 추출한 것 - activeKey/hits가 바뀔 때마다 재계산한다.
export function useAnchorPosition(
  activeKey: string | number | null,
  getElement: () => HTMLElement | null,
  hits: unknown[],
  estimatePerItem = 40,
  estimatePad = 8,
  maxHeight = 240
): AnchorPos | null {
  const [pos, setPos] = useState<AnchorPos | null>(null);

  useEffect(() => {
    if (activeKey == null || hits.length === 0) {
      setPos(null);
      return;
    }
    const el = getElement();
    if (!el) {
      setPos(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const estimatedHeight = Math.min(hits.length * estimatePerItem + estimatePad, maxHeight);
    const spaceBelow = window.innerHeight - r.bottom;
    // 아래쪽 공간이 부족하고 위쪽 공간이 더 넓으면 입력창 위로 뒤집어서 연다
    if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
      setPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
    } else {
      setPos({ left: r.left, width: r.width, top: r.bottom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, hits]);

  return pos;
}
