export type RawMaterialLiveRow = {
  id?: string;
  raw_code: string;
  raw_name: string;
  supplier: string | null;
  unit_price: number | null;
  inci_kr: string | null;
  inci_en: string | null;
  inci_cn: string | null;
  inci_jp: string | null;
  cas_no: string | null;
  ec_no: string | null;
  composition_total: number | null;
  document_status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DatabaseHealthRow = {
  module: string;
  tableName: string;
  status: "LIVE" | "EMPTY" | "ERROR";
  count: number;
  message: string;
};
