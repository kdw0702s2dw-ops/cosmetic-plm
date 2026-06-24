export type RegulationResult = {
  level: string;
  message: string;
};

export function getRegulationLevel(
  dangerCount: number,
  cautionCount: number
): RegulationResult {
  if (dangerCount > 0) {
    return {
      level: "위험",
      message: "규제 위반 성분 존재",
    };
  }

  if (cautionCount > 0) {
    return {
      level: "주의",
      message: "규제 검토 필요",
    };
  }

  return {
    level: "정상",
    message: "판매 가능",
  };
}