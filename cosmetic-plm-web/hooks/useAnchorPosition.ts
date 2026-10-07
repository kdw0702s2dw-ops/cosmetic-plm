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
    function recompute() {
      const r = el!.getBoundingClientRect();
      const estimatedHeight = Math.min(hits.length * estimatePerItem + estimatePad, maxHeight);
      const spaceBelow = window.innerHeight - r.bottom;
      // 아래쪽 공간이 부족하고 위쪽 공간이 더 넓으면 입력창 위로 뒤집어서 연다
      if (spaceBelow < estimatedHeight && r.top > spaceBelow) {
        setPos({ left: r.left, width: r.width, bottom: window.innerHeight - r.top });
      } else {
        setPos({ left: r.left, width: r.width, top: r.bottom });
      }
    }
    recompute();
    // getBoundingClientRect는 뷰포트 기준 좌표라 여는 시점에 한 번만 계산하면, position:fixed로 띄운
    // 드롭다운이 스크롤 시 입력창을 따라가지 못하고 처음 열었던 화면 위치에 그대로 떠 있게 된다(버그
    // 리포트: "스크롤하면 화면이 따라다닌다"). 스크롤/리사이즈마다 다시 계산해서 입력창을 추적한다.
    // 캡처 단계로 등록해서 중첩된 스크롤 컨테이너 내부 스크롤도 함께 잡는다.
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, hits]);

  return pos;
}
