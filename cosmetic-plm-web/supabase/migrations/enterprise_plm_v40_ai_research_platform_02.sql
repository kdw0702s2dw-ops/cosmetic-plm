-- Enterprise PLM v4.0 AI Research Platform Pack 02
-- AI Recommendation Engine

create table if not exists public.v40_ai_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  run_code text not null unique,
  source_formula_code text,
  source_revision text,
  request_text text not null,
  target_product_type text,
  target_claim text,
  target_cost_per_kg numeric,
  target_country text,
  result_json jsonb not null default '{}'::jsonb,
  status text not null default 'GENERATED',
  created_at timestamptz default now()
);

create table if not exists public.v40_ai_recommendation_items (
  id uuid primary key default gen_random_uuid(),
  run_code text not null,
  recommendation_type text not null,
  priority text not null default 'P2',
  title text not null,
  message text not null,
  expected_impact text,
  status text not null default 'OPEN',
  created_at timestamptz default now()
);

create index if not exists idx_v40_ai_recommendation_runs_code
on public.v40_ai_recommendation_runs(run_code, status, created_at);

create index if not exists idx_v40_ai_recommendation_items_run
on public.v40_ai_recommendation_items(run_code, priority, status);

alter table public.v40_ai_recommendation_runs enable row level security;
alter table public.v40_ai_recommendation_items enable row level security;

drop policy if exists "v40_ai_recommendation_runs_all" on public.v40_ai_recommendation_runs;
create policy "v40_ai_recommendation_runs_all"
on public.v40_ai_recommendation_runs
for all to authenticated
using (true)
with check (true);

drop policy if exists "v40_ai_recommendation_items_all" on public.v40_ai_recommendation_items;
create policy "v40_ai_recommendation_items_all"
on public.v40_ai_recommendation_items
for all to authenticated
using (true)
with check (true);
