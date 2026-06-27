-- Enterprise PLM v3.0 GOLD MASTER Pack 04-A
-- AI Copilot Complete

create table if not exists public.gold_ai_copilot_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique,
  formula_code text not null,
  revision text not null,
  command_type text not null,
  user_prompt text not null,
  status text not null default 'READY',
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gold_ai_copilot_actions (
  id uuid primary key default gen_random_uuid(),
  run_code text not null,
  formula_code text not null,
  revision text not null,
  action_category text not null,
  priority text not null default 'P2',
  message text not null,
  suggested_action text not null,
  status text not null default 'OPEN',
  created_at timestamptz default now()
);

create index if not exists idx_gold_ai_copilot_runs_formula
on public.gold_ai_copilot_runs(formula_code, revision, created_at);

create index if not exists idx_gold_ai_copilot_actions_run
on public.gold_ai_copilot_actions(run_code, priority, status);

alter table public.gold_ai_copilot_runs enable row level security;
alter table public.gold_ai_copilot_actions enable row level security;

drop policy if exists "gold_ai_copilot_runs_all" on public.gold_ai_copilot_runs;
create policy "gold_ai_copilot_runs_all"
on public.gold_ai_copilot_runs
for all to authenticated
using (true)
with check (true);

drop policy if exists "gold_ai_copilot_actions_all" on public.gold_ai_copilot_actions;
create policy "gold_ai_copilot_actions_all"
on public.gold_ai_copilot_actions
for all to authenticated
using (true)
with check (true);
