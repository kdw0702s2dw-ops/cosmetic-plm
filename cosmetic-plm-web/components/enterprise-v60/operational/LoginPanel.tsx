"use client";

import { useState } from "react";
import { signInOperational } from "@/services/enterprise-v60/operationalCoreService";
import "@/styles/enterprise-v50.css";

export default function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("관리자가 생성한 계정으로 로그인하세요.");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    try {
      await signInOperational(email, password);
      setMessage("로그인 성공. Workspace로 이동합니다.");
      window.location.href = "/enterprise";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="v50-root">
      <div className="v50-page" style={{ maxWidth: 520, margin: "0 auto", paddingTop: 80 }}>
        <section className="v50-panel">
          <h1 className="v50-title">화장품 PLM 로그인</h1>
          <p className="v50-desc">외부 접근을 제한하기 위해 로그인 후 사용합니다.</p>
          <label>이메일<input className="v50-input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>비밀번호<input className="v50-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="v50-button" onClick={login} disabled={loading} style={{ width: "100%", marginTop: 14 }}>로그인</button>
          <p style={{ color: "#2563eb", fontWeight: 900 }}>{message}</p>
          <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: 13 }}>계정 생성은 Supabase Authentication → Users에서 관리자만 진행하세요.</p>
        </section>
      </div>
    </div>
  );
}
