-- Enterprise PLM v3.0 GOLD MASTER Pack 02-C2
-- Formula Cost Engine

create table if not exists public.gold_formula_cost_summaries (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  total_cost_per_kg numeric not null default 0,
  cost_10kg numeric not null default 0,
  cost_100kg numeric not null default 0,
  cost_500kg numeric not null default 0,
  cost_1000kg numeric not null default 0,
  target_cost_per_kg numeric,
  gap_per_kg numeric,
  status text not null default 'GOOD',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision)
);

create table if not exists public.gold_formula_cost_lines (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  line_no integer not null,
  phase text,
  raw_code text,
  raw_name text,
  inci_en text,
  percentage numeric not null default 0,
  unit_price numeric,
  cost_per_kg numeric not null default 0,
  cost_contribution_percent numeric not null default 0,
  status text not null default 'GOOD',
  created_at timestamptz default now()
);

create table if not exists public.gold_formula_cost_optimization (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  raw_code text,
  raw_name text,
  current_cost_per_kg numeric not null default 0,
  recommendation text,
  expected_saving_per_kg numeric not null default 0,
  priority text not null default 'P2',
  created_at timestamptz default now()
);

create index if not exists idx_gold_formula_cost_summary_formula
on public.gold_formula_cost_summaries(formula_code, revision);

create index if not exists idx_gold_formula_cost_lines_formula
on public.gold_formula_cost_lines(formula_code, revision, cost_per_kg);

create index if not exists idx_gold_formula_cost_optimization_formula
on public.gold_formula_cost_optimization(formula_code, revision, expected_saving_per_kg);

alter table public.gold_formula_cost_summaries enable row level security;
alter table public.gold_formula_cost_lines enable row level security;
alter table public.gold_formula_cost_optimization enable row level security;

drop policy if exists "gold_formula_cost_summaries_all" on public.gold_formula_cost_summaries;
create policy "gold_formula_cost_summaries_all" on public.gold_formula_cost_summaries for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_cost_lines_all" on public.gold_formula_cost_lines;
create policy "gold_formula_cost_lines_all" on public.gold_formula_cost_lines for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_cost_optimization_all" on public.gold_formula_cost_optimization;
create policy "gold_formula_cost_optimization_all" on public.gold_formula_cost_optimization for all to authenticated using (true) with check (true);
