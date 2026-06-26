-- Phase 46~50 Ultimate Pack A Support

create table if not exists public.enterprise_ai_research_projects (
  id text primary key,
  request text,
  target_market text,
  product_type text,
  status text,
  opportunity_score numeric,
  summary text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_formula_candidates (
  id text primary key,
  research_id text,
  candidate_name text,
  formula_concept text,
  target_cost numeric,
  predicted_stability numeric,
  predicted_regulation numeric,
  launch_score numeric,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_knowledge_engine_links (
  id text primary key,
  source_node text,
  source_type text,
  target_node text,
  target_type text,
  relationship text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_digital_factory_simulations (
  id text primary key,
  scenario_name text,
  batch_kg numeric,
  tank_type text,
  mix_time_min integer,
  filling_time_min integer,
  expected_yield numeric,
  expected_loss_kg numeric,
  risk_level text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_data_lake_records (
  id text primary key,
  source_system text,
  dataset text,
  record_count integer,
  freshness text,
  data_quality text,
  ai_ready boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_decision_center (
  id text primary key,
  decision_area text,
  kpi text,
  current_value text,
  ai_risk text,
  ai_recommendation text,
  decision_status text,
  created_at timestamptz default now()
);

alter table public.enterprise_ai_research_projects enable row level security;
alter table public.enterprise_ai_formula_candidates enable row level security;
alter table public.enterprise_knowledge_engine_links enable row level security;
alter table public.enterprise_digital_factory_simulations enable row level security;
alter table public.enterprise_data_lake_records enable row level security;
alter table public.enterprise_decision_center enable row level security;

drop policy if exists "ai_research_projects_all" on public.enterprise_ai_research_projects;
create policy "ai_research_projects_all" on public.enterprise_ai_research_projects for all to authenticated using (true) with check (true);

drop policy if exists "ai_formula_candidates_all" on public.enterprise_ai_formula_candidates;
create policy "ai_formula_candidates_all" on public.enterprise_ai_formula_candidates for all to authenticated using (true) with check (true);

drop policy if exists "knowledge_engine_links_all" on public.enterprise_knowledge_engine_links;
create policy "knowledge_engine_links_all" on public.enterprise_knowledge_engine_links for all to authenticated using (true) with check (true);

drop policy if exists "digital_factory_simulations_all" on public.enterprise_digital_factory_simulations;
create policy "digital_factory_simulations_all" on public.enterprise_digital_factory_simulations for all to authenticated using (true) with check (true);

drop policy if exists "data_lake_records_all" on public.enterprise_data_lake_records;
create policy "data_lake_records_all" on public.enterprise_data_lake_records for all to authenticated using (true) with check (true);

drop policy if exists "decision_center_all" on public.enterprise_decision_center;
create policy "decision_center_all" on public.enterprise_decision_center for all to authenticated using (true) with check (true);
