-- Phase 30 MES Bridge Support

create table if not exists public.enterprise_mes_work_orders (
  id text primary key,
  work_order_no text unique not null,
  formula_code text,
  batch_id text,
  production_qty_kg numeric,
  status text default 'PLANNED',
  planned_date date default current_date,
  line text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_mes_lots (
  id text primary key,
  lot_no text,
  work_order_id text references public.enterprise_mes_work_orders(id) on delete cascade,
  raw_code text,
  raw_lot_no text,
  required_kg numeric,
  consumed_kg numeric default 0,
  status text default 'RESERVED',
  created_at timestamptz default now()
);

create table if not exists public.enterprise_mes_process_logs (
  id text primary key,
  work_order_id text references public.enterprise_mes_work_orders(id) on delete cascade,
  step_no integer,
  process_name text,
  start_time text,
  end_time text,
  operator text,
  status text default 'WAITING',
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_mes_deviations (
  id text primary key,
  work_order_id text references public.enterprise_mes_work_orders(id) on delete cascade,
  severity text,
  deviation text,
  status text default 'OPEN',
  action text,
  created_at timestamptz default now()
);

create index if not exists idx_mes_work_orders_formula on public.enterprise_mes_work_orders(formula_code);
create index if not exists idx_mes_work_orders_status on public.enterprise_mes_work_orders(status);
create index if not exists idx_mes_lots_work_order on public.enterprise_mes_lots(work_order_id);
create index if not exists idx_mes_process_logs_work_order on public.enterprise_mes_process_logs(work_order_id);
create index if not exists idx_mes_deviations_work_order on public.enterprise_mes_deviations(work_order_id);

alter table public.enterprise_mes_work_orders enable row level security;
alter table public.enterprise_mes_lots enable row level security;
alter table public.enterprise_mes_process_logs enable row level security;
alter table public.enterprise_mes_deviations enable row level security;

drop policy if exists "mes_work_orders_all" on public.enterprise_mes_work_orders;
create policy "mes_work_orders_all" on public.enterprise_mes_work_orders for all to authenticated using (true) with check (true);

drop policy if exists "mes_lots_all" on public.enterprise_mes_lots;
create policy "mes_lots_all" on public.enterprise_mes_lots for all to authenticated using (true) with check (true);

drop policy if exists "mes_process_logs_all" on public.enterprise_mes_process_logs;
create policy "mes_process_logs_all" on public.enterprise_mes_process_logs for all to authenticated using (true) with check (true);

drop policy if exists "mes_deviations_all" on public.enterprise_mes_deviations;
create policy "mes_deviations_all" on public.enterprise_mes_deviations for all to authenticated using (true) with check (true);
