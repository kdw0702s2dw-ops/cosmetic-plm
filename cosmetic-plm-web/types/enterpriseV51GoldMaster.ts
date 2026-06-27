export type GoldMasterCheckStatus = "완료" | "확인필요" | "미완료";

export type GoldMasterCheckItem = {
  area: string;
  status: GoldMasterCheckStatus;
  score: number;
  message: string;
};

export type GoldMasterSummary = {
  overall_score: number;
  overall_status: GoldMasterCheckStatus;
  items: GoldMasterCheckItem[];
};
