-- Final Sprint A+B: Live CRUD + AI Copilot Support

create table if not exists public.enterprise_live_crud_endpoints (
  id text primary key,
  module text,
  table_name text,
  operations text,
  status text,
  realtime boolean default false,
  audit_enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_live_crud_operation_logs (
  id text primary key,
  module text,
  operation text,
  target text,
  result text,
  message text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_copilot_commands (
  id text primary key,
  command text,
  intent text,
  output text,
  confidence numeric,
  execution_status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_copilot_workflows (
  id text primary key,
  step_order integer,
  step_name text,
  module text,
  status text,
  result_summary text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_final_sprint_metrics (
  id text primary key,
  area text,
  metric text,
  value text,
  status text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_audit_events (
  id text primary key,
  module text,
  operation text,
  target text,
  user_email text,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_live_crud_endpoints_module on public.enterprise_live_crud_endpoints(module, status);
create index if not exists idx_live_crud_operation_logs_module on public.enterprise_live_crud_operation_logs(module, operation, created_at);
create index if not exists idx_ai_copilot_commands_intent on public.enterprise_ai_copilot_commands(intent, execution_status);
create index if not exists idx_ai_copilot_workflows_order on public.enterprise_ai_copilot_workflows(step_order, status);
create index if not exists idx_enterprise_audit_events_module on public.enterprise_audit_events(module, operation, created_at);

alter table public.enterprise_live_crud_endpoints enable row level security;
alter table public.enterprise_live_crud_operation_logs enable row level security;
alter table public.enterprise_ai_copilot_commands enable row level security;
alter table public.enterprise_ai_copilot_workflows enable row level security;
alter table public.enterprise_final_sprint_metrics enable row level security;
alter table public.enterprise_audit_events enable row level security;

drop policy if exists "live_crud_endpoints_all" on public.enterprise_live_crud_endpoints;
create policy "live_crud_endpoints_all" on public.enterprise_live_crud_endpoints for all to authenticated using (true) with check (true);

drop policy if exists "live_crud_operation_logs_all" on public.enterprise_live_crud_operation_logs;
create policy "live_crud_operation_logs_all" on public.enterprise_live_crud_operation_logs for all to authenticated using (true) with check (true);

drop policy if exists "ai_copilot_commands_all" on public.enterprise_ai_copilot_commands;
create policy "ai_copilot_commands_all" on public.enterprise_ai_copilot_commands for all to authenticated using (true) with check (true);

drop policy if exists "ai_copilot_workflows_all" on public.enterprise_ai_copilot_workflows;
create policy "ai_copilot_workflows_all" on public.enterprise_ai_copilot_workflows for all to authenticated using (true) with check (true);

drop policy if exists "final_sprint_metrics_all" on public.enterprise_final_sprint_metrics;
create policy "final_sprint_metrics_all" on public.enterprise_final_sprint_metrics for all to authenticated using (true) with check (true);

drop policy if exists "audit_events_all" on public.enterprise_audit_events;
create policy "audit_events_all" on public.enterprise_audit_events for all to authenticated using (true) with check (true);
