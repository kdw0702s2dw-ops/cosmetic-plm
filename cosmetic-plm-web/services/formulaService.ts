export function generateFormulaCode(count: number) {
  return `FC-${String(count + 1).padStart(3, "0")}`;
}

export function getNextVersion(version: string) {
  return (Number(version || "1") + 0.1).toFixed(1);
}

export function isFormulaTotalValid(totalPercent: number) {
  return Math.abs(totalPercent - 100) < 0.0001;
}
