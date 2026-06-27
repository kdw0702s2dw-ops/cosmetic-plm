-- Enterprise PLM v3.0 GOLD MASTER Pack 02-C1
-- Formula Validation Engine

create table if not exists public.gold_formula_validation_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  total_percent numeric not null default 0,
  validation_status text not null default 'WATCH',
  issue_count integer not null default 0,
  blocker_count integer not null default 0,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.gold_formula_validation_issues (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.gold_formula_validation_runs(id) on delete cascade,
  formula_code text not null,
  revision text not null,
  issue_type text not null,
  severity text not null,
  message text not null,
  action text not null,
  raw_code text,
  line_no integer,
  created_at timestamptz default now()
);

create index if not exists idx_gold_formula_validation_runs_formula
on public.gold_formula_validation_runs(formula_code, revision, created_at);

create index if not exists idx_gold_formula_validation_issues_run
on public.gold_formula_validation_issues(run_id, severity, issue_type);

alter table public.gold_formula_validation_runs enable row level security;
alter table public.gold_formula_validation_issues enable row level security;

drop policy if exists "gold_formula_validation_runs_all" on public.gold_formula_validation_runs;
create policy "gold_formula_validation_runs_all"
on public.gold_formula_validation_runs
for all to authenticated
using (true)
with check (true);

drop policy if exists "gold_formula_validation_issues_all" on public.gold_formula_validation_issues;
create policy "gold_formula_validation_issues_all"
on public.gold_formula_validation_issues
for all to authenticated
using (true)
with check (true);
