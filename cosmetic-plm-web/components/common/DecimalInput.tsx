"use client";

import { useState, type CSSProperties } from "react";

type DecimalInputProps = {
  value: number | null | undefined;
  onChange: (raw: string) => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  onBlur?: () => void;
  // true(기본값): value가 정확히 0이면 "아직 입력 안 함"으로 간주해 빈 칸으로 보여준다(원재고/사용량
  // 입력칸처럼 0과 "입력 없음"을 화면에서 굳이 구분하지 않던 기존 관례 유지).
  // false: 0도 실제로 입력된 값으로 보고 "0"을 그대로 보여준다(단가·수분율처럼 null과 0이 서로 다른
  // 의미를 갖는 필드 - 빈 칸은 null, "0"은 실제 0으로 저장된 값).
  blankOnZero?: boolean;
};

// 소수점 포함 숫자 입력용 공용 컴포넌트.
//
// 기존에는 <input type="number" value={숫자필드 || ""} onChange={e => setState(Number(e.target.value))} />
// 식으로 숫자 상태값을 입력칸에 직접 바인딩했는데, 이렇게 하면 키 입력 한 번마다 문자열이 즉시 숫자로
// 변환되어 state에 저장되고, 그 숫자가 다시 화면에 그대로 반영된다. 이 과정에서:
//   - "0", "0.", "0.0" 처럼 숫자로는 0이 되는 중간 입력 상태가 "value || ''" 로 인해 빈 칸으로 보여서
//     방금 입력한 0이 안 보이는 것처럼 느껴지고,
//   - 그 상태에서 이어서 입력하면 커서 위치가 꼬여서 "0.02"를 입력하려 해도 "0."이 사라지고 "2"만
//     남는 문제가 있었다 (실사용 버그 리포트로 확인됨).
//
// 이 컴포넌트는 포커스가 있는 동안(입력 중)에는 사용자가 타이핑한 문자열을 그대로 보여주고, 포커스를
// 벗어날 때만 실제 숫자값으로 다시 동기화한다 - 그래서 "0.02"를 한 글자씩 입력하는 중간 과정이 전부
// 화면에 그대로 보인다.
export default function DecimalInput({
  value, onChange, className, style, placeholder, onBlur, blankOnZero = true,
}: DecimalInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayValue =
    draft !== null
      ? draft
      : value === null || value === undefined
      ? ""
      : blankOnZero && value === 0
      ? ""
      : String(value);

  return (
    <input
      className={className}
      style={style}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => {
        const next = e.target.value;
        // 숫자/소수점(여러 개 허용 - 완성 전 중간 상태)/맨 앞 마이너스만 허용하고, 그 외 문자가 섞여
        // 들어오면 이번 입력은 무시한다(직전 상태 유지). 최종적으로 유효하지 않은 값(".", "-" 단독 등)은
        // 호출 측(onChange)에서 0으로 안전 처리한다.
        if (next !== "" && !/^-?\d*\.?\d*$/.test(next)) return;
        setDraft(next);
        onChange(next);
      }}
      onBlur={() => {
        setDraft(null);
        onBlur?.();
      }}
    />
  );
}
