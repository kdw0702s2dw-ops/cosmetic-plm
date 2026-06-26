-- Formula Live Calculation Pack Support

create table if not exists public.enterprise_formula_calculation_results (
  id text primary key,
  formula_code text,
  total_percent numeric,
  cost_per_kg numeric,
  batch_kg numeric,
  total_required_kg numeric,
  validation_status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_formula_breakdown_results (
  id text primary key,
  formula_code text,
  raw_code text,
  raw_name text,
  inci_en text,
  inci_kr text,
  raw_percentage numeric,
  composition_ratio numeric,
  final_content numeric,
  display_order integer,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_formula_ingredient_list_results (
  id text primary key,
  formula_code text,
  inci_en text,
  inci_kr text,
  final_content numeric,
  display_order integer,
  regulation_status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_formula_validation_results (
  id text primary key,
  formula_code text,
  check_item text,
  result text,
  message text,
  action text,
  created_at timestamptz default now()
);

create index if not exists idx_formula_calculation_results_code on public.enterprise_formula_calculation_results(formula_code);
create index if not exists idx_formula_breakdown_results_code on public.enterprise_formula_breakdown_results(formula_code);
create index if not exists idx_formula_ingredient_list_results_code on public.enterprise_formula_ingredient_list_results(formula_code);

alter table public.enterprise_formula_calculation_results enable row level security;
alter table public.enterprise_formula_breakdown_results enable row level security;
alter table public.enterprise_formula_ingredient_list_results enable row level security;
alter table public.enterprise_formula_validation_results enable row level security;

drop policy if exists "formula_calculation_results_all" on public.enterprise_formula_calculation_results;
create policy "formula_calculation_results_all" on public.enterprise_formula_calculation_results for all to authenticated using (true) with check (true);

drop policy if exists "formula_breakdown_results_all" on public.enterprise_formula_breakdown_results;
create policy "formula_breakdown_results_all" on public.enterprise_formula_breakdown_results for all to authenticated using (true) with check (true);

drop policy if exists "formula_ingredient_list_results_all" on public.enterprise_formula_ingredient_list_results;
create policy "formula_ingredient_list_results_all" on public.enterprise_formula_ingredient_list_results for all to authenticated using (true) with check (true);

drop policy if exists "formula_validation_results_all" on public.enterprise_formula_validation_results;
create policy "formula_validation_results_all" on public.enterprise_formula_validation_results for all to authenticated using (true) with check (true);
