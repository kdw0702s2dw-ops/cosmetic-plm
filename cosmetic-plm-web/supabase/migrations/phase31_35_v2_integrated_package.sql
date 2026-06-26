-- Phase 31~35 Enterprise v2.0 Integrated Package Support

create table if not exists public.enterprise_v2_integration_flows (
  id text primary key,
  phase text,
  module text,
  flow_name text,
  source text,
  target text,
  status text default 'READY',
  owner text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_digital_twin_factory (
  id text primary key,
  batch_size_kg numeric,
  mixer_type text,
  predicted_rpm text,
  predicted_time_min integer,
  predicted_yield_percent numeric,
  risk_level text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_formula_expert (
  id text primary key,
  issue_type text,
  diagnosis text,
  recommendation text,
  expected_result text,
  confidence numeric,
  priority text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_global_regulatory_ai (
  id text primary key,
  country text,
  formula_code text,
  status text,
  key_issue text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_analytics_center (
  id text primary key,
  kpi text,
  value text,
  trend text,
  status text,
  insight text,
  created_at timestamptz default now()
);

alter table public.enterprise_v2_integration_flows enable row level security;
alter table public.enterprise_digital_twin_factory enable row level security;
alter table public.enterprise_ai_formula_expert enable row level security;
alter table public.enterprise_global_regulatory_ai enable row level security;
alter table public.enterprise_analytics_center enable row level security;

drop policy if exists "v2_integration_flows_all" on public.enterprise_v2_integration_flows;
create policy "v2_integration_flows_all" on public.enterprise_v2_integration_flows for all to authenticated using (true) with check (true);

drop policy if exists "digital_twin_factory_all" on public.enterprise_digital_twin_factory;
create policy "digital_twin_factory_all" on public.enterprise_digital_twin_factory for all to authenticated using (true) with check (true);

drop policy if exists "ai_formula_expert_all" on public.enterprise_ai_formula_expert;
create policy "ai_formula_expert_all" on public.enterprise_ai_formula_expert for all to authenticated using (true) with check (true);

drop policy if exists "global_regulatory_ai_all" on public.enterprise_global_regulatory_ai;
create policy "global_regulatory_ai_all" on public.enterprise_global_regulatory_ai for all to authenticated using (true) with check (true);

drop policy if exists "analytics_center_all" on public.enterprise_analytics_center;
create policy "analytics_center_all" on public.enterprise_analytics_center for all to authenticated using (true) with check (true);
