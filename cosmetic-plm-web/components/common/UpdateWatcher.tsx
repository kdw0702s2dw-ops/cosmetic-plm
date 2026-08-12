"use client";

import { useEffect, useRef, useState } from "react";

// 이 탭이 처음 로드될 때 번들에 박힌 빌드 버전 (next.config.ts의 env.APP_BUILD_VERSION).
// 배포마다 값이 달라지므로, 이 값과 서버(app/api/version)가 지금 돌려주는 값이 다르면
// "내가 연 뒤로 새 배포가 올라왔다"는 뜻이다.
const INITIAL_VERSION = process.env.APP_BUILD_VERSION || "dev";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 주기적으로 확인

// 사이트 전체에 새 배포가 올라오면 "새로고침하세요" 배너를 띄운다. 자동 새로고침은 하지 않는다 -
// 작업 중(BOM 입력 등)에 갑자기 새로고침되면 입력 중이던 내용을 잃을 수 있어서, 사용자가 직접
// 새로고침 시점을 고르게 한다.
export default function UpdateWatcher() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    // 로컬 개발 환경 등 버전 값이 없으면(둘 다 "dev") 비교 자체가 무의미하므로 확인하지 않는다.
    if (!INITIAL_VERSION || INITIAL_VERSION === "dev") return;

    async function checkForUpdate() {
      if (checkingRef.current || hasUpdate) return;
      checkingRef.current = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.version && data.version !== INITIAL_VERSION) {
            setHasUpdate(true);
          }
        }
      } catch {
        // 네트워크 오류는 무시 - 다음 주기에 다시 시도
      } finally {
        checkingRef.current = false;
      }
    }

    const timer = setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    // 다른 탭/앱에 있다가 이 화면으로 돌아왔을 때도 바로 한 번 확인한다 (배포 직후 복귀하는 경우가 많음)
    function onVisible() {
      if (document.visibilityState === "visible") checkForUpdate();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, [hasUpdate]);

  if (!hasUpdate) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 4000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 18px",
        borderRadius: 12,
        background: "#111827",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
        fontSize: 14,
        maxWidth: "min(92vw, 460px)",
      }}
    >
      <span style={{ fontWeight: 800 }}>새 업데이트가 있습니다. 새로고침 해주세요.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          flexShrink: 0,
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontWeight: 800,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        새로고침
      </button>
      <button
        type="button"
        onClick={() => setHasUpdate(false)}
        title="나중에"
        style={{
          flexShrink: 0,
          background: "transparent",
          color: "#9ca3af",
          border: "none",
          fontSize: 16,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}
