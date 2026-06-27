export type V51ReleaseStatus = "READY" | "WATCH" | "BLOCK";

export type V51ReleaseItem = {
  area: string;
  status: V51ReleaseStatus;
  score: number;
  message: string;
};
