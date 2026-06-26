-- Phase 41~45 Knowledge / SCM / API Integrated Package Support

create table if not exists public.enterprise_patent_paper_insights (
  id text primary key,
  source_type text,
  title text,
  keyword text,
  relevance_score numeric,
  opportunity text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_raw_material_market_forecast (
  id text primary key,
  raw_code text,
  raw_name text,
  current_price numeric,
  forecast_price numeric,
  supply_risk text,
  recommendation text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_ai_cost_optimization (
  id text primary key,
  formula_code text,
  optimization_type text,
  current_cost numeric,
  optimized_cost numeric,
  saving_percent numeric,
  risk_level text,
  action text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_multi_plant (
  id text primary key,
  plant_name text,
  location text,
  capability text,
  capacity_kg_day numeric,
  status text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_api_hub (
  id text primary key,
  api_name text,
  domain text,
  endpoint text,
  status text,
  security_level text,
  created_at timestamptz default now()
);

alter table public.enterprise_patent_paper_insights enable row level security;
alter table public.enterprise_raw_material_market_forecast enable row level security;
alter table public.enterprise_ai_cost_optimization enable row level security;
alter table public.enterprise_multi_plant enable row level security;
alter table public.enterprise_api_hub enable row level security;

drop policy if exists "patent_paper_insights_all" on public.enterprise_patent_paper_insights;
create policy "patent_paper_insights_all" on public.enterprise_patent_paper_insights for all to authenticated using (true) with check (true);

drop policy if exists "raw_material_market_forecast_all" on public.enterprise_raw_material_market_forecast;
create policy "raw_material_market_forecast_all" on public.enterprise_raw_material_market_forecast for all to authenticated using (true) with check (true);

drop policy if exists "ai_cost_optimization_all" on public.enterprise_ai_cost_optimization;
create policy "ai_cost_optimization_all" on public.enterprise_ai_cost_optimization for all to authenticated using (true) with check (true);

drop policy if exists "multi_plant_all" on public.enterprise_multi_plant;
create policy "multi_plant_all" on public.enterprise_multi_plant for all to authenticated using (true) with check (true);

drop policy if exists "api_hub_all" on public.enterprise_api_hub;
create policy "api_hub_all" on public.enterprise_api_hub for all to authenticated using (true) with check (true);
