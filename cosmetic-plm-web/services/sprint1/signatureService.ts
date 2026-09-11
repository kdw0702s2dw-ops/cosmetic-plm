"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import { getCurrentUser } from "@/services/sprint1/authRbacService";

// 사용자별 서명 이미지 - 시험성적서/제품 COA 등 공식 문서에서 작성/검토/승인 담당자가 실제로 "확정"
// 버튼을 눌렀을 때만 그 사람의 서명 이미지가 삽입되도록 하기 위한 저장소. plm_user_profiles는 열람
// 정책이 본인/관리자로 제한되어 있어, 서명은 별도 테이블(plm_signatures, 사내 인증 사용자 전체 열람 가능)에 둔다.
const SIGNATURE_BUCKET = "user-signatures";

export async function uploadMySignature(file: File): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/signature_${Date.now()}.${ext}`;

  const { error: upErr } = await supabaseProductionFinal.storage.from(SIGNATURE_BUCKET).upload(path, file, { upsert: true });
  if (upErr) throw new Error(`서명 업로드 실패: ${upErr.message}`);

  const { data } = supabaseProductionFinal.storage.from(SIGNATURE_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  const { error: dbErr } = await supabaseProductionFinal
    .from("plm_signatures")
    .upsert({ user_id: user.id, signature_url: url, updated_at: new Date().toISOString() });
  if (dbErr) throw new Error(`서명 정보 저장 실패: ${dbErr.message}`);

  return url;
}

export async function getMySignatureUrl(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabaseProductionFinal
    .from("plm_signatures")
    .select("signature_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data?.signature_url || null;
}

export async function removeMySignature(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  const { error } = await supabaseProductionFinal.from("plm_signatures").delete().eq("user_id", user.id);
  if (error) throw error;
}

// 결재 확정 시 기록된 담당자 id들의 서명 이미지를 한 번에 조회 - 작성/검토/승인 3명분을 한 번의 쿼리로 가져온다.
export async function fetchSignaturesByUserIds(ids: Array<string | null | undefined>): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(ids.filter((v): v is string => !!v)));
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabaseProductionFinal
    .from("plm_signatures")
    .select("user_id, signature_url")
    .in("user_id", uniqueIds);
  if (error) throw error;

  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    map[row.user_id] = row.signature_url;
  });
  return map;
}
