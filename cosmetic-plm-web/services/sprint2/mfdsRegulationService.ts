"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type MfdsStagingRow = {
  id: string;
  source_api: "MFDS_API2" | "MFDS_API3";
  fetched_at: string;
  raw_payload: any;
  region_raw: string;
  region_mapped: string | null;
  ingredient_name_kr: string | null;
  ingredient_name_en: string | null;
  cas_no: string | null;
  match_type: string;
  matched_raw_material_codes: string[];
  regulate_type: string | null;
  allowed_status_suggested: string | null;
  limit_cond_raw: string | null;
  max_percent: number | null;
  review_status: "PENDING" | "APPROVED" | "REJECTED";
  reviewed_by: string | null;
  reviewed_at: string | null;
  promoted_rule_id: string | null;
  created_at: string;
};

// API 키가 서버에만 있어서(NEXT_PUBLIC_ 접두사 없음) MFDS 호출은 반드시 /api/mfds-sync 라우트를 거친다.
// 이 요청은 staging 쓰기 권한(Admin/QA)과 동일하게 서버에서 검증된다.
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

export async function syncMfdsStaging(): Promise<{
  api2Total: number; api3Total: number; api2Matched: number; api3Matched: number; inserted: number; skippedDuplicates: number;
}> {
  return authedFetch("/api/mfds-sync", { method: "POST" });
}

export async function fetchStagingRows(reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "ALL" = "PENDING"): Promise<MfdsStagingRow[]> {
  let q = supabaseProductionFinal
    .from("plm_regulatory_rules_staging")
    .select("*")
    .order("region_mapped", { ascending: true })
    .order("ingredient_name_kr", { ascending: true });
  if (reviewStatus !== "ALL") q = q.eq("review_status", reviewStatus);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as MfdsStagingRow[];
}

// 검토자가 max_percent/allowed_status_suggested를 승인 전에 직접 수정할 때 사용
export async function updateStagingDraft(id: string, patch: { max_percent?: number | null; allowed_status_suggested?: string }) {
  const { error } = await supabaseProductionFinal.from("plm_regulatory_rules_staging").update(patch).eq("id", id);
  if (error) throw error;
}

const REGION_LABEL: Record<string, string> = {
  KR: "한국", EU: "EU", CN: "중국", US: "미국", JP: "일본", ASEAN: "ASEAN", TW: "대만", AR: "아르헨티나", BR: "브라질", CA: "캐나다",
};
const WARNING_LEVEL_BY_STATUS: Record<string, string> = { BANNED: "CRITICAL", LIMITED: "WARNING", REVIEW_REQUIRED: "WARNING" };

function slugForRuleCode(row: MfdsStagingRow): string {
  const casDigits = (row.cas_no || "").replace(/[^0-9]/g, "");
  if (casDigits) return casDigits;
  const base = (row.ingredient_name_en || row.ingredient_name_kr || "unknown")
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || row.id.slice(0, 8);
}

// staging 1건을 승인해서 plm_regulatory_rules로 승격(promote)한다.
// region_mapped가 없는 항목(예: "유럽")은 지역을 확정할 수 없어 승격 대상에서 제외한다.
export async function approveStagingRule(row: MfdsStagingRow, reviewerEmail: string, overrides?: { max_percent?: number | null; allowed_status?: string }): Promise<void> {
  if (!row.region_mapped) throw new Error("지역(region)이 매핑되지 않은 항목은 승인할 수 없습니다. 지역을 먼저 확인하세요.");

  const allowedStatus = overrides?.allowed_status || row.allowed_status_suggested || "REVIEW_REQUIRED";
  const maxPercent = overrides?.max_percent !== undefined ? overrides.max_percent : row.max_percent;
  const regionLabel = REGION_LABEL[row.region_mapped] || row.region_mapped;
  const ruleCode = `MFDS-${row.region_mapped}-${slugForRuleCode(row)}-${row.id.slice(0, 8)}`;

  const { data: inserted, error: insertError } = await supabaseProductionFinal
    .from("plm_regulatory_rules")
    .insert({
      region: row.region_mapped,
      rule_code: ruleCode,
      ingredient_keyword: (row.ingredient_name_en || row.ingredient_name_kr || "").toLowerCase(),
      ingredient_name_kr: row.ingredient_name_kr,
      ingredient_name_en: row.ingredient_name_en,
      max_percent: maxPercent,
      allowed_status: allowedStatus,
      warning_level: WARNING_LEVEL_BY_STATUS[allowedStatus] || "WARNING",
      rule_title: `${regionLabel} ${row.regulate_type === "금지" ? "배합금지" : "사용제한"} 성분`,
      rule_description: (row.limit_cond_raw || "").slice(0, 2000) || null,
      source_note: "mfds_open_api",
      is_active: true,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const { error: updateError } = await supabaseProductionFinal
    .from("plm_regulatory_rules_staging")
    .update({
      review_status: "APPROVED",
      reviewed_by: reviewerEmail,
      reviewed_at: new Date().toISOString(),
      promoted_rule_id: inserted.id,
      max_percent: maxPercent,
      allowed_status_suggested: allowedStatus,
    })
    .eq("id", row.id);
  if (updateError) throw updateError;
}

export async function rejectStagingRule(id: string, reviewerEmail: string): Promise<void> {
  const { error } = await supabaseProductionFinal
    .from("plm_regulatory_rules_staging")
    .update({ review_status: "REJECTED", reviewed_by: reviewerEmail, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
