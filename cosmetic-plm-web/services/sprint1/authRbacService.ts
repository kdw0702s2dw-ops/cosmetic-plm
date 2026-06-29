"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type PlmRole = "Admin" | "Researcher" | "QA" | "Viewer";

export type PlmUserProfile = {
  id: string;
  email?: string;
  display_name?: string;
  role: PlmRole;
  is_active: boolean;
};

export async function signInPlm(email: string, password: string) {
  const { data, error } = await supabaseProductionFinal.auth.signInWithPassword({ email, password });
  if (error) throw error;
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

export function canWriteFormula(role?: string | null) {
  return role === "Admin" || role === "Researcher";
}

export function canManageUsers(role?: string | null) {
  return role === "Admin";
}

export function canView(role?: string | null) {
  return role === "Admin" || role === "Researcher" || role === "QA" || role === "Viewer";
}
