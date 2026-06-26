-- Phase 26 Formula Simulation Engine Support

create table if not exists public.enterprise_formula_simulations (
  id uuid primary key default gen_random_uuid(),
  formula_code text,
  batch_kg numeric,
  target_cost_per_kg numeric,
  target_ph numeric,
  target_viscosity numeric,
  market_country text,
  predicted_cost_per_kg numeric,
  predicted_ph numeric,
  predicted_viscosity numeric,
  stability_score numeric,
  regulation_score numeric,
  total_score numeric,
  risk_level text,
  recommendation text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_material_substitutions (
  id uuid primary key default gen_random_uuid(),
  formula_code text,
  source_raw text,
  source_inci text,
  substitute_raw text,
  substitute_inci text,
  reason text,
  expected_effect text,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_formula_optimizations (
  id uuid primary key default gen_random_uuid(),
  formula_code text,
  area text,
  suggestion text,
  expected_impact text,
  priority text,
  created_at timestamptz default now()
);

create index if not exists idx_formula_simulations_formula on public.enterprise_formula_simulations(formula_code);
create index if not exists idx_formula_simulations_risk on public.enterprise_formula_simulations(risk_level);
create index if not exists idx_material_substitutions_formula on public.enterprise_material_substitutions(formula_code);
create index if not exists idx_formula_optimizations_formula on public.enterprise_formula_optimizations(formula_code);

alter table public.enterprise_formula_simulations enable row level security;
alter table public.enterprise_material_substitutions enable row level security;
alter table public.enterprise_formula_optimizations enable row level security;

drop policy if exists "formula_simulations_all" on public.enterprise_formula_simulations;
create policy "formula_simulations_all" on public.enterprise_formula_simulations for all to authenticated using (true) with check (true);

drop policy if exists "material_substitutions_all" on public.enterprise_material_substitutions;
create policy "material_substitutions_all" on public.enterprise_material_substitutions for all to authenticated using (true) with check (true);

drop policy if exists "formula_optimizations_all" on public.enterprise_formula_optimizations;
create policy "formula_optimizations_all" on public.enterprise_formula_optimizations for all to authenticated using (true) with check (true);
