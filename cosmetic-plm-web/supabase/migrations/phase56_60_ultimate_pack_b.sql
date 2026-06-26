-- Phase 56~60 Ultimate Pack B Support

create table if not exists public.enterprise_autonomous_agents (
  id text primary key,
  agent_name text,
  role text,
  objective text,
  status text,
  autonomy_level integer,
  last_result text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_autonomous_formula_runs (
  id text primary key,
  run_name text,
  target_brief text,
  generated_formula text,
  validation_status text,
  ai_score numeric,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_smart_factory_iot (
  id text primary key,
  equipment text,
  sensor_type text,
  current_value text,
  normal_range text,
  status text,
  prediction text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_optimization_runs (
  id text primary key,
  optimization_area text,
  before_value text,
  after_value text,
  improvement text,
  confidence numeric,
  action_required text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_self_driving_plm_tasks (
  id text primary key,
  task_chain text,
  trigger text,
  current_step text,
  progress numeric,
  status text,
  human_approval_required boolean default true,
  created_at timestamptz default now()
);

alter table public.enterprise_autonomous_agents enable row level security;
alter table public.enterprise_autonomous_formula_runs enable row level security;
alter table public.enterprise_smart_factory_iot enable row level security;
alter table public.enterprise_ai_optimization_runs enable row level security;
alter table public.enterprise_self_driving_plm_tasks enable row level security;

drop policy if exists "autonomous_agents_all" on public.enterprise_autonomous_agents;
create policy "autonomous_agents_all" on public.enterprise_autonomous_agents for all to authenticated using (true) with check (true);

drop policy if exists "autonomous_formula_runs_all" on public.enterprise_autonomous_formula_runs;
create policy "autonomous_formula_runs_all" on public.enterprise_autonomous_formula_runs for all to authenticated using (true) with check (true);

drop policy if exists "smart_factory_iot_all" on public.enterprise_smart_factory_iot;
create policy "smart_factory_iot_all" on public.enterprise_smart_factory_iot for all to authenticated using (true) with check (true);

drop policy if exists "ai_optimization_runs_all" on public.enterprise_ai_optimization_runs;
create policy "ai_optimization_runs_all" on public.enterprise_ai_optimization_runs for all to authenticated using (true) with check (true);

drop policy if exists "self_driving_plm_tasks_all" on public.enterprise_self_driving_plm_tasks;
create policy "self_driving_plm_tasks_all" on public.enterprise_self_driving_plm_tasks for all to authenticated using (true) with check (true);
