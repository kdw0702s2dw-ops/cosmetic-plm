export type V60GraphNodeType =
  | "formula"
  | "raw"
  | "inci"
  | "supplier"
  | "document"
  | "batch"
  | "revision"
  | "ai"
  | "risk";

export type V60GraphNode = {
  id: string;
  type: V60GraphNodeType;
  label: string;
  subLabel?: string;
  score?: number;
  meta?: Record<string, any>;
};

export type V60GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
};

export type V60KnowledgeGraph = {
  formula_code: string;
  revision: string;
  nodes: V60GraphNode[];
  edges: V60GraphEdge[];
  summary: {
    node_count: number;
    edge_count: number;
    raw_count: number;
    document_count: number;
    batch_count: number;
    risk_count: number;
  };
};

export type V60RawImpact = {
  raw_code: string;
  raw_name: string;
  used_formula_count: number;
  affected_formulas: any[];
  affected_documents: number;
  affected_batches: number;
  ai_summary: string;
};
