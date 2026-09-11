"use client";

import { useEffect, useState } from "react";
import {
  canExportData,
  canManageUsers,
  canView,
  canWriteFormula,
  canWriteMaterials,
  canWriteQuality,
  isProductionRole,
  ensureMyProfile,
  getCurrentSession,
  signOutPlm,
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
    isProductionRole: isProductionRole(profile?.role),
    load,
    logout,
    signatureUrl,
    signatureUploading,
    signatureMessage,
    uploadSignature,
  };
}
