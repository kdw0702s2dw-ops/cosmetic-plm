export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function mapFunctionKoToEn(functionKo: string) {
  if (functionKo === "보습제") return "Humectant";
  if (functionKo === "보존제") return "Preservative";
  if (functionKo.includes("진정")) return "Skin Conditioning";
  return "";
}
