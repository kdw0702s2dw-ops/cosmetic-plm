export type V51HealthStatus = "정상" | "주의" | "오류";

export type V51HealthItem = {
  area: string;
  table_name: string;
  count: number;
  status: V51HealthStatus;
  message: string;
};

export type V51HealthSummary = {
  overall_status: V51HealthStatus;
  ready_count: number;
  watch_count: number;
  error_count: number;
  items: V51HealthItem[];
};
