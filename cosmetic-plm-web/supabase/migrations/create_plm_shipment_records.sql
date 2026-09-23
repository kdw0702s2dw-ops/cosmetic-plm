-- 생산관리 > 출고관리 - 출고 건별 수기 입력 기록을 저장하는 테이블.
-- 출고일/고객사/수량/제품코드/제품명/LOT(EXP)/기능성/중금속·미생물 검사 진행상태를 사용자가 직접
-- 입력하고, 그 항목들(기능성/중금속/미생물 제외)로 검색할 수 있게 하기 위한 용도.
--
-- 참고: 이 마이그레이션은 2026-09-23에 Supabase 프로젝트(ztzitdhngdtfwmfqusbb)에 이미 적용되어
-- 있습니다. 이 파일은 로컬 저장소의 supabase/migrations/ 이력을 실제 DB 상태와 맞추기 위한
-- 기록용입니다 - if not exists 가드가 있어 다시 실행해도 안전합니다.

create table if not exists plm_shipment_records (
  id uuid primary key default gen_random_uuid(),
  shipment_date date,
  customer text,
  quantity numeric,
  product_code text,
  product_name text,
  lot_exp text,
  functional_claim text not null default '해당없음'
    check (functional_claim in ('해당없음','주름기능성','미백기능성','이중기능성')),
  heavy_metal_status text not null default '해당없음'
    check (heavy_metal_status in ('해당없음','진행중','완료')),
  microbial_status text not null default '해당없음'
    check (microbial_status in ('해당없음','진행중','완료')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text
);

comment on table plm_shipment_records is '생산관리 > 출고관리 - 출고 건별 수기 입력 기록 (고객사/수량/제품코드/제품명/LOT(EXP)/기능성/중금속·미생물 검사 진행상태).';

create index if not exists plm_shipment_records_shipment_date_idx on plm_shipment_records (shipment_date desc);

alter table plm_shipment_records enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'plm_shipment_records' and policyname = 'plm_shipment_records_read') then
    create policy plm_shipment_records_read on plm_shipment_records for select to authenticated
      using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'plm_shipment_records' and policyname = 'plm_shipment_records_write') then
    create policy plm_shipment_records_write on plm_shipment_records for all to authenticated
      using (plm_has_role(array['Admin','Researcher','Production'])) with check (plm_has_role(array['Admin','Researcher','Production']));
  end if;
end $$;
