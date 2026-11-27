"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import { getMyProfile } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

// 화면을 열어둔 채로 관리자가 계정을 비활성화한 경우를 잡기 위한 재검증 주기.
// 재검증은 프로필만 조용히 다시 읽는다 - useSprint1Auth의 load()를 다시 부르면 loading 상태 때문에
// 아래 "로그인 확인 중" 화면으로 바뀌면서 자식 화면이 언마운트되어 작성 중이던 입력이 사라진다.
const RECHECK_INTERVAL_MS = 30 * 60 * 1000;
const FOCUS_RECHECK_MIN_GAP_MS = 5 * 60 * 1000;

function GateMessage({ title, desc, detail, action }: { title: string; desc: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="v50-root">
      <div className="v50-page" style={{ maxWidth: 680, margin: "0 auto", paddingTop: 80 }}>
        <section className="v50-panel">
          <h1 className="v50-title">{title}</h1>
          <p className="v50-desc">{desc}</p>
          {action}
          {detail && <p style={{ color: "#64748b", marginTop: 16 }}>{detail}</p>}
        </section>
      </div>
    </div>
  );
}

function LoadingScreen() {
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

/**
 * 로그인/활성 계정/역할 확인 후 children을 보여준다.
 * pageKey를 넘기면 역할별 메뉴 숨김 설정(plm_role_page_access, /enterprise 사이드바와 같은 키)도 확인해서,
 * 사이드바에서 숨긴 화면을 URL로 직접 여는 것도 막는다. 화면만 가리는 것이고 데이터는 RLS가 막는다.
 */
export default function AuthGate({ children, pageKey }: { children: ReactNode; pageKey?: string }) {
  const auth = useSprint1Auth();
  const [deactivated, setDeactivated] = useState(false);
  const lastCheckRef = useRef(0);
  const isActive = !!auth.profile?.is_active;

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    lastCheckRef.current = Date.now();

    async function recheck() {
      lastCheckRef.current = Date.now();
      try {
        const p = await getMyProfile();
        // 프로필을 실제로 받아왔고 비활성일 때만 막는다. 네트워크 오류 등으로 확인하지 못한 경우는
        // 그대로 둔다(일시적 오류로 작업 중인 화면이 닫히는 사고 방지 - 데이터는 RLS가 막고 있음).
        if (!cancelled && p && !p.is_active) setDeactivated(true);
      } catch {
        /* 확인 실패는 무시 */
      }
    }

    function onReturn() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckRef.current < FOCUS_RECHECK_MIN_GAP_MS) return;
      recheck();
    }

    const timer = setInterval(recheck, RECHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [isActive]);

  if (auth.loading || !auth.sessionReady) return <LoadingScreen />;

  if (auth.unregistered) {
    return (
      <GateMessage
        title="등록되지 않은 계정입니다"
        desc="PLM에 등록되지 않은 계정입니다. 관리자에게 문의하세요."
        action={<a className="v50-button" href="/login">로그인으로 이동</a>}
      />
    );
  }

  if (!auth.isLoggedIn || !auth.canView) {
    return (
      <GateMessage
        title="로그인이 필요합니다"
        desc="Enterprise PLM은 로그인 후 사용할 수 있습니다."
        action={<a className="v50-button" href="/login">로그인으로 이동</a>}
        detail={auth.message}
      />
    );
  }

  if (!isActive || deactivated) {
    return (
      <GateMessage
        title="비활성 계정입니다"
        desc="이 계정은 비활성화되어 사용할 수 없습니다. 관리자에게 문의하세요."
        action={<button className="v50-button" onClick={auth.logout}>로그아웃</button>}
        detail={auth.profile?.email}
      />
    );
  }

  if (pageKey && !auth.isPageVisible(pageKey)) {
    // 숨김 설정을 아직 불러오는 중이면 판단을 보류한다(로딩 중엔 isPageVisible이 false라 바로 막으면 안 됨).
    if (!auth.pageAccessLoaded) return <LoadingScreen />;
    return (
      <GateMessage
        title="접근 권한이 없습니다"
        desc="현재 역할에서는 이 화면을 사용할 수 없습니다."
        action={<a className="v50-button" href="/enterprise">메인 화면으로 이동</a>}
        detail={`${auth.profile?.email || ""} / ${auth.profile?.role || ""}`}
      />
    );
  }

  return <>{children}</>;
}
