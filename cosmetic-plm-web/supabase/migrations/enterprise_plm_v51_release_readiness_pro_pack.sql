-- Enterprise PLM v5.1 Release Readiness PRO Pack
-- Go / No-Go release readiness engine

create table if not exists public.v51_release_readiness_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  release_score numeric,
  status text,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_v51_release_readiness_runs_formula
on public.v51_release_readiness_runs(formula_code, revision, created_at);

alter table public.v51_release_readiness_runs enable row level security;

drop policy if exists "v51_release_readiness_runs_all" on public.v51_release_readiness_runs;
create policy "v51_release_readiness_runs_all"
on public.v51_release_readiness_runs
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
('V5.1-RELEASE-READINESS-PRO', 'Enterprise PLM v5.1 Release Readiness PRO Pack', 'Adds Korean Go/No-Go release readiness engine based on formula, validation, cost, documents, smart documents, batch and risk status.')
on conflict (release_code) do nothing;
