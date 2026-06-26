-- Phase 36~40 Enterprise AI/QMS Integrated Package Support

create table if not exists public.enterprise_ai_copilot_actions (
  id text primary key,
  command text,
  module_chain text,
  status text,
  result_summary text,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_qms_processes (
  id text primary key,
  process text,
  source_module text,
  status text,
  owner text,
  due_date date,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_dms_documents (
  id text primary key,
  document_no text unique,
  document_type text,
  title text,
  version text,
  status text,
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_validation_protocols (
  id text primary key,
  protocol_no text unique,
  validation_type text,
  target_system text,
  status text,
  result text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_knowledge_graph (
  id text primary key,
  node text,
  node_type text,
  connected_to text,
  relationship text,
  confidence numeric,
  created_at timestamptz default now()
);

alter table public.enterprise_ai_copilot_actions enable row level security;
alter table public.enterprise_qms_processes enable row level security;
alter table public.enterprise_dms_documents enable row level security;
alter table public.enterprise_validation_protocols enable row level security;
alter table public.enterprise_knowledge_graph enable row level security;

drop policy if exists "ai_copilot_actions_all" on public.enterprise_ai_copilot_actions;
create policy "ai_copilot_actions_all" on public.enterprise_ai_copilot_actions for all to authenticated using (true) with check (true);

drop policy if exists "qms_processes_all" on public.enterprise_qms_processes;
create policy "qms_processes_all" on public.enterprise_qms_processes for all to authenticated using (true) with check (true);

drop policy if exists "dms_documents_all" on public.enterprise_dms_documents;
create policy "dms_documents_all" on public.enterprise_dms_documents for all to authenticated using (true) with check (true);

drop policy if exists "validation_protocols_all" on public.enterprise_validation_protocols;
create policy "validation_protocols_all" on public.enterprise_validation_protocols for all to authenticated using (true) with check (true);

drop policy if exists "knowledge_graph_all" on public.enterprise_knowledge_graph;
create policy "knowledge_graph_all" on public.enterprise_knowledge_graph for all to authenticated using (true) with check (true);
