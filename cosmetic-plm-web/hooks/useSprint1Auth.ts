"use client";

import { useEffect, useState } from "react";
import {
  canExportData,
  canManageUsers,
  canView,
  canWriteFormula,
  canWriteMaterials,
  canWriteQuality,
  canWriteProduction,
  isProductionRole,
  ensureMyProfile,
  getCurrentSession,
  signOutPlm,
  touchLastActive,
  type PlmUserProfile,
} from "@/services/sprint1/authRbacService";
import { getMySignatureUrl, uploadMySignature } from "@/services/sprint1/signatureService";

export function useSprint1Auth() {
  const [profile, setProfile] = useState<PlmUserProfile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [message, setMessage] = useState("인증 확인 중");
  const [loading, setLoading] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState("");

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
      if (p) {
        getMySignatureUrl().then(setSignatureUrl).catch(() => {});
        // "마지막 로그인"(last_sign_in_at)만으로는 실제 사용 여부를 알 수 없어서(세션이 계속 유지되는
        // 구조라 재로그인 없이 몇 주씩 접속 상태 유지 가능) 화면 진입 시 "마지막 활동" 시각을 갱신한다.
        // 실패해도 화면 사용 자체엔 지장 없는 부가 정보라 조용히 무시한다.
        touchLastActive().catch(() => {});
      }
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

  async function uploadSignature(file: File) {
    setSignatureUploading(true);
    setSignatureMessage("");
    try {
      const url = await uploadMySignature(file);
      setSignatureUrl(url);
      setSignatureMessage("서명이 저장되었습니다.");
    } catch (e) {
      setSignatureMessage(e instanceof Error ? e.message : "서명 업로드 오류");
    } finally {
      setSignatureUploading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // 탭을 새로고침하지 않고 하루 종일 켜둔 채로 작업하는 경우에도 "마지막 활동"이 최초 진입 시각에서
  // 멈춰있지 않도록, 로그인 상태인 동안 30분 간격으로 한 번씩 더 갱신한다(너무 잦은 쓰기 방지).
  useEffect(() => {
    if (!profile?.is_active) return;
    const id = setInterval(() => { touchLastActive().catch(() => {}); }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [profile?.is_active]);

  return {
    profile,
    sessionReady,
    message,
    loading,
    isLoggedIn: !!profile,
    canView: canView(profile?.role),
    canWriteFormula: canWriteFormula(profile?.role),
    canManageUsers: canManageUsers(profile?.role),
    canExportData: canExportData(profile?.role),
    canWriteMaterials: canWriteMaterials(profile?.role),
    canWriteQuality: canWriteQuality(profile?.role),
    canWriteProduction: canWriteProduction(profile?.role),
    isProductionRole: isProductionRole(profile?.role),
    load,
    logout,
    signatureUrl,
    signatureUploading,
    signatureMessage,
    uploadSignature,
  };
}
