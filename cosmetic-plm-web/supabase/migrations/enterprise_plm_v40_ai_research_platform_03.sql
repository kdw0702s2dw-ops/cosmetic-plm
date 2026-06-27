-- Enterprise PLM v4.0 AI Research Platform Pack 03
-- AI Autopilot Workflow

create table if not exists public.v40_ai_autopilot_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique,
  title text not null,
  request_text text not null,
  target_product_type text,
  target_claim text,
  target_cost_per_kg numeric,
  target_country text,
  generated_formula_code text,
  generated_revision text,
  status text not null default 'READY',
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.v40_ai_autopilot_steps (
  id uuid primary key default gen_random_uuid(),
  run_code text not null,
  step_no integer not null,
  step_key text not null,
  step_name text not null,
  status text not null default 'TODO',
  message text,
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_v40_ai_autopilot_runs_code
on public.v40_ai_autopilot_runs(run_code, status, created_at);

create index if not exists idx_v40_ai_autopilot_steps_run
on public.v40_ai_autopilot_steps(run_code, step_no, status);

alter table public.v40_ai_autopilot_runs enable row level security;
alter table public.v40_ai_autopilot_steps enable row level security;

drop policy if exists "v40_ai_autopilot_runs_all" on public.v40_ai_autopilot_runs;
create policy "v40_ai_autopilot_runs_all"
on public.v40_ai_autopilot_runs
for all to authenticated
using (true)
with check (true);

drop policy if exists "v40_ai_autopilot_steps_all" on public.v40_ai_autopilot_steps;
create policy "v40_ai_autopilot_steps_all"
on public.v40_ai_autopilot_steps
for all to authenticated
using (true)
with check (true);
