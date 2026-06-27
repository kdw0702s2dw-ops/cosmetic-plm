-- Enterprise PLM v3.0 GOLD MASTER Pack 03-B
-- Document Workflow & Export

create table if not exists public.gold_document_workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  document_code text not null,
  formula_code text not null,
  revision text not null,
  document_type text not null,
  current_step text not null default 'QA',
  status text not null default 'REVIEW',
  assignee text,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gold_document_export_logs (
  id uuid primary key default gen_random_uuid(),
  document_code text not null,
  export_format text not null,
  file_name text not null,
  exported_by text,
  created_at timestamptz default now()
);

create index if not exists idx_gold_document_workflow_tasks_doc
on public.gold_document_workflow_tasks(document_code, status, current_step);

create index if not exists idx_gold_document_export_logs_doc
on public.gold_document_export_logs(document_code, created_at);

alter table public.gold_document_workflow_tasks enable row level security;
alter table public.gold_document_export_logs enable row level security;

drop policy if exists "gold_document_workflow_tasks_all" on public.gold_document_workflow_tasks;
create policy "gold_document_workflow_tasks_all"
on public.gold_document_workflow_tasks
for all to authenticated
using (true)
with check (true);

drop policy if exists "gold_document_export_logs_all" on public.gold_document_export_logs;
create policy "gold_document_export_logs_all"
on public.gold_document_export_logs
for all to authenticated
using (true)
with check (true);
