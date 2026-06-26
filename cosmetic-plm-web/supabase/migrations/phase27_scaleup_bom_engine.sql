-- Phase 27 Scale-Up & BOM Engine Support

create table if not exists public.enterprise_scale_up_batches (
  id text primary key,
  formula_code text,
  batch_size_kg numeric,
  batch_type text,
  status text default 'DRAFT',
  estimated_cost numeric default 0,
  yield_percent numeric default 100,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_bom_items (
  id text primary key,
  batch_id text references public.enterprise_scale_up_batches(id) on delete cascade,
  raw_code text,
  raw_name text,
  percentage numeric,
  required_kg numeric,
  loss_percent numeric,
  purchase_kg numeric,
  unit_price numeric,
  amount numeric,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_manufacturing_steps (
  id text primary key,
  batch_id text references public.enterprise_scale_up_batches(id) on delete cascade,
  step_no integer,
  phase text,
  process text,
  temperature text,
  rpm text,
  time_min integer,
  qc_check text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_scale_up_risks (
  id text primary key,
  batch_id text,
  category text,
  risk text,
  level text,
  action text,
  created_at timestamptz default now()
);

create index if not exists idx_scale_up_batches_formula on public.enterprise_scale_up_batches(formula_code);
create index if not exists idx_bom_items_batch on public.enterprise_bom_items(batch_id);
create index if not exists idx_manufacturing_steps_batch on public.enterprise_manufacturing_steps(batch_id);
create index if not exists idx_scale_up_risks_batch on public.enterprise_scale_up_risks(batch_id);

alter table public.enterprise_scale_up_batches enable row level security;
alter table public.enterprise_bom_items enable row level security;
alter table public.enterprise_manufacturing_steps enable row level security;
alter table public.enterprise_scale_up_risks enable row level security;

drop policy if exists "scale_up_batches_all" on public.enterprise_scale_up_batches;
create policy "scale_up_batches_all" on public.enterprise_scale_up_batches for all to authenticated using (true) with check (true);

drop policy if exists "bom_items_all" on public.enterprise_bom_items;
create policy "bom_items_all" on public.enterprise_bom_items for all to authenticated using (true) with check (true);

drop policy if exists "manufacturing_steps_all" on public.enterprise_manufacturing_steps;
create policy "manufacturing_steps_all" on public.enterprise_manufacturing_steps for all to authenticated using (true) with check (true);

drop policy if exists "scale_up_risks_all" on public.enterprise_scale_up_risks;
create policy "scale_up_risks_all" on public.enterprise_scale_up_risks for all to authenticated using (true) with check (true);
