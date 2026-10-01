-- 원료 발주관리 개선:
-- (1) 발주 품목에 패킹 정보 추가 (예: "20kg/drum")
-- (2) 발주번호 자동채번을 "발주일(order_date)" 기준 연월로 변경 - 등록 시각이 아니라 사용자가 지정한
--     발주일 기준이어야 함(예: 발주일을 10월로 등록했는데 번호가 09월로 찍히면 안 됨).
-- (3) 진행상태에 "부분입고" 추가.

-- (1) 패킹 정보
alter table plm_raw_material_purchase_order_items add column if not exists packing text;

-- (3) 진행상태 체크 제약에 "부분입고" 추가
alter table plm_raw_material_purchase_orders drop constraint if exists plm_raw_material_purchase_orders_status_check;
alter table plm_raw_material_purchase_orders add constraint plm_raw_material_purchase_orders_status_check
  check (status in ('주문완료','부분입고','입고완료','취소'));

-- (2) 발주번호 자동채번 방식 변경.
-- 기존 방식(21_raw_material_purchase_orders.sql의 plm_next_purchase_order_no, order_no 컬럼 DEFAULT)의
-- 문제: 컬럼 DEFAULT 표현식은 같은 행의 다른 컬럼(order_date)을 참조할 수 없어서 now()(등록 "시각")로만
-- 번호를 매길 수 있었다 - 자정 근처에 등록하거나 발주일을 과거/미래로 지정하면 실제 발주월과 번호가
-- 어긋난다. BEFORE INSERT 트리거로 바꿔서 NEW.order_date(컬럼 기본값 적용까지 끝난 뒤의 값 - Postgres는
-- 컬럼 기본값을 먼저 채운 다음 BEFORE INSERT 트리거를 실행하므로, 사용자가 발주일을 직접 입력했든
-- 비워둬서 기본값(오늘)이 채워졌든 트리거 시점엔 이미 최종 확정된 값이다)를 기준으로 연월을 계산한다.
-- 번호는 연월별로 1부터 다시 시작(예: PO202610-0001) - 월별 카운터 테이블에 INSERT ... ON CONFLICT DO
-- UPDATE로 원자적으로(행 잠금 기반) 증가시켜서 동시 등록에도 번호가 겹치지 않게 한다.
alter table plm_raw_material_purchase_orders alter column order_no drop default;
drop function if exists public.plm_next_purchase_order_no();
drop sequence if exists plm_purchase_order_no_seq;

create table if not exists plm_purchase_order_no_counter (
  year_month text primary key, -- 'YYYYMM'
  last_no int not null default 0
);

comment on table plm_purchase_order_no_counter is '원료 발주번호(PO<YYYYMM>-####) 연월별 채번 카운터. plm_set_purchase_order_no 트리거 전용 내부 테이블.';

alter table plm_purchase_order_no_counter enable row level security;
drop policy if exists "plm_purchase_order_no_counter_read" on plm_purchase_order_no_counter;
create policy "plm_purchase_order_no_counter_read" on plm_purchase_order_no_counter for select to authenticated
  using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
drop policy if exists "plm_purchase_order_no_counter_write" on plm_purchase_order_no_counter;
create policy "plm_purchase_order_no_counter_write" on plm_purchase_order_no_counter for all to authenticated
  using (plm_has_role(array['Admin','Researcher'])) with check (plm_has_role(array['Admin','Researcher']));

create or replace function public.plm_set_purchase_order_no()
returns trigger
language plpgsql
as $function$
declare
  v_ym text;
  v_no int;
begin
  if new.order_no is not null then
    return new; -- 이미 번호가 지정된 경우(데이터 이관 등)는 덮어쓰지 않음
  end if;

  v_ym := to_char(coalesce(new.order_date, current_date), 'YYYYMM');

  insert into plm_purchase_order_no_counter (year_month, last_no)
  values (v_ym, 1)
  on conflict (year_month) do update set last_no = plm_purchase_order_no_counter.last_no + 1
  returning last_no into v_no;

  new.order_no := 'PO' || v_ym || '-' || lpad(v_no::text, 4, '0');
  return new;
end;
$function$;

drop trigger if exists trg_plm_purchase_order_no on plm_raw_material_purchase_orders;
create trigger trg_plm_purchase_order_no
  before insert on plm_raw_material_purchase_orders
  for each row execute function public.plm_set_purchase_order_no();

-- 품목 저장 RPC에 패킹 필드 반영 (21_raw_material_purchase_orders.sql의 plm_save_purchase_order_items 갱신).
create or replace function public.plm_save_purchase_order_items(p_order_id uuid, p_items jsonb)
returns integer
language plpgsql
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  delete from plm_raw_material_purchase_order_items where purchase_order_id = p_order_id;

  insert into plm_raw_material_purchase_order_items
    (purchase_order_id, line_no, raw_code, unit_price, quantity, unit, packing, supply_amount, vat_rate, vat_amount, total_amount, note)
  select
    p_order_id,
    (row_number() over ())::int,
    i->>'raw_code',
    coalesce((i->>'unit_price')::numeric, 0),
    coalesce((i->>'quantity')::numeric, 0),
    nullif(i->>'unit',''),
    nullif(i->>'packing',''),
    coalesce((i->>'supply_amount')::numeric, 0),
    coalesce((i->>'vat_rate')::numeric, 0.1),
    coalesce((i->>'vat_amount')::numeric, 0),
    coalesce((i->>'total_amount')::numeric, 0),
    nullif(i->>'note','')
  from jsonb_array_elements(p_items) as i;

  get diagnostics v_count = row_count;

  update plm_raw_material_purchase_orders set updated_at = now() where id = p_order_id;

  return v_count;
end;
$function$;

-- 이미 등록됐던 테스트성 발주(발주일은 2026-10-01인데 번호가 등록 시각 기준 09월로 잘못 찍혀있던 것)를
-- 새 채번 규칙에 맞게 보정하고, 그 연월의 카운터를 이어서 다음 발주부터 정상적으로 채번되게 한다.
do $$
declare
  v_ym text;
begin
  select to_char(order_date, 'YYYYMM') into v_ym
  from plm_raw_material_purchase_orders
  where order_no = 'PO20260930-0001';

  if v_ym is not null then
    update plm_raw_material_purchase_orders
    set order_no = 'PO' || v_ym || '-0001'
    where order_no = 'PO20260930-0001';

    insert into plm_purchase_order_no_counter (year_month, last_no)
    values (v_ym, 1)
    on conflict (year_month) do update set last_no = greatest(plm_purchase_order_no_counter.last_no, 1);
  end if;
end $$;
