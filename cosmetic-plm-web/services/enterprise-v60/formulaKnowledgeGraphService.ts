"use client";

import { supabaseProductionFinal } from "@/lib/supabaseProductionFinalClient";
import type { V60KnowledgeGraph, V60GraphNode, V60GraphEdge, V60RawImpact } from "@/types/enterpriseV60KnowledgeGraph";

export async function fetchV60GraphFormulaOptions() {
  const { data, error } = await supabaseProductionFinal
    .from("gold_formula_summary")
    .select("*")
    .order("formula_code", { ascending: true })
    .limit(150);

  if (error) throw error;
  return data || [];
}

export async function fetchV60RawOptions(keyword = "") {
  let query = supabaseProductionFinal
    .from("enterprise_raw_material_master")
    .select("*")
    .order("raw_code", { ascending: true })
    .limit(100);

  if (keyword.trim()) {
    const k = keyword.trim();
    query = query.or(`raw_code.ilike.%${k}%,raw_name.ilike.%${k}%,inci_en.ilike.%${k}%,inci_kr.ilike.%${k}%,cas_no.ilike.%${k}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function buildV60FormulaKnowledgeGraph(formula: any): Promise<V60KnowledgeGraph> {
  const [linesRes, docsRes, batchesRes, aiRes] = await Promise.all([
    supabaseProductionFinal.from("gold_formula_lines").select("*").eq("formula_code", formula.formula_code).eq("revision", formula.revision).order("line_no", { ascending: true }),
    supabaseProductionFinal.from("gold_documents").select("*").eq("formula_code", formula.formula_code).eq("revision", formula.revision).limit(100),
    supabaseProductionFinal.from("gold_manufacturing_batches").select("*").eq("formula_code", formula.formula_code).eq("revision", formula.revision).limit(100),
    supabaseProductionFinal.from("v60_ai_recommendation_runs").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  if (linesRes.error) throw linesRes.error;
  if (docsRes.error) throw docsRes.error;
  if (batchesRes.error) throw batchesRes.error;
  if (aiRes.error) throw aiRes.error;

  const lines = linesRes.data || [];
  const docs = docsRes.data || [];
  const batches = batchesRes.data || [];
  const aiRuns = aiRes.data || [];

  const nodes: V60GraphNode[] = [];
  const edges: V60GraphEdge[] = [];
  const formulaNodeId = `formula:${formula.formula_code}:${formula.revision}`;

  nodes.push({
    id: formulaNodeId,
    type: "formula",
    label: formula.formula_name || formula.formula_code,
    subLabel: `${formula.formula_code} / ${formula.revision}`,
    score: Number(formula.total_percent || 0),
    meta: formula,
  });

  const rawRiskKeywords = ["retinol", "salicylic", "hydroquinone", "triclosan"];
  let riskCount = 0;

  for (const line of lines) {
    const { data: raw } = await supabaseProductionFinal
      .from("enterprise_raw_material_master")
      .select("*")
      .eq("raw_code", line.raw_code)
      .maybeSingle();

    const rawNodeId = `raw:${line.raw_code}`;
    const inciNodeId = `inci:${line.raw_code}`;
    const supplierNodeId = `supplier:${raw?.supplier || "미등록"}:${line.raw_code}`;

    nodes.push({
      id: rawNodeId,
      type: "raw",
      label: line.raw_name || raw?.raw_name || line.raw_code,
      subLabel: `${line.percentage}% · ${line.raw_code}`,
      score: Number(line.percentage || 0),
      meta: { ...raw, ...line },
    });

    edges.push({
      id: `edge:${formulaNodeId}:${rawNodeId}`,
      source: formulaNodeId,
      target: rawNodeId,
      label: `${line.percentage}%`,
      weight: Number(line.percentage || 0),
    });

    nodes.push({
      id: inciNodeId,
      type: "inci",
      label: line.inci_en || raw?.inci_en || "INCI 미등록",
      subLabel: line.inci_kr || raw?.inci_kr || "",
      meta: { cas_no: raw?.cas_no, ec_no: raw?.ec_no },
    });

    edges.push({
      id: `edge:${rawNodeId}:${inciNodeId}`,
      source: rawNodeId,
      target: inciNodeId,
      label: "INCI",
    });

    if (raw?.supplier) {
      nodes.push({
        id: supplierNodeId,
        type: "supplier",
        label: raw.supplier,
        subLabel: "공급사",
        meta: raw,
      });
      edges.push({
        id: `edge:${rawNodeId}:${supplierNodeId}`,
        source: rawNodeId,
        target: supplierNodeId,
        label: "공급",
      });
    }

    const riskHit = rawRiskKeywords.some((k) => String(line.inci_en || raw?.inci_en || "").toLowerCase().includes(k));
    if (riskHit) {
      riskCount += 1;
      const riskNodeId = `risk:${line.raw_code}`;
      nodes.push({
        id: riskNodeId,
        type: "risk",
        label: "규제/안정성 검토 필요",
        subLabel: line.inci_en || raw?.inci_en || line.raw_name,
        score: 65,
        meta: { raw_code: line.raw_code },
      });
      edges.push({
        id: `edge:${rawNodeId}:${riskNodeId}`,
        source: rawNodeId,
        target: riskNodeId,
        label: "Risk",
      });
    }
  }

  for (const doc of docs) {
    const nodeId = `document:${doc.document_code}`;
    nodes.push({
      id: nodeId,
      type: "document",
      label: doc.title || doc.document_type,
      subLabel: doc.document_type,
      meta: doc,
    });
    edges.push({
      id: `edge:${formulaNodeId}:${nodeId}`,
      source: formulaNodeId,
      target: nodeId,
      label: "문서",
    });
  }

  for (const batch of batches) {
    const nodeId = `batch:${batch.batch_no}`;
    nodes.push({
      id: nodeId,
      type: "batch",
      label: batch.batch_no,
      subLabel: `${batch.batch_size_kg}kg · ${batch.status}`,
      meta: batch,
    });
    edges.push({
      id: `edge:${formulaNodeId}:${nodeId}`,
      source: formulaNodeId,
      target: nodeId,
      label: "Batch",
    });
  }

  for (const run of aiRuns) {
    const nodeId = `ai:${run.id}`;
    nodes.push({
      id: nodeId,
      type: "ai",
      label: "AI 추천",
      subLabel: run.prompt?.slice(0, 40) || "AI Recommendation",
      meta: run,
    });
    edges.push({
      id: `edge:${formulaNodeId}:${nodeId}`,
      source: formulaNodeId,
      target: nodeId,
      label: "AI",
    });
  }

  const uniqueNodes = Array.from(new Map(nodes.map((n) => [n.id, n])).values());

  const graph: V60KnowledgeGraph = {
    formula_code: formula.formula_code,
    revision: formula.revision,
    nodes: uniqueNodes,
    edges,
    summary: {
      node_count: uniqueNodes.length,
      edge_count: edges.length,
      raw_count: lines.length,
      document_count: docs.length,
      batch_count: batches.length,
      risk_count: riskCount,
    },
  };

  await supabaseProductionFinal.from("v60_formula_knowledge_graph_runs").insert({
    formula_code: formula.formula_code,
    revision: formula.revision,
    node_count: graph.summary.node_count,
    edge_count: graph.summary.edge_count,
    result_json: graph,
    created_by: "v6.0 Formula Knowledge Graph",
  });

  return graph;
}

export async function analyzeV60RawImpact(raw: any): Promise<V60RawImpact> {
  const { data: lines, error: lineError } = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("raw_code", raw.raw_code)
    .limit(500);

  if (lineError) throw lineError;

  const formulaKeys = Array.from(new Set((lines || []).map((x) => `${x.formula_code}__${x.revision}`)));
  const affectedFormulas = [];

  for (const key of formulaKeys) {
    const [formula_code, revision] = key.split("__");
    const { data } = await supabaseProductionFinal
      .from("gold_formula_summary")
      .select("*")
      .eq("formula_code", formula_code)
      .eq("revision", revision)
      .maybeSingle();
    if (data) affectedFormulas.push(data);
  }

  let affectedDocuments = 0;
  let affectedBatches = 0;

  for (const f of affectedFormulas) {
    const [docs, batches] = await Promise.all([
      supabaseProductionFinal.from("gold_documents").select("*", { count: "exact", head: true }).eq("formula_code", f.formula_code).eq("revision", f.revision),
      supabaseProductionFinal.from("gold_manufacturing_batches").select("*", { count: "exact", head: true }).eq("formula_code", f.formula_code).eq("revision", f.revision),
    ]);
    affectedDocuments += docs.count || 0;
    affectedBatches += batches.count || 0;
  }

  const impact: V60RawImpact = {
    raw_code: raw.raw_code,
    raw_name: raw.raw_name,
    used_formula_count: affectedFormulas.length,
    affected_formulas: affectedFormulas,
    affected_documents: affectedDocuments,
    affected_batches: affectedBatches,
    ai_summary: `${raw.raw_name} 변경 시 처방 ${affectedFormulas.length}건, 문서 ${affectedDocuments}건, Batch ${affectedBatches}건에 영향이 있을 수 있습니다.`,
  };

  await supabaseProductionFinal.from("v60_raw_impact_runs").insert({
    raw_code: raw.raw_code,
    raw_name: raw.raw_name,
    used_formula_count: affectedFormulas.length,
    result_json: impact,
    created_by: "v6.0 Raw Impact Engine",
  });

  return impact;
}

export async function findV60SimilarFormulas(formula: any) {
  const baseLines = await supabaseProductionFinal
    .from("gold_formula_lines")
    .select("*")
    .eq("formula_code", formula.formula_code)
    .eq("revision", formula.revision);

  if (baseLines.error) throw baseLines.error;

  const baseSet = new Set((baseLines.data || []).map((x) => x.raw_code));
  const options = await fetchV60GraphFormulaOptions();
  const results = [];

  for (const option of options) {
    if (option.formula_code === formula.formula_code && option.revision === formula.revision) continue;
    const lines = await supabaseProductionFinal
      .from("gold_formula_lines")
      .select("raw_code")
      .eq("formula_code", option.formula_code)
      .eq("revision", option.revision);

    if (lines.error) continue;
    const targetSet = new Set((lines.data || []).map((x) => x.raw_code));
    const intersection = [...baseSet].filter((x) => targetSet.has(x)).length;
    const union = new Set([...baseSet, ...targetSet]).size || 1;
    const similarity = Math.round((intersection / union) * 100);
    results.push({ ...option, similarity });
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}
