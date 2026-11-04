// 로컬(브라우저) 기준 날짜를 다루는 공용 함수 모음.
//
// Date.toISOString()은 항상 UTC 기준으로 변환한다. 한국(UTC+9)에서는 로컬 자정~오전 8시59분 사이에는
// UTC 날짜가 로컬보다 하루 전날이라서, 그냥 toISOString().slice(0, 10)으로 "오늘"이나 날짜 기본값을
// 만들면 그 시간대에 하루 밀려서 틀린 날짜가 나온다(예: "오늘" 표시가 하루 전으로 보이거나, 발주/생산
// 기록 등의 날짜 기본값이 하루 전으로 저장됨). 이 파일의 함수들은 UTC 변환 없이 로컬 연/월/일을 그대로
// 문자열로 만들어서 이 문제를 피한다.

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocalStr(): string {
  return toLocalDateStr(new Date());
}

// dateStr(YYYY-MM-DD)에 days일을 더한/뺀 날짜를 역시 로컬 기준 문자열로 돌려준다(음수 days는 과거 날짜).
export function addLocalDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}
