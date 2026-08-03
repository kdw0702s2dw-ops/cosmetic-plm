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

export async function fetchUserProfiles() {
  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .select("*")
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateUserProfileRole(id: string, role: PlmRole, isActive: boolean) {
  const { data, error } = await supabaseProductionFinal
    .from("plm_user_profiles")
    .update({
      role,
      is_active: isActive,
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
