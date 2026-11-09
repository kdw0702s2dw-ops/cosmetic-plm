-- 참고: 이 마이그레이션은 Supabase MCP의 apply_migration이 승인 대기 중 반복 타임아웃돼서
-- execute_sql로 직접 실행해 적용했다 - 그래서 Supabase 쪽 마이그레이션 히스토리(supabase_migrations
-- 스키마)에는 이 파일에 대응하는 항목이 없다. DB 상태(테이블/정책/트리거/백필 데이터)는 아래
-- 내용과 실제로 일치하는지 적용 직후 조회로 확인했다.
--
-- Lot 단위 출고(완제품) 수량을 별도 테이블로 분리.
-- 배경: 동일 Lot No.로 추가 생산(생산실적 복수 행)이 발생할 수 있는데, 기존에는
-- shipped_qty_ea/shipped_qty_pack을 plm_production_records(생산실적 행 단위)에 직접
-- 저장하여, 동일 Lot의 행이 여러 개면 "전체 목록"/"월별·연도별 집계"/엑셀 출력에서
-- 합계를 낼 때 중복 합산되는 문제가 있었음(실제로 Lot "5068"이 3개 행에 동일한 값이
-- 중복 기재되어 있어 합계가 3배로 부풀려져 있었음 - 이번 백필로 정상화됨).
--
-- 이제 Lot(formula_code+revision+lot_no) 단위로 "총 출고 수량"을 한 번만 저장하고,
-- 화면에서는 이 테이블 값을 조회하여 해당 Lot의 모든 행에 동일하게 표시/집계한다.
-- 기존 plm_production_records.shipped_qty_ea/shipped_qty_pack 컬럼은 호환성을 위해
-- 그대로 둔다 (삭제하지 않음 - 파괴적 변경 금지, 추후 완전 전환 여부는 별도 논의).

create table if not exists public.plm_production_lot_shipments (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  lot_no text not null,
  shipped_qty_ea numeric,
  shipped_qty_pack numeric,
  note text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formula_code, revision, lot_no)
);

comment on table public.plm_production_lot_shipments is
  'Lot 단위(동일 formula_code+revision+lot_no) 완제품 총 출고 수량. 동일 Lot의 추가 생산 행이 여러 개 있어도 출고 수량은 Lot당 1개 값으로 관리하여 중복 합산을 방지.';

create or replace function public.plm_set_production_lot_shipments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_plm_production_lot_shipments_updated_at
  before update on public.plm_production_lot_shipments
  for each row
  execute function public.plm_set_production_lot_shipments_updated_at();

alter table public.plm_production_lot_shipments enable row level security;

-- plm_production_records와 동일한 역할 구성 (Production 역할도 쓰기 가능 - 생산실적 자체를
-- Production 역할이 입력/수정하므로 출고 수량도 함께 관리할 수 있어야 함).
create policy plm_production_lot_shipments_read on public.plm_production_lot_shipments
  for select using (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text, 'QA'::text, 'Viewer'::text, 'Production'::text]));

create policy plm_production_lot_shipments_write on public.plm_production_lot_shipments
  for all using (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text, 'Production'::text]))
  with check (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text, 'Production'::text]));

-- 기존 plm_production_records 데이터를 Lot 단위로 백필.
-- 적용 시점 확인된 중복 Lot 4건(4051/4036/5070/5068) 모두 그룹 내 값이 전부 NULL이거나
-- 전부 동일한 non-null 값이었으므로 MAX()를 사용해도 데이터 손실/충돌 없이 안전함
-- (Lot "5068"의 경우 3중 중복이 1개 값(20000 EA / 4000 PACK)으로 정상화됨 - 적용 후 확인됨).
insert into public.plm_production_lot_shipments
  (formula_code, revision, lot_no, shipped_qty_ea, shipped_qty_pack)
select
  formula_code,
  revision,
  lot_no,
  max(shipped_qty_ea) as shipped_qty_ea,
  max(shipped_qty_pack) as shipped_qty_pack
from public.plm_production_records
where lot_no is not null and lot_no <> ''
group by formula_code, revision, lot_no
on conflict (formula_code, revision, lot_no) do nothing;
