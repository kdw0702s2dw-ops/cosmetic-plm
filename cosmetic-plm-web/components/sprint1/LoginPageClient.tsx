"use client";

import { useState } from "react";
import { signInPlm } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

export default function LoginPageClient() {
  const [email, setEmail] = useState("kdw0702sdw@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("기존 Supabase 계정으로 로그인하세요. 새로 초대하지 마세요.");
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
      const msg = error instanceof Error ? error.message : "로그인 실패";
      if (msg.toLowerCase().includes("invalid login credentials")) {
        setMessage("로그인 실패: 이메일 또는 비밀번호가 다릅니다. Supabase Users에서 해당 계정의 비밀번호를 Change/Reset 해주세요.");
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        setMessage("로그인 실패: 이메일 인증이 필요합니다. Authentication → Providers → Email에서 Confirm Email을 OFF로 변경하거나 사용자를 Confirm 처리하세요.");
      } else {
        setMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="v50-root">
      <div className="v50-page" style={{ maxWidth: 560, margin: "0 auto", paddingTop: 80 }}>
        <section className="v50-panel">
          <h1 className="v50-title">화장품 PLM 로그인</h1>
          <p className="v50-desc">이미 등록된 Supabase 계정으로 로그인합니다.</p>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            이메일
            <input className="v50-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            비밀번호
            <input className="v50-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") login(); }} />
          </label>

          <button className="v50-button" onClick={login} disabled={loading} style={{ width: "100%", marginTop: 18 }}>로그인</button>

          <p style={{ color: "#2563eb", fontWeight: 900, marginTop: 14, lineHeight: 1.6 }}>{message}</p>

          <div className="v50-card" style={{ marginTop: 16 }}>
            <strong>쉬운 해결 순서</strong>
            <ol style={{ color: "#64748b", lineHeight: 1.7, paddingLeft: 18 }}>
              <li>Supabase Authentication → Users에서 기존 계정을 선택합니다.</li>
              <li>비밀번호를 Change/Reset 합니다.</li>
              <li>SQL Editor에서 emergency SQL을 실행해 Admin 권한을 부여합니다.</li>
              <li>이 화면에서 로그인합니다.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
