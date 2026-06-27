"use client";

import { supabaseEnterpriseUx } from "@/lib/supabaseEnterpriseUxClient";
import type { EnterpriseRole, LaunchReadinessItem, RoleWorkspaceCard } from "@/types/enterpriseV42";

async function countTable(table: string, filter?: (query: any) => any) {
  let query = supabaseEnterpriseUx.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function fetchRoleWorkspace(role: EnterpriseRole): Promise<RoleWorkspaceCard[]> {
  const [formulas, validations, docs, batches, samples, ai, notifications] = await Promise.all([
    countTable("gold_formula_headers"),
    countTable("gold_formula_validation_runs"),
    countTable("gold_documents"),
    countTable("gold_manufacturing_batches"),
    countTable("gold_sample_requests"),
    countTable("v40_ai_autopilot_runs"),
    countTable("enterprise_notifications", (q) => q.eq("status", "UNREAD")),
  ]);

  const roleMap: Record<EnterpriseRole, RoleWorkspaceCard[]> = {
    "R&D": [
      { title: "AI Autopilot", description: "신규 처방 생성", href: "/enterprise-ai-autopilot", count: ai, priority: "P0" },
      { title: "Formula", description: "처방 작성/수정", href: "/enterprise-gold-formula-live", count: formulas, priority: "P0" },
      { title: "AI Recommendation", description: "원료/처방 추천", href: "/enterprise-ai-recommendation", count: ai, priority: "P1" },
      { title: "Workflow", description: "개발 흐름 확인", href: "/enterprise-workflow", count: formulas, priority: "P1" },
    ],
    "QA/QC": [
      { title: "Validation", description: "처방 검증", href: "/enterprise-gold-formula-validation", count: validations, priority: "P0" },
      { title: "Documents", description: "COA/Spec 문서", href: "/enterprise-gold-documents", count: docs, priority: "P1" },
      { title: "Document Workflow", description: "문서 승인/반려", href: "/enterprise-gold-document-workflow", count: docs, priority: "P1" },
    ],
    "RA": [
      { title: "Regulation", description: "국가별 규제 검토", href: "/enterprise-gold-intelligence", count: formulas, priority: "P0" },
      { title: "Knowledge DB", description: "INCI/규제 DB", href: "/enterprise-knowledge-db", count: formulas, priority: "P1" },
      { title: "Launch Readiness", description: "출시 준비도", href: "/enterprise-launch-readiness", count: formulas, priority: "P1" },
    ],
    "Production": [
      { title: "Manufacturing", description: "Batch/제조지시", href: "/enterprise-gold-manufacturing", count: batches, priority: "P0" },
      { title: "Samples", description: "샘플/파일럿", href: "/enterprise-gold-samples", count: samples, priority: "P1" },
    ],
    "Sales": [
      { title: "Samples", description: "고객 샘플", href: "/enterprise-gold-samples", count: samples, priority: "P0" },
      { title: "Release Center", description: "출시 일정", href: "/enterprise-gold-release", count: formulas, priority: "P1" },
      { title: "Documents", description: "고객 제출 문서", href: "/enterprise-gold-documents", count: docs, priority: "P1" },
    ],
    "Admin": [
      { title: "Command Center", description: "전체 KPI", href: "/enterprise-gold-command", count: formulas, priority: "P0" },
      { title: "Notifications", description: "알림", href: "/enterprise-notifications", count: notifications, priority: "P1" },
      { title: "Activity Timeline", description: "활동 이력", href: "/enterprise-activity", count: formulas, priority: "P1" },
    ],
  };

  return roleMap[role];
}

export async function fetchLaunchReadiness() {
  const { data: formulas, error } = await supabaseEnterpriseUx
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(100);
  if (error) throw error;

  const rows = [];
  for (const f of formulas || []) {
    const [validation, cost, score, docs, aiOpen, batch] = await Promise.all([
      countTable("gold_formula_validation_runs", (q) => q.eq("formula_code", f.formula_code).eq("revision", f.revision)),
      countTable("gold_formula_cost_summaries", (q) => q.eq("formula_code", f.formula_code).eq("revision", f.revision)),
      supabaseEnterpriseUx.from("gold_formula_scores").select("*").eq("formula_code", f.formula_code).eq("revision", f.revision).maybeSingle(),
      countTable("gold_documents", (q) => q.eq("formula_code", f.formula_code).eq("revision", f.revision)),
      countTable("gold_ai_copilot_actions", (q) => q.eq("formula_code", f.formula_code).eq("revision", f.revision).eq("status", "OPEN")),
      countTable("gold_manufacturing_batches", (q) => q.eq("formula_code", f.formula_code).eq("revision", f.revision)),
    ]);

    const scoreValue = Number(score.data?.overall_score || 0);
    const items: LaunchReadinessItem[] = [
      { area: "Formula", status: f.total_percent === 100 ? "READY" : "WATCH", score: f.total_percent === 100 ? 100 : 70, message: `Formula total ${f.total_percent}%`, href: "/enterprise-gold-formula-live" },
      { area: "Validation", status: validation > 0 ? "READY" : "WATCH", score: validation > 0 ? 100 : 50, message: validation > 0 ? "검증 이력 있음" : "검증 필요", href: "/enterprise-gold-formula-validation" },
      { area: "Cost", status: cost > 0 ? "READY" : "WATCH", score: cost > 0 ? 100 : 50, message: cost > 0 ? "원가 계산 완료" : "원가 계산 필요", href: "/enterprise-gold-formula-cost" },
      { area: "Intelligence", status: scoreValue >= 90 ? "READY" : scoreValue > 0 ? "WATCH" : "BLOCK", score: scoreValue, message: scoreValue ? `Score ${scoreValue}` : "Intelligence 실행 필요", href: "/enterprise-gold-intelligence" },
      { area: "Documents", status: docs >= 3 ? "READY" : "WATCH", score: Math.min(100, docs * 30), message: `문서 ${docs}건`, href: "/enterprise-gold-documents" },
      { area: "AI", status: aiOpen === 0 ? "READY" : "BLOCK", score: aiOpen === 0 ? 100 : 40, message: `Open AI Action ${aiOpen}건`, href: "/enterprise-gold-ai-copilot" },
      { area: "Manufacturing", status: batch > 0 ? "READY" : "WATCH", score: batch > 0 ? 100 : 50, message: batch > 0 ? "Batch 생성 완료" : "Batch 미생성", href: "/enterprise-gold-manufacturing" },
    ];

    const avg = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
    rows.push({
      formula_code: f.formula_code,
      revision: f.revision,
      formula_name: f.formula_name,
      readiness_score: avg,
      status: avg >= 90 && aiOpen === 0 ? "READY" : aiOpen > 0 ? "BLOCK" : "WATCH",
      items,
    });
  }
  return rows;
}

export async function globalSearch(keyword: string) {
  if (!keyword.trim()) return [];
  const k = keyword.trim();
  const searches = await Promise.all([
    supabaseEnterpriseUx.from("gold_formula_headers").select("formula_code, formula_name, revision, status").or(`formula_code.ilike.%${k}%,formula_name.ilike.%${k}%`).limit(10),
    supabaseEnterpriseUx.from("enterprise_raw_material_master").select("raw_code, raw_name, inci_en, inci_kr").or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%`).limit(10),
    supabaseEnterpriseUx.from("gold_documents").select("document_code, document_type, title, status").or(`document_code.ilike.%${k}%,title.ilike.%${k}%,document_type.ilike.%${k}%`).limit(10),
  ]);

  const results: any[] = [];
  const [formulas, raws, docs] = searches;
  (formulas.data || []).forEach((x: any) => results.push({ type: "Formula", title: `${x.formula_code} / ${x.revision}`, description: x.formula_name, href: "/enterprise-gold-formula-live", status: x.status }));
  (raws.data || []).forEach((x: any) => results.push({ type: "Raw", title: x.raw_code, description: `${x.raw_name} / ${x.inci_en || ""}`, href: "/enterprise-db-live", status: "ACTIVE" }));
  (docs.data || []).forEach((x: any) => results.push({ type: "Document", title: x.document_code, description: x.title, href: "/enterprise-gold-documents", status: x.status }));
  return results;
}

export async function fetchNotifications() {
  const { data, error } = await supabaseEnterpriseUx
    .from("enterprise_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createSystemNotifications() {
  const [openActions, noDocs] = await Promise.all([
    countTable("gold_ai_copilot_actions", (q) => q.eq("status", "OPEN")),
    countTable("gold_formula_headers"),
  ]);

  const rows = [
    {
      notification_code: `NOTI-AI-${Date.now()}`,
      title: "AI Action 확인",
      message: `Open AI Action ${openActions}건이 있습니다.`,
      area: "AI",
      href: "/enterprise-gold-ai-copilot",
      status: "UNREAD",
      priority: openActions > 0 ? "P0" : "P2",
    },
    {
      notification_code: `NOTI-DOC-${Date.now()}`,
      title: "문서 패키지 확인",
      message: "출시 전 Formula Sheet, Spec, COA 생성 여부를 확인하세요.",
      area: "Documents",
      href: "/enterprise-gold-documents",
      status: "UNREAD",
      priority: noDocs > 0 ? "P1" : "P2",
    },
  ];

  const { error } = await supabaseEnterpriseUx.from("enterprise_notifications").insert(rows);
  if (error) throw error;
}

export async function updateNotificationStatus(id: string, status: string) {
  const { error } = await supabaseEnterpriseUx.from("enterprise_notifications").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function fetchActivityTimeline() {
  const { data, error } = await supabaseEnterpriseUx
    .from("enterprise_activity_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function createActivitySnapshot() {
  const rows = [
    { event_code: `ACT-${Date.now()}-AI`, area: "AI", action: "SNAPSHOT", title: "AI/PLM 상태 스냅샷 생성", description: "Production Experience Pack에서 자동 생성", href: "/enterprise" },
    { event_code: `ACT-${Date.now()}-REL`, area: "Release", action: "CHECK", title: "Launch Readiness 확인 필요", description: "출시 준비도 화면에서 Formula 상태 확인", href: "/enterprise-launch-readiness" },
  ];
  const { error } = await supabaseEnterpriseUx.from("enterprise_activity_events").insert(rows);
  if (error) throw error;
}
