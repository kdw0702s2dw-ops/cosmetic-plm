export type DataQualityStatus = "정상" | "주의" | "오류";

export type DataQualityIssue = {
  area: string;
  status: DataQualityStatus;
  count: number;
  message: string;
};

export type DataQualitySummary = {
  score: number;
  status: DataQualityStatus;
  issues: DataQualityIssue[];
};
