// Final Sprint D: Performance Optimization Service

export function shouldLazyLoad(recordCount: number, threshold = 500) {
  return recordCount >= threshold;
}

export function getPerformanceStatus(input: { buildOk: boolean; consoleErrors: number; heavyModules: number }) {
  if (!input.buildOk || input.consoleErrors > 0) return "RISK";
  if (input.heavyModules > 3) return "WATCH";
  return "GOOD";
}

export function moduleSplitPriority(linesOfCode: number) {
  if (linesOfCode > 5000) return "P0";
  if (linesOfCode > 2500) return "P1";
  return "P2";
}
