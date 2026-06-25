export function nextSampleNo(count: number, year = new Date().getFullYear()) {
  return `S-${year}-${String(count + 1).padStart(3, "0")}`;
}
