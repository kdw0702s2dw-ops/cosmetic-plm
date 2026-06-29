"use client";

import type { ReactNode } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useSprint1Auth();

  if (auth.loading || !auth.sessionReady) {
    return (
      <div className="v50-root">
        <div className="v50-page">
          <section className="v50-hero">
            <div>
              <h1 className="v50-title">로그인 확인 중</h1>
              <p className="v50-desc">사용자 권한을 확인하고 있습니다.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!auth.isLoggedIn || !auth.canView) {
    return (
      <div className="v50-root">
        <div className="v50-page" style={{ maxWidth: 680, margin: "0 auto", paddingTop: 80 }}>
          <section className="v50-panel">
            <h1 className="v50-title">로그인이 필요합니다</h1>
            <p className="v50-desc">Enterprise PLM은 로그인 후 사용할 수 있습니다.</p>
            <a className="v50-button" href="/login">로그인으로 이동</a>
            <p style={{ color: "#64748b", marginTop: 16 }}>{auth.message}</p>
          </section>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
