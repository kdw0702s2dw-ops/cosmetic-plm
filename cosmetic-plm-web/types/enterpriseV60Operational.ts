export type RawMaterialComponent = {
  id?: string;
  raw_code: string;
  component_no: number;
  component_name_kr?: string;
  component_name_en?: string;
  inci_kr?: string;
  inci_en?: string;
  inci_cn?: string;
  inci_jp?: string;
  cas_no?: string;
  ec_no?: string;
  composition_percent: number;
  function_kr?: string;
  function_en?: string;
  note?: string;
};

export type RawMaterialMaster = {
  id?: string;
  raw_code: string;
  raw_name: string;
  trade_name?: string;
  raw_type?: "SINGLE" | "COMPLEX";
  supplier?: string;
  manufacturer?: string;
  unit_price?: number;
  currency?: string;
  moq?: string;
  lead_time?: string;
  inci_kr?: string;
  inci_en?: string;
  inci_cn?: string;
  inci_jp?: string;
  cas_no?: string;
  ec_no?: string;
  function_kr?: string;
  function_en?: string;
  note?: string;
};

export type DocumentExportPayload = {
  document_code: string;
  title: string;
  document_type: string;
  formula_code?: string;
  revision?: string;
  html: string;
};
