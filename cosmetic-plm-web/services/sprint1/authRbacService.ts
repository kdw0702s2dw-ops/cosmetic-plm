"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type PlmRole = "Admin" | "Researcher" | "QA" | "Viewer" | "Production";

export type PlmUserProfile = {
  id: string;
  email?: string;
  display_name?: string;
  role: PlmRole;
  is_active: boolean;
};

function normalizeAuthError(error: any) {
  const raw = [
    error?.message,
    error?.name,
    error?.status,
    error?.code,
    error?.__isAuthError ? "AuthError" : "",
  ].filter(Boolean).join(" / ");

  if (!raw) return "알 수 없는 로그인 오류";
  return raw;
}

export async function signInPlm(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseProductionFinal.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error(normalizeAuthError(error));
  }

  const profile = await ensureMyProfile();
  if (!profile?.is_active) {
    await supabaseProductionFinal.auth.signOut();
    throw new Error("비활성 계정입니다. 관리자에게 문의하세요.");
  }

  return { user: data.user, profile };
}

export async function signOutPlm() {
  const { error } = await supabaseProductionFinal.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabaseProductionFinal.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabaseProductionFinal.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export async function getMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data as PlmUserProfile | null;
}

export async function ensureMyProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await getMyProfile();
  if (existing) return existing;

  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .insert({
      id: user.id,
      email: user.email,
      display_name: user.email?.split("@")[0] || "User",
      role: "Researcher",
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PlmUserProfile;
}

export const getOrCreateMyProfile = ensureMyProfile;

export function canWriteFormula(role?: string | null) {
  return role === "Admin" || role === "Researcher";
}

export function canManageUsers(role?: string | null) {
  return role === "Admin";
}

export function canView(role?: string | null) {
  return role === "Admin" || role === "Researcher" || role === "QA" || role === "Viewer" || role === "Production";
}

export function canExportData(role?: string | null) {
  return role === "Admin" || role === "Researcher" || role === "QA";
}

// 부자재관리/원료관리: Production 역할은 열람만 가능하고 생성/수정/삭제는 불가 (plm_materials, plm_raw_materials RLS와 동일한 기준)
export function canWriteMaterials(role?: string | null) {
  return role === "Admin" || role === "Researcher";
}

// Production 역할 전용: 사이드바에서 부자재관리/원료관리/생산관리만 노출
export function isProductionRole(role?: string | null) {
  return role === "Production";
}

// 생산관리(생산일정관리/출고관리 등): Production 역할도 읽기/쓰기 모두 가능해야 하므로 QA/Viewer는
// 제외하고 Admin/Researcher/Production만 (plm_production_records, plm_shipment_records RLS와 동일한 기준)
export function canWriteProduction(role?: string | null) {
  return role === "Admin" || role === "Researcher" || role === "Production";
}

// 품질관리(안정성시험): QA도 시험 등록/결과 입력이 가능해야 하므로 Admin/Researcher 외에 QA도 포함
// (canWriteFormula/canWriteMaterials와 달리 QA를 포함하는 별도 함수 - plm_stability_* 테이블 RLS와 동일한 기준)
export function canWriteQuality(role?: string | null) {
  return role === "Admin" || role === "Researcher" || role === "QA";
}

export async function fetchUserProfiles() {
  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .select("*")
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

// displayName을 넘기면(사용자 권한관리 화면에서 이름도 함께 수정) 같이 저장하고, 생략하면
// 기존처럼 역할/활성 상태만 바꾼다 - 호출부를 늘리지 않고 한 번의 저장으로 처리하기 위함.
export async function updateUserProfileRole(id: string, role: PlmRole, isActive: boolean, displayName?: string) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .update({
      role,
      is_active: isActive,
      ...(displayName !== undefined ? { display_name: displayName.trim() || null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function authedFetch(input: string, init: RequestInit) {
  const { data } = await supabaseProductionFinal.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("로그인이 필요합니다.");

  const res = await fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), "content-type": "application/json", authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `요청 실패 (${res.status})`);
  return body;
}

export async function createUserAccount(input: { email: string; password: string; role: PlmRole; display_name?: string }) {
  const body = await authedFetch("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
  return body.user as PlmUserProfile;
}

export async function deleteUserAccount(id: string) {
  await authedFetch("/api/admin/users", { method: "DELETE", body: JSON.stringify({ id }) });
}

// 사용자 권한관리 화면의 "마지막 로그인" 표시용 - Supabase Auth의 실제 로그인 이력(last_sign_in_at)을 id 기준으로 조회
export async function fetchLastSignIns(): Promise<Record<string, string | null>> {
  const body = await authedFetch("/api/admin/users", { method: "GET" });
  return body.lastSignIns || {};
}

// "마지막 로그인"(last_sign_in_at)은 비밀번호를 다시 입력해 로그인한 시각이라, 세션이 브라우저에 계속
// 유지/자동갱신되는 이 앱 특성상 매일 실제로 쓰고 있어도 오래전 값으로 멈춰있을 수 있다. 그래서 화면
// 진입 시마다(과도한 쓰기 방지를 위해 useSprint1Auth에서 호출 빈도를 제한) plm_user_profiles.last_active_at을
// 직접 갱신해서 "진짜 마지막 활동 시각"을 별도로 기록한다. 실패해도 화면 사용 자체엔 지장 없어야 하므로
// 호출부에서 에러를 무시할 수 있도록 그대로 던진다.
export async function touchLastActive() {
  const { error } = await supabaseProductionFinal.rpc("plm_touch_last_active");
  if (error) throw error;
}

export async function getAuthDebugInfo() {
  const session = await getCurrentSession();
  const user = await getCurrentUser();
  const profile = user ? await getMyProfile().catch((e) => ({ error: e?.message || String(e) })) : null;

  return {
    hasSession: !!session,
    userEmail: user?.email || null,
    userId: user?.id || null,
    profile,
  };
}
