"use client";

import { useRef } from "react";
import type { useSprint1Auth } from "@/hooks/useSprint1Auth";

type Auth = ReturnType<typeof useSprint1Auth>;

// 사이드바 "내 계정"에 붙는 서명 등록 위젯 - 여기서 등록한 서명 이미지가 시험성적서/제품 COA 등에서
// 본인이 작성/검토/승인을 "확정"했을 때 그 문서에 자동으로 삽입된다.
export default function MySignatureWidget({ auth }: { auth: Auth }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) auth.uploadSignature(file);
    e.target.value = "";
  }

  return (
    <div style={{ padding: "0 12px 10px", borderBottom: "1px solid #1e293b", marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>내 서명 (결재 확정 시 자동 삽입)</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 46, height: 34, borderRadius: 8, background: "#f1f5f9", display: "flex",
          alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
        }}>
          {auth.signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={auth.signatureUrl} alt="내 서명" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 10, color: "#94a3b8" }}>없음</span>
          )}
        </div>
        <button className="v50-button-light" style={{ fontSize: 11, padding: "5px 8px" }} onClick={pickFile} disabled={auth.signatureUploading}>
          {auth.signatureUploading ? "업로드 중…" : auth.signatureUrl ? "서명 변경" : "서명 등록"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
      {auth.signatureMessage && <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 4 }}>{auth.signatureMessage}</div>}
    </div>
  );
}
