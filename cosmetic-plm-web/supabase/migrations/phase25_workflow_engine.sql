-- Phase 25 Enterprise Workflow Engine Support

create table if not exists public.enterprise_workflow_templates (
  id text primary key,
  workflow_name text not null,
  trigger_module text,
  status text default 'DRAFT',
  owner_team text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_workflow_steps (
  id text primary key,
  workflow_id text references public.enterprise_workflow_templates(id) on delete cascade,
  step_no integer not null,
  step_name text not null,
  owner_team text,
  action_type text,
  due_days integer default 1,
  required boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_workflow_runs (
  id text primary key,
  workflow_id text references public.enterprise_workflow_templates(id),
  target text,
  current_step text,
  status text default 'NOT_STARTED',
  progress numeric default 0,
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_workflow_tasks (
  id text primary key,
  run_id text references public.enterprise_workflow_runs(id) on delete cascade,
  task_name text not null,
  owner_team text,
  status text default 'TODO',
  due_date date,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workflow_steps_workflow on public.enterprise_workflow_steps(workflow_id, step_no);
create index if not exists idx_workflow_runs_status on public.enterprise_workflow_runs(status);
create index if not exists idx_workflow_tasks_run_status on public.enterprise_workflow_tasks(run_id, status);
create index if not exists idx_workflow_tasks_owner_due on public.enterprise_workflow_tasks(owner_team, due_date);

alter table public.enterprise_workflow_templates enable row level security;
alter table public.enterprise_workflow_steps enable row level security;
alter table public.enterprise_workflow_runs enable row level security;
alter table public.enterprise_workflow_tasks enable row level security;

drop policy if exists "workflow_templates_all" on public.enterprise_workflow_templates;
create policy "workflow_templates_all" on public.enterprise_workflow_templates for all to authenticated using (true) with check (true);

drop policy if exists "workflow_steps_all" on public.enterprise_workflow_steps;
create policy "workflow_steps_all" on public.enterprise_workflow_steps for all to authenticated using (true) with check (true);

drop policy if exists "workflow_runs_all" on public.enterprise_workflow_runs;
create policy "workflow_runs_all" on public.enterprise_workflow_runs for all to authenticated using (true) with check (true);

drop policy if exists "workflow_tasks_all" on public.enterprise_workflow_tasks;
create policy "workflow_tasks_all" on public.enterprise_workflow_tasks for all to authenticated using (true) with check (true);
