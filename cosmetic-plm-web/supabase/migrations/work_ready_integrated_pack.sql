-- Work Ready Integrated Pack Support

create table if not exists public.enterprise_master_data_connectors (
  id text primary key,
  data_domain text,
  source_name text,
  sync_status text,
  record_count integer,
  quality_score numeric,
  next_action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_brain_scenarios (
  id text primary key,
  user_request text,
  ai_workflow text,
  output_type text,
  confidence numeric,
  review_status text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_document_automations (
  id text primary key,
  document_type text,
  source_module text,
  status text,
  owner text,
  file_name text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_plm_chatbot_logs (
  id text primary key,
  question text,
  answer_summary text,
  related_modules text,
  action_created text,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_code_quality_checks (
  id text primary key,
  area text,
  issue text,
  status text,
  action text,
  created_at timestamptz default now()
);

alter table public.enterprise_master_data_connectors enable row level security;
alter table public.enterprise_ai_brain_scenarios enable row level security;
alter table public.enterprise_document_automations enable row level security;
alter table public.enterprise_plm_chatbot_logs enable row level security;
alter table public.enterprise_code_quality_checks enable row level security;

drop policy if exists "master_data_connectors_all" on public.enterprise_master_data_connectors;
create policy "master_data_connectors_all" on public.enterprise_master_data_connectors for all to authenticated using (true) with check (true);

drop policy if exists "ai_brain_scenarios_all" on public.enterprise_ai_brain_scenarios;
create policy "ai_brain_scenarios_all" on public.enterprise_ai_brain_scenarios for all to authenticated using (true) with check (true);

drop policy if exists "document_automations_all" on public.enterprise_document_automations;
create policy "document_automations_all" on public.enterprise_document_automations for all to authenticated using (true) with check (true);

drop policy if exists "plm_chatbot_logs_all" on public.enterprise_plm_chatbot_logs;
create policy "plm_chatbot_logs_all" on public.enterprise_plm_chatbot_logs for all to authenticated using (true) with check (true);

drop policy if exists "code_quality_checks_all" on public.enterprise_code_quality_checks;
create policy "code_quality_checks_all" on public.enterprise_code_quality_checks for all to authenticated using (true) with check (true);
