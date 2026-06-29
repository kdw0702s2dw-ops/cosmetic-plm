"use client";

import { useState } from "react";
import { getAuthDebugInfo, signInPlm } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

export default function LoginPageClient() {
  const [email, setEmail] = useState("kdw0702s2dw@gmail.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("정확한 로그인 오류를 표시하는 진단 버전입니다.");
  const [debug, setDebug] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    setDebug("");

    try {
      await signInPlm(email, password);
      setMessage("로그인 성공. Enterprise로 이동합니다.");
      window.location.href = "/enterprise";
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const lower = raw.toLowerCase();

      if (lower.includes("invalid login credentials")) {
        setMessage("Supabase Auth 실패: 이메일 또는 비밀번호가 다릅니다. Users에서 이 계정의 비밀번호를 Change Password로 다시 지정하세요.");
      } else if (lower.includes("email not confirmed")) {
        setMessage("Supabase Auth 실패: 이메일 인증이 안 되어 있습니다. Confirm Email을 OFF로 하거나 해당 사용자를 Confirm 처리하세요.");
      } else if (lower.includes("failed to fetch") || lower.includes("network")) {
        setMessage("Supabase 연결 실패: 환경변수 NEXT_PUBLIC_SUPABASE_URL / ANON KEY 또는 도메인 연결을 확인하세요.");
      } else {
        setMessage(`로그인 실패 원문: ${raw}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function showDebug() {
    setLoading(true);
    try {
      const info = await getAuthDebugInfo();
      setDebug(JSON.stringify(info, null, 2));
    } catch (error) {
      setDebug(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="v50-root">
      <div className="v50-page" style={{ maxWidth: 680, margin: "0 auto", paddingTop: 60 }}>
        <section className="v50-panel">
          <h1 className="v50-title">화장품 PLM 로그인 진단</h1>
          <p className="v50-desc">이 화면은 실패 원인을 정확히 표시하도록 수정한 버전입니다.</p>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            이메일
            <input className="v50-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label style={{ display: "grid", gap: 6, fontWeight: 800, marginTop: 14 }}>
            비밀번호
            <input className="v50-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") login(); }} />
          </label>

          <div className="v50-flow" style={{ marginTop: 18 }}>
            <button className="v50-button" onClick={login} disabled={loading}>로그인</button>
            <button className="v50-button-light" onClick={showDebug} disabled={loading}>현재 세션 진단</button>
          </div>

          <p style={{ color: "#2563eb", fontWeight: 900, marginTop: 14, lineHeight: 1.7 }}>{message}</p>

          {debug && (
            <pre style={{ background: "#0f172a", color: "white", padding: 14, borderRadius: 12, overflow: "auto", fontSize: 12 }}>
              {debug}
            </pre>
          )}

          <div className="v50-card" style={{ marginTop: 16 }}>
            <strong>가장 쉬운 확정 해결</strong>
            <ol style={{ color: "#64748b", lineHeight: 1.8, paddingLeft: 18 }}>
              <li>Supabase Authentication → Users에서 <b>kdw0702s2dw@gmail.com</b>을 클릭합니다.</li>
              <li>Change Password로 새 비밀번호를 직접 지정합니다.</li>
              <li>SQL Editor에서 로그인 안정화 SQL을 실행합니다.</li>
              <li>이 화면에서 같은 이메일과 새 비밀번호로 로그인합니다.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
