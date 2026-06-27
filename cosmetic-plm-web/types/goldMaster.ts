export type GoldStatus = "LIVE" | "READY" | "EMPTY" | "ERROR" | "WATCH";

export type GoldModuleHealth = {
  module: string;
  tableName: string;
  count: number;
  status: GoldStatus;
  message: string;
};

export type GoldRawMaterial = {
  raw_code: string;
  raw_name: string;
  supplier: string | null;
  unit_price: number | null;
  inci_kr: string | null;
  inci_en: string | null;
  cas_no: string | null;
  ec_no: string | null;
  document_status: string | null;
};

export type GoldFormula = {
  formula_code: string;
  formula_name: string;
  revision: string | null;
  raw_code: string | null;
  percentage: number | null;
  phase: string | null;
  claim: string | null;
};

export type GoldAction = {
  id: string;
  area: "DB" | "Formula" | "Document" | "AI" | "Dashboard" | "Release";
  task: string;
  priority: "P0" | "P1" | "P2";
  status: "TODO" | "DONE";
};
