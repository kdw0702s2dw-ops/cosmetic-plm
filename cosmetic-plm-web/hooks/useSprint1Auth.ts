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
  canDeleteShipmentRecords,
  isProductionRole,
  ensureMyProfile,
  getCurrentSession,
  signOutPlm,
  touchLastActive,
  type PlmUserProfile,
} from "@/services/sprint1/authRbacService";
import { getMySignatureUrl, uploadMySignature } from "@/services/sprint1/signatureService";
import { fetchHiddenPagesForRole } from "@/services/sprint1/roleNavAccessService";

export function useSprint1Auth() {
  const [profile, setProfile] = useState<PlmUserProfile | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [message, setMessage] = useState("인증 확인 중");
  const [loading, setLoading] = useState(true);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState("");
  // 역할별 메뉴 숨김 설정(plm_role_page_access) - null이면 "아직 안 불러옴"이라는 뜻이다. 프로필은
  // 동기적으로 먼저 확정되는데 이 설정은 별도 DB 조회라 한 박자 늦게 도착하므로, 그 사이에 Admin이
  // 아닌 역할에게 전체 메뉴가 잠깐 보였다가 사라지는 깜빡임이 생길 수 있다 - null 구분으로 그 틈에는
  // isPageVisible()이 false를 반환하게 해서(로딩 중엔 안전하게 숨김) 막는다.
  const [hiddenPages, setHiddenPages] = useState<Set<string> | null>(null);

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
        // 성공/실패 어느 쪽이든 null에서 벗어나야(=pageAccessLoaded) 한다 - 실패 시에는 "모름"을
        // 영원히 유지해서 메뉴를 계속 숨기는 대신(사소한 네트워크 오류로 화면 전체가 막히는 사고 방지),
        // 빈 Set(=전부 보임)으로 안전하게 폴백한다. 이 기능은 화면 노출만 바꿀 뿐 실제 쓰기/삭제 권한은
        // RLS가 별도로 막고 있어서, "불러오기 실패 시 전부 보임"이 보안 문제가 되지는 않는다.
        fetchHiddenPagesForRole(p.role).then(setHiddenPages).catch(() => setHiddenPages(new Set()));
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
    canDeleteShipmentRecords: canDeleteShipmentRecords(profile?.role),
    isProductionRole: isProductionRole(profile?.role),
    // Admin은 항상 전체 메뉴 - 역할별 메뉴 숨김 매트릭스 대상에서 의도적으로 제외됨(관리자가 사용자
    // 권한관리 메뉴 접근 자체를 실수로 잠그는 사고 방지, DB plm_role_page_access도 Admin 행을 거부).
    // hiddenPages가 아직 null(로딩 중)이면 Admin이 아닌 한 false(숨김)를 반환 - 전체 메뉴가 잠깐
    // 보였다가 사라지는 깜빡임을 막기 위함(아래 pageAccessLoaded와 함께 호출부에서 리다이렉트도
    // 로딩 중엔 보류해야 함 - 안 그러면 모든 역할이 순간적으로 부자재관리로 이동해버린다).
    isPageVisible: (pageKey: string) => profile?.role === "Admin" || (hiddenPages !== null && !hiddenPages.has(pageKey)),
    pageAccessLoaded: hiddenPages !== null,
    load,
    logout,
    signatureUrl,
    signatureUploading,
    signatureMessage,
    uploadSignature,
  };
}
