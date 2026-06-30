"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";

export type ResearcherHomeData = {
  kpis: { rawMaterials: number; formulas: number; documents: number; formulaLines: number; warnings: number; todayTasks: number };
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
  } catch { return 0; }
}

async function safeRows(table: string, builder: (q: any) => any) {
  try {
    const { data, error } = await builder(supabaseProductionFinal.from(table));
    if (error) return [];
    return data || [];
  } catch { return []; }
}

export async function fetchResearcherHomeData(): Promise<ResearcherHomeData> {
  const [rawMaterials, formulas, documents, formulaLines, regulationAlertCount, recentFormulas, recentRawMaterials, recentDocuments, recentRegAlerts] = await Promise.all([
    safeCount("plm_raw_materials", (q) => q.eq("is_active", true)),
    safeCount("plm_formulas", (q) => q.eq("is_active", true)),
    safeCount("plm_documents"),
    safeCount("plm_formula_lines"),
    safeCount("plm_regulatory_alerts", (q) => q.in("status", ["OPEN", "CONFIRMED"])),
    safeRows("plm_formulas", (q) => q.select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(8)),
    safeRows("plm_raw_materials", (q) => q.select("*").eq("is_active", true).order("updated_at", { ascending: false }).limit(8)),
    safeRows("plm_documents", (q) => q.select("*").order("created_at", { ascending: false }).limit(8)),
    safeRows("plm_regulatory_alerts", (q) => q.select("*").in("status", ["OPEN", "CONFIRMED"]).order("created_at", { ascending: false }).limit(8)),
  ]);

  const formulaWarnings = recentFormulas.filter((x: any) => Number(x.total_percent || 0) !== 100);
  const docPendingRows = recentFormulas.filter((x: any) => String(x.status || "").toUpperCase() !== "APPROVED");
  const byRegion: Record<string, number> = {};
  for (const a of recentRegAlerts) byRegion[a.region] = (byRegion[a.region] || 0) + 1;

  return {
    kpis: { rawMaterials, formulas, documents, formulaLines, warnings: regulationAlertCount + formulaWarnings.length, todayTasks: regulationAlertCount + formulaWarnings.length + docPendingRows.length },
    recentFormulas, recentRawMaterials, recentDocuments,
    regulationWatch: [
      { region: "한국", status: byRegion.KR ? `${byRegion.KR}건` : "정상", detail: "한국 기준 규제검증 결과" },
      { region: "EU", status: byRegion.EU ? `${byRegion.EU}건` : "정상", detail: "EU 기준 규제검증 결과" },
      { region: "중국", status: byRegion.CN ? `${byRegion.CN}건` : "정상", detail: "중국 기준 규제검증 결과" },
      { region: "미국", status: byRegion.US ? `${byRegion.US}건` : "정상", detail: "미국 기준 규제검증 결과" },
    ],
    aiRecommendations: [
      { title: "규제검증 실행", desc: "신규 처방은 한국/EU/중국/미국 기준으로 먼저 검증하세요." },
      { title: "전성분 자동 정리", desc: "복합원료 구성성분 기준으로 국문/영문 INCI List를 생성하세요." },
      { title: "원가 점검", desc: "BOM 함량과 원료 단가 기준 예상 원가를 확인하세요." },
      { title: "처방 합계 점검", desc: "100% 미달/초과 처방을 우선 확인하세요." },
    ],
    todayTasks: [
      ...recentRegAlerts.slice(0, 4).map((x: any) => ({ type: `규제 ${x.region}`, title: `${x.formula_name || x.formula_code} 규제 경고 확인`, detail: x.issue || x.warning_level })),
      ...formulaWarnings.slice(0, 3).map((x: any) => ({ type: "처방합계", title: `${x.formula_name || x.formula_code} 총합 확인`, detail: `${x.total_percent || 0}%` })),
      ...docPendingRows.slice(0, 3).map((x: any) => ({ type: "문서", title: `${x.formula_name || x.formula_code} 문서 생성/검토`, detail: x.status || "DRAFT" })),
    ].slice(0, 8),
  };
}
