-- 처방 개발형태/진행상태 필드 추가
alter table public.plm_formulas
  add column if not exists development_type text,
  add column if not exists progress_status text not null default '개발중';
