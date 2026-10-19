// 숫자 입력칸(특히 components/common/DecimalInput과 짝을 이루는 onChange 핸들러)에서 공통으로 쓰는
// "입력 중인 문자열 -> 안전한 숫자" 변환 헬퍼. DecimalInput은 "-", "." 처럼 아직 완성되지 않은 중간
// 입력 상태도 그대로 넘겨줄 수 있는데, Number("-")나 Number(".")는 NaN이라 그대로 state에 들어가면
// 이후 계산(합계, 자동 계산 결과 등)이 NaN으로 오염된다 - 그런 미완성 값은 0으로 취급한다(최종 입력이
// 완성되면 그때 정상 숫자로 반영됨).
export function parseDecimal(value: string): number {
  if (value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// 위와 동일하지만 빈 값/미완성 값을 0이 아닌 null로 취급한다 - "0"과 "입력 안 함"을 구분해야 하는
// 필드(단가, 수분율처럼 null이 "값 없음"을 의미하는 DB 컬럼)에 사용한다.
export function parseDecimalOrNull(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
