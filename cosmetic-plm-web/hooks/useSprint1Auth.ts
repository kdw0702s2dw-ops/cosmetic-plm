"use client";

import { useEffect, useState } from "react";
import {
  canManageUsers,
  canView,
  canWriteFormula,
  ensureMyProfile,
  getCurrentSession,
  signOutPlm,
  type PlmUserProfile,
} from "@/services/sprint1/authRbacService";

export function useSprint1Auth() {
  const [profile, setProfile] = useState<PlmUserProfile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [message, setMessage] = useState("인증 확인 중");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        setProfile(null);
        setMessage("로그인이 필요합니다.");
        return;
      }

      const p = await ensureMyProfile();
      setProfile(p);
      setMessage(p?.is_active ? `${p.email || ""} / ${p.role}` : "비활성 계정입니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "인증 확인 오류");
      setProfile(null);
    } finally {
      setSessionReady(true);
      setLoading(false);
    }
  }

  async function logout() {
    await signOutPlm();
    window.location.href = "/login";
  }

  useEffect(() => { load(); }, []);

  return {
    profile,
    sessionReady,
    message,
    loading,
    isLoggedIn: !!profile,
    canView: canView(profile?.role),
    canWriteFormula: canWriteFormula(profile?.role),
    canManageUsers: canManageUsers(profile?.role),
    load,
    logout,
  };
}
