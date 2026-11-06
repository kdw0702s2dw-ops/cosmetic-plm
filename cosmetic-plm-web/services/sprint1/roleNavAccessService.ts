"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { PlmRole } from "@/services/sprint1/authRbacService";

// EnterpriseSprint1Workspace.tsx의 사이드바/상단 탭에 대응하는 키 - 역할별로 보임/숨김을 설정할 수 있는
// "페이지" 목록. "users"(사용자 권한관리)는 포함하지 않는다 - 그 메뉴는 canManageUsers(Admin 전용)로
// 이미 따로 막혀있고, Admin은 이 매트릭스 대상에서 제외되므로 여기 넣어도 설정할 주체가 없다.
export const ROLE_NAV_PAGE_KEYS = [
  "home",
  "unifiedBom",
  "companyManager",
  "materialManager",
  "ingredientDict",
  "rawManager",
  "purchaseOrder",
  "formula",
  "docs",
  "quality",
  "production",
  "productionRecords",
  "regulation",
  "externalRegCheck",
  "sprint0",
] as const;

export type RoleNavPageKey = (typeof ROLE_NAV_PAGE_KEYS)[number];

export const ROLE_NAV_PAGE_LABELS: Record<RoleNavPageKey, string> = {
  home: "연구원 홈",
  unifiedBom: "통합 BOM",
  companyManager: "업체관리",
  materialManager: "부자재관리",
  ingredientDict: "전성분관리",
  rawManager: "원료 관리",
  purchaseOrder: "원료 발주관리",
  formula: "처방관리",
  docs: "문서관리",
  quality: "품질관리",
  production: "생산관리",
  productionRecords: "생산실적 관리",
  regulation: "글로벌 규제검증",
  externalRegCheck: "성분 규제체크(외부)",
  sprint0: "기반 안정화 점검",
};

// 이 매트릭스로 설정 가능한 역할 - Admin은 항상 전체 메뉴를 보도록 의도적으로 제외한다(관리자 본인이
// 사용자 권한관리 메뉴를 실수로 잠그는 사고 방지, DB에도 plm_role_page_access의 role CHECK로 동일하게 막아둠).
export const ROLE_NAV_CONFIGURABLE_ROLES: Exclude<PlmRole, "Admin">[] = ["Researcher", "QA", "Viewer", "Production"];

// role -> 숨겨진 page_key Set. 행이 존재하면 숨김, 없으면(기본값) 보임.
export async function fetchHiddenPagesByRole(): Promise<Record<string, Set<string>>> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_role_page_access")
    .select("role, page_key");
  if (error) throw error;

  const map: Record<string, Set<string>> = {};
  for (const row of data || []) {
    if (!map[row.role]) map[row.role] = new Set();
    map[row.role].add(row.page_key);
  }
  return map;
}

// 특정 role의 숨겨진 page_key만 필요할 때(useSprint1Auth에서 로그인한 본인 role만 조회) - 전체를 읽어오지
// 않고 바로 그 role로 필터링해서 가볍게 가져온다.
export async function fetchHiddenPagesForRole(role: string): Promise<Set<string>> {
  const { data, error } = await supabaseProductionFinal
    .from("plm_role_page_access")
    .select("page_key")
    .eq("role", role);
  if (error) throw error;
  return new Set((data || []).map((r) => r.page_key));
}

// 체크박스 토글 1건 반영 - hidden=true면 행을 추가(숨김), false면 행을 삭제(보임으로 되돌림).
export async function setPageHidden(role: string, pageKey: string, hidden: boolean): Promise<void> {
  if (hidden) {
    const { error } = await supabaseProductionFinal
      .from("plm_role_page_access")
      .upsert({ role, page_key: pageKey }, { onConflict: "role,page_key" });
    if (error) throw error;
  } else {
    const { error } = await supabaseProductionFinal
      .from("plm_role_page_access")
      .delete()
      .eq("role", role)
      .eq("page_key", pageKey);
    if (error) throw error;
  }
}
