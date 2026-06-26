-- AI Brain Real Data Pack Support

create table if not exists public.enterprise_ai_brain_advisors (
  id text primary key,
  advisor text,
  title text,
  score numeric,
  risk_level text,
  recommendation text,
  action_owner text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_brain_actions (
  id text primary key,
  action_type text,
  task text,
  priority text,
  owner text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_brain_summaries (
  id text primary key,
  summary_type text,
  headline text,
  summary text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_brain_runs (
  id uuid primary key default gen_random_uuid(),
  prompt text,
  formula_code text,
  launch_score numeric,
  launch_decision text,
  risk_count integer,
  action_count integer,
  created_at timestamptz default now()
);

create index if not exists idx_ai_brain_advisors_type on public.enterprise_ai_brain_advisors(advisor, risk_level);
create index if not exists idx_ai_brain_actions_status on public.enterprise_ai_brain_actions(priority, status);
create index if not exists idx_ai_brain_runs_formula on public.enterprise_ai_brain_runs(formula_code, created_at);

alter table public.enterprise_ai_brain_advisors enable row level security;
alter table public.enterprise_ai_brain_actions enable row level security;
alter table public.enterprise_ai_brain_summaries enable row level security;
alter table public.enterprise_ai_brain_runs enable row level security;

drop policy if exists "ai_brain_advisors_all" on public.enterprise_ai_brain_advisors;
create policy "ai_brain_advisors_all" on public.enterprise_ai_brain_advisors for all to authenticated using (true) with check (true);

drop policy if exists "ai_brain_actions_all" on public.enterprise_ai_brain_actions;
create policy "ai_brain_actions_all" on public.enterprise_ai_brain_actions for all to authenticated using (true) with check (true);

drop policy if exists "ai_brain_summaries_all" on public.enterprise_ai_brain_summaries;
create policy "ai_brain_summaries_all" on public.enterprise_ai_brain_summaries for all to authenticated using (true) with check (true);

drop policy if exists "ai_brain_runs_all" on public.enterprise_ai_brain_runs;
create policy "ai_brain_runs_all" on public.enterprise_ai_brain_runs for all to authenticated using (true) with check (true);
