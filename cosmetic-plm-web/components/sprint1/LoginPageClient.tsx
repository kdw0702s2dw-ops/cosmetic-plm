"use client";

import { useState } from "react";
import { signInPlm } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

export default function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("관리자가 생성한 계정으로 로그인하세요.");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      await signInPlm(email, password);
      setMessage("로그인 성공. Enterprise로 이동합니다.");
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
          <p className="v50-desc">외부 접근을 차단하고, 관리자/연구원 권한에 따라 기능을 제한합니다.</p>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            이메일
            <input className="v50-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@company.com" />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            비밀번호
            <input className="v50-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") login(); }} />
          </label>

          <button className="v50-button" onClick={login} disabled={loading} style={{ width: "100%", marginTop: 18 }}>
            로그인
          </button>

          <p style={{ color: "#2563eb", fontWeight: 900, marginTop: 14 }}>{message}</p>

          <div className="v50-card" style={{ marginTop: 16 }}>
            <strong>계정 생성 방법</strong>
            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              Supabase → Authentication → Users에서 관리자 계정을 먼저 생성하세요.
              최초 로그인 계정은 자동으로 Researcher가 됩니다. SQL에서 관리자 승격을 1회 실행하면 Admin으로 변경됩니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
