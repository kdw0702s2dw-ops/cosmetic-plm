-- 처방관리: 제품유형을 자유 입력에서 선택형으로 바꾸기 위한 마스터 테이블.
-- 이름은 대소문자/앞뒤 공백 무시 기준으로 유일. 기존 plm_formulas.product_type 값을 정리 없이 그대로 시드한다.
-- 읽기는 전 역할, 쓰기(새 유형 추가)는 plm_formulas 쓰기 권한과 같은 Admin/Researcher.
-- 원격 적용 마이그레이션명: create_plm_product_types
create table if not exists plm_product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists plm_product_types_name_unique
  on plm_product_types (lower(trim(name)));

alter table plm_product_types enable row level security;

create policy plm_product_types_read on plm_product_types
  for select using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));

create policy plm_product_types_write on plm_product_types
  for all using (plm_has_role(array['Admin','Researcher']))
  with check (plm_has_role(array['Admin','Researcher']));

insert into plm_product_types (name)
select distinct trim(product_type)
from plm_formulas
where product_type is not null and trim(product_type) <> '';
