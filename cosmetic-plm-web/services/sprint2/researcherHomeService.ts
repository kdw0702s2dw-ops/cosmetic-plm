"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type ResearcherHomeData = {
  kpis: {
    rawMaterials: number;
    formulas: number;
    documents: number;
    formulaLines: number;
    warnings: number;
    todayTasks: number;
  };
  recentFormulas: any[];
  recentRawMaterials: any[];
  recentDocuments: any[];
  regulationWatch: any[];
  aiRecommendations: any[];
  todayTasks: any[];
};

async function safeCount(table: string, filter?: (q: any) => any) {
  try {
    let q = supabaseProductionFinal.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

async function safeRows(table: string, builder: (q: any) => any) {
  try {
    const { data, error } = await builder(supabaseProductionFinal.from(table));
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchResearcherHomeData(): Promise<ResearcherHomeData> {
  const [
    rawMaterials,
    formulas,
    documents,
    formulaLines,
    recentFormulas,
    recentRawMaterials,
    recentDocuments,
  ] = await Promise.all([
    safeCount("plm_raw_materials", (q) => q.eq("is_active", true)),
    safeCount("plm_formulas", (q) => q.eq("is_active", true)),
    safeCount("plm_documents"),
    safeCount("plm_formula_lines"),
    safeRows("plm_formulas", (q) =>
      q.select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(8)
    ),
    safeRows("plm_raw_materials", (q) =>
      q.select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(8)
    ),
    safeRows("plm_documents", (q) =>
      q.select("*").order("created_at", { ascending: false }).limit(8)
    ),
  ]);

  const warningRows = recentFormulas.filter((x: any) => Number(x.total_percent || 0) !== 100);
  const docPendingRows = recentFormulas.filter((x: any) => String(x.status || "").toUpperCase() !== "APPROVED");

  return {
    kpis: {
      rawMaterials,
      formulas,
      documents,
      formulaLines,
      warnings: warningRows.length,
      todayTasks: warningRows.length + docPendingRows.length,
    },
    recentFormulas,
    recentRawMaterials,
    recentDocuments,
    regulationWatch: [
      { region: "한국", status: "확인 필요", detail: "처방 전성분/기능 정보 기준 검토" },
      { region: "EU", status: "대기", detail: "제한성분 DB 연결 예정" },
      { region: "중국", status: "대기", detail: "신원료/사용제한 검토 예정" },
      { region: "미국", status: "대기", detail: "MoCRA/라벨링 검토 예정" },
    ],
    aiRecommendations: [
      { title: "전성분 자동 정리", desc: "복합원료 구성성분을 기준으로 국문/영문 INCI List 생성" },
      { title: "원가 점검", desc: "BOM 함량과 원료 단가 기준 예상 원가 확인" },
      { title: "처방 합계 점검", desc: "100% 미달/초과 처방을 우선 확인" },
      { title: "문서 생성", desc: "Formula Sheet, 전성분표, 복합성분표, 단일성분표 생성" },
    ],
    todayTasks: [
      ...warningRows.slice(0, 4).map((x: any) => ({
        type: "처방합계",
        title: `${x.formula_name || x.formula_code} 총합 확인`,
        detail: `${x.total_percent || 0}%`,
      })),
      ...docPendingRows.slice(0, 4).map((x: any) => ({
        type: "문서",
        title: `${x.formula_name || x.formula_code} 문서 생성/검토`,
        detail: x.status || "DRAFT",
      })),
    ].slice(0, 8),
  };
}
