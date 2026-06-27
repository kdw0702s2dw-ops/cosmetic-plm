"use client";

import { supabaseRelease } from "@/lib/supabaseReleaseClient";
import type { GoldReleaseCandidate, GoldReleaseChecklist, GoldReleaseKpi, ReleaseStatus } from "@/types/goldRelease";

export async function fetchGoldReleaseKpi(): Promise<GoldReleaseKpi> {
  const [
    formulaAll,
    approvedFormulas,
    lockedFormulas,
    documentsAll,
    approvedDocuments,
    aiRuns,
    openActions,
    scores,
  ] = await Promise.all([
    supabaseRelease.from("gold_formula_headers").select("*", { count: "exact", head: true }),
    supabaseRelease.from("gold_formula_headers").select("*", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabaseRelease.from("gold_formula_headers").select("*", { count: "exact", head: true }).eq("status", "LOCKED"),
    supabaseRelease.from("gold_documents").select("*", { count: "exact", head: true }),
    supabaseRelease.from("gold_documents").select("*", { count: "exact", head: true }).in("status", ["APPROVED", "LOCKED"]),
    supabaseRelease.from("gold_ai_copilot_runs").select("*", { count: "exact", head: true }),
    supabaseRelease.from("gold_ai_copilot_actions").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
    supabaseRelease.from("gold_formula_scores").select("overall_score"),
  ]);

  for (const res of [formulaAll, approvedFormulas, lockedFormulas, documentsAll, approvedDocuments, aiRuns, openActions, scores]) {
    if (res.error) throw res.error;
  }

  const scoreRows = scores.data || [];
  const avgScore = scoreRows.length > 0
    ? Math.round(scoreRows.reduce((sum: number, item: any) => sum + Number(item.overall_score || 0), 0) / scoreRows.length)
    : 0;

  return {
    total_formulas: formulaAll.count || 0,
    approved_formulas: approvedFormulas.count || 0,
    locked_formulas: lockedFormulas.count || 0,
    generated_documents: documentsAll.count || 0,
    approved_documents: approvedDocuments.count || 0,
    ai_runs: aiRuns.count || 0,
    open_ai_actions: openActions.count || 0,
    avg_score: avgScore,
  };
}

export async function fetchGoldReleaseCandidates(): Promise<GoldReleaseCandidate[]> {
  const { data: formulas, error } = await supabaseRelease
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);

  if (error) throw error;

  const candidates: GoldReleaseCandidate[] = [];

  for (const f of formulas || []) {
    const [score, docs, approvedDocs, openActions] = await Promise.all([
      supabaseRelease.from("gold_formula_scores").select("*").eq("formula_code", f.formula_code).eq("revision", f.revision).maybeSingle(),
      supabaseRelease.from("gold_documents").select("*", { count: "exact", head: true }).eq("formula_code", f.formula_code).eq("revision", f.revision),
      supabaseRelease.from("gold_documents").select("*", { count: "exact", head: true }).eq("formula_code", f.formula_code).eq("revision", f.revision).in("status", ["APPROVED", "LOCKED"]),
      supabaseRelease.from("gold_ai_copilot_actions").select("*", { count: "exact", head: true }).eq("formula_code", f.formula_code).eq("revision", f.revision).eq("status", "OPEN"),
    ]);

    if (score.error) throw score.error;
    if (docs.error) throw docs.error;
    if (approvedDocs.error) throw approvedDocs.error;
    if (openActions.error) throw openActions.error;

    const overall = score.data?.overall_score ?? null;
    const open = openActions.count || 0;
    const approvedDocCount = approvedDocs.count || 0;

    let releaseStatus: ReleaseStatus = "WATCH";
    if (open > 0) releaseStatus = "BLOCK";
    else if (overall === null) releaseStatus = "WATCH";

    if (open === 0 && overall !== null && Number(overall) >= 90 && approvedDocCount >= 3) {
      releaseStatus = "READY";
    }
    if (f.status === "LOCKED" && releaseStatus === "READY") {
      releaseStatus = "RELEASED";
    }

    candidates.push({
      formula_code: f.formula_code,
      revision: f.revision,
      formula_name: f.formula_name,
      formula_status: f.status,
      overall_score: overall,
      score_status: score.data?.status || null,
      document_count: docs.count || 0,
      approved_document_count: approvedDocCount,
      open_ai_actions: open,
      release_status: releaseStatus,
    });
  }

  return candidates;
}

export async function buildReleaseChecklist(candidate: GoldReleaseCandidate): Promise<GoldReleaseChecklist[]> {
  const items: GoldReleaseChecklist[] = [
    {
      formula_code: candidate.formula_code,
      revision: candidate.revision,
      checklist_item: "처방 상태 확인",
      area: "Formula",
      status: candidate.formula_status === "APPROVED" || candidate.formula_status === "LOCKED" ? "PASS" : "WATCH",
      action: "처방 승인 또는 잠금 상태를 확인하세요.",
    },
    {
      formula_code: candidate.formula_code,
      revision: candidate.revision,
      checklist_item: "Formula Score 90점 이상",
      area: "Intelligence",
      status: (candidate.overall_score || 0) >= 90 ? "PASS" : "WATCH",
      action: "Formula Intelligence Center에서 점수 개선 항목을 확인하세요.",
    },
    {
      formula_code: candidate.formula_code,
      revision: candidate.revision,
      checklist_item: "필수 문서 승인",
      area: "Document",
      status: candidate.approved_document_count >= 3 ? "PASS" : "WATCH",
      action: "Formula Sheet, Spec, COA 등 핵심 문서를 승인하세요.",
    },
    {
      formula_code: candidate.formula_code,
      revision: candidate.revision,
      checklist_item: "AI Action Open 0건",
      area: "AI",
      status: candidate.open_ai_actions === 0 ? "PASS" : "FAIL",
      action: "AI Copilot의 Open Action을 Done 또는 Hold 처리하세요.",
    },
  ];

  await supabaseRelease
    .from("gold_release_checklists")
    .delete()
    .eq("formula_code", candidate.formula_code)
    .eq("revision", candidate.revision);

  const { error } = await supabaseRelease.from("gold_release_checklists").insert(items);
  if (error) throw error;

  return items;
}

export async function fetchReleaseChecklist(formulaCode: string, revision: string): Promise<GoldReleaseChecklist[]> {
  const { data, error } = await supabaseRelease
    .from("gold_release_checklists")
    .select("*")
    .eq("formula_code", formulaCode)
    .eq("revision", revision)
    .order("area", { ascending: true });

  if (error) throw error;
  return (data || []) as GoldReleaseChecklist[];
}
