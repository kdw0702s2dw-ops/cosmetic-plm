// Real Operation Pack Service

export function validateImportRows(total: number, valid: number) {
  const error = Math.max(0, total - valid);
  return {
    rows_error: error,
    status: error > 0 ? "ERROR" : "IMPORTED",
  };
}

export function getTaskPriority(hasRisk: boolean, dueToday: boolean) {
  if (hasRisk) return "P0";
  if (dueToday) return "P1";
  return "P2";
}

export function getOperationStatus(errorCount: number, warningCount: number) {
  if (errorCount > 0) return "OPTIMIZE";
  if (warningCount > 0) return "WATCH";
  return "GOOD";
}

export function buildSearchSummary(keyword: string, resultType: string) {
  return `${keyword} 관련 ${resultType} 검색 결과`;
}

export function shouldUseLazyLoad(recordCount: number) {
  return recordCount > 1000;
}
