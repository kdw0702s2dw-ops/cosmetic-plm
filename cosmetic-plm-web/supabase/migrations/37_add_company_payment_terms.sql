-- 업체(공급사)별 결제조건을 구조화되지 않은 자유 텍스트로 저장한다.
-- 배경: 원료 발주관리에서 업체마다 선결제/익월말 결제 등 조건이 다른데, 이 지식이 담당자 개인
-- 기억이나 브라우저 localStorage(발주서 출력 모달의 "마지막 입력값" 기억)에만 있어서 담당자가
-- 퇴사하면 알 수 없게 되는 문제를 해결하기 위함. 자동 결제예정일 계산 없이 순수 기록 용도의
-- MVP로, plm_companies에 한 줄 추가한다.
alter table public.plm_companies
  add column if not exists payment_terms text;

comment on column public.plm_companies.payment_terms is
  '결제조건(자유 텍스트, 예: 선결제, 익월말 결제 등) - 담당자 퇴사 대비 기록용. 자동 계산에는 쓰이지 않음.';
