export type ProjectStatus = "개발중" | "샘플발송" | "양산승인" | "출시" | "보류";

export function generateProjectCode(count: number, year = new Date().getFullYear()) {
  return `${String(year).slice(2)}A${String(count + 1).padStart(3, "0")}`;
}

export function getProjectProgress(status: ProjectStatus) {
  if (status === "개발중") return 30;
  if (status === "샘플발송") return 55;
  if (status === "양산승인") return 80;
  if (status === "출시") return 100;
  return 10;
}
