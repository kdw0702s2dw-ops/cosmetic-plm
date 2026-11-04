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

// DB에 저장된 UTC 타임스탬프 문자열(예: new Date().toISOString())을 "YYYY-MM-DD HH:mm" 형식의 로컬
// 시각 문자열로 바꾼다. 이 값을 그냥 slice(0, 16)으로 잘라서 보여주면 UTC 시각이 그대로 나와서, 한국
// 사용자에게는 실제보다 9시간 이른 시각으로 보인다(예: 오후 3시에 확인했는데 화면엔 오전 6시로 표시).
export function toLocalDateTimeStr(v: string | Date | null | undefined): string {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${toLocalDateStr(d)} ${hh}:${mm}`;
}
