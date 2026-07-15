"use client";

import { useEffect } from "react";

export type ToastState = { type: "success" | "error"; text: string } | null;

// 화면 상단에 잠깐 떴다 사라지는 자체 토스트 (shadcn/ui 등 별도 라이브러리 없이 최소 구현)
export default function Toast({ toast, onClose, durationMs = 2500 }: { toast: ToastState; onClose: () => void; durationMs?: number }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [toast, onClose, durationMs]);

  if (!toast) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3000,
        padding: "14px 22px",
        borderRadius: 12,
        fontWeight: 800,
        fontSize: 14,
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        background: toast.type === "success" ? "#16a34a" : "#dc2626",
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "min(90vw, 480px)",
      }}
    >
      <span>{toast.type === "success" ? "✓" : "✕"}</span>
      <span>{toast.text}</span>
    </div>
  );
}
