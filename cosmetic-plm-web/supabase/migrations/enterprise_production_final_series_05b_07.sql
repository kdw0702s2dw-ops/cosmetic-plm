-- Enterprise Production Final Series Pack 05-B ~ 07
-- MES Lite / Sample Pilot / Executive Command / Final Hub

create table if not exists public.gold_manufacturing_batches (
  id uuid primary key default gen_random_uuid(),
  batch_no text not null unique,
  formula_code text not null,
  revision text not null,
  batch_size_kg numeric not null default 100,
  status text not null default 'PLANNED',
  operator_name text,
  equipment text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.gold_manufacturing_materials (
  id uuid primary key default gen_random_uuid(),
  batch_no text not null,
  line_no integer not null,
  phase text,
  raw_code text not null,
  raw_name text,
  percentage numeric not null default 0,
  required_kg numeric not null default 0,
  checked boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.gold_manufacturing_steps (
  id uuid primary key default gen_random_uuid(),
  batch_no text not null,
  step_no integer not null,
  step_name text not null,
  instruction text not null,
  status text not null default 'TODO',
  created_at timestamptz default now()
);

create table if not exists public.gold_sample_requests (
  id uuid primary key default gen_random_uuid(),
  sample_code text not null unique,
  formula_code text not null,
  revision text not null,
  customer text,
  purpose text,
  due_date date,
  status text not null default 'REQUESTED',
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_gold_manufacturing_batches_status on public.gold_manufacturing_batches(batch_no, status, formula_code);
create index if not exists idx_gold_manufacturing_materials_batch on public.gold_manufacturing_materials(batch_no, line_no);
create index if not exists idx_gold_manufacturing_steps_batch on public.gold_manufacturing_steps(batch_no, step_no);
create index if not exists idx_gold_sample_requests_status on public.gold_sample_requests(sample_code, status, formula_code);

alter table public.gold_manufacturing_batches enable row level security;
alter table public.gold_manufacturing_materials enable row level security;
alter table public.gold_manufacturing_steps enable row level security;
alter table public.gold_sample_requests enable row level security;

drop policy if exists "gold_manufacturing_batches_all" on public.gold_manufacturing_batches;
create policy "gold_manufacturing_batches_all" on public.gold_manufacturing_batches for all to authenticated using (true) with check (true);

drop policy if exists "gold_manufacturing_materials_all" on public.gold_manufacturing_materials;
create policy "gold_manufacturing_materials_all" on public.gold_manufacturing_materials for all to authenticated using (true) with check (true);

drop policy if exists "gold_manufacturing_steps_all" on public.gold_manufacturing_steps;
create policy "gold_manufacturing_steps_all" on public.gold_manufacturing_steps for all to authenticated using (true) with check (true);

drop policy if exists "gold_sample_requests_all" on public.gold_sample_requests;
create policy "gold_sample_requests_all" on public.gold_sample_requests for all to authenticated using (true) with check (true);
