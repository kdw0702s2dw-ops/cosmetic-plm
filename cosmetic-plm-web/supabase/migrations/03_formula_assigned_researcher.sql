-- 처방 담당 연구원 필드 추가
alter table public.plm_formulas
  add column if not exists assigned_researcher text;
