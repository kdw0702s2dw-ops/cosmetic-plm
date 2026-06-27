-- Enterprise PLM v5.1 Smart Formula Engine Pack

create table if not exists public.v51_smart_formula_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  target_countries text[] default array['KR','EU','CN','US','JP'],
  total_percent numeric,
  estimated_cost_per_kg numeric,
  estimated_ph numeric,
  estimated_viscosity_cps numeric,
  formula_score numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_v51_smart_formula_runs_formula
on public.v51_smart_formula_runs(formula_code, revision, created_at);

alter table public.v51_smart_formula_runs enable row level security;

drop policy if exists "v51_smart_formula_runs_all" on public.v51_smart_formula_runs;
create policy "v51_smart_formula_runs_all"
on public.v51_smart_formula_runs
for all to authenticated
using (true)
with check (true);

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.enterprise_release_markers enable row level security;

drop policy if exists "enterprise_release_markers_all" on public.enterprise_release_markers;
create policy "enterprise_release_markers_all"
on public.enterprise_release_markers
for all to authenticated
using (true)
with check (true);

insert into public.enterprise_release_markers
(release_code, title, description)
values
('V5.1-SMART-FORMULA-ENGINE', 'Enterprise PLM v5.1 Smart Formula Engine Pack', 'Realtime formula calculation engine for total, cost, pH, viscosity, INCI, batch quantity, regulation risk and formula score. MES and ERP integrations intentionally excluded.')
on conflict (release_code) do nothing;
