export type DataRepairResult = {
  action: string;
  affected: number;
  message: string;
};

export type DataRepairPreview = {
  wrong_total_formulas: number;
  orphan_lines: number;
  missing_inci_raws: number;
  missing_price_raws: number;
};
