-- Enterprise PLM v6.0 Cosmetic Intelligence Suite
-- MES/ERP integrations intentionally excluded.

create table if not exists public.v60_cosmetic_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  intelligence_score numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v60_formula_compare_runs (
  id uuid primary key default gen_random_uuid(),
  base_formula_code text,
  base_revision text,
  target_formula_code text,
  target_revision text,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v60_compatibility_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  status text,
  score numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v60_cost_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  base_cost numeric,
  simulated_cost numeric,
  margin_rate numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v60_ai_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  prompt text,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

alter table public.v60_cosmetic_intelligence_runs enable row level security;
alter table public.v60_formula_compare_runs enable row level security;
alter table public.v60_compatibility_runs enable row level security;
alter table public.v60_cost_simulation_runs enable row level security;
alter table public.v60_ai_recommendation_runs enable row level security;

drop policy if exists "v60_cosmetic_intelligence_runs_all" on public.v60_cosmetic_intelligence_runs;
create policy "v60_cosmetic_intelligence_runs_all" on public.v60_cosmetic_intelligence_runs for all to authenticated using (true) with check (true);

drop policy if exists "v60_formula_compare_runs_all" on public.v60_formula_compare_runs;
create policy "v60_formula_compare_runs_all" on public.v60_formula_compare_runs for all to authenticated using (true) with check (true);

drop policy if exists "v60_compatibility_runs_all" on public.v60_compatibility_runs;
create policy "v60_compatibility_runs_all" on public.v60_compatibility_runs for all to authenticated using (true) with check (true);

drop policy if exists "v60_cost_simulation_runs_all" on public.v60_cost_simulation_runs;
create policy "v60_cost_simulation_runs_all" on public.v60_cost_simulation_runs for all to authenticated using (true) with check (true);

drop policy if exists "v60_ai_recommendation_runs_all" on public.v60_ai_recommendation_runs;
create policy "v60_ai_recommendation_runs_all" on public.v60_ai_recommendation_runs for all to authenticated using (true) with check (true);

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
('V6.0-COSMETIC-INTELLIGENCE-SUITE', 'Enterprise PLM v6.0 Cosmetic Intelligence Suite', 'Adds formula intelligence, compare, compatibility, cost simulation and AI recommendation suite. MES/ERP integrations excluded.')
on conflict (release_code) do nothing;
