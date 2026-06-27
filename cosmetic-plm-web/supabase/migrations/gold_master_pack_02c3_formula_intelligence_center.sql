-- Enterprise PLM v3.0 GOLD MASTER Pack 02-C3
-- Formula Intelligence Center

create table if not exists public.gold_formula_stability_risks (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  area text not null,
  risk_level text not null,
  message text not null,
  recommendation text not null,
  created_at timestamptz default now()
);

create table if not exists public.gold_formula_regulation_risks (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  country text not null,
  raw_code text,
  risk_level text not null,
  message text not null,
  recommendation text not null,
  created_at timestamptz default now()
);

create table if not exists public.gold_formula_scores (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  validation_score numeric not null default 0,
  cost_score numeric not null default 0,
  stability_score numeric not null default 0,
  regulation_score numeric not null default 0,
  document_score numeric not null default 0,
  overall_score numeric not null default 0,
  status text not null default 'WATCH',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(formula_code, revision)
);

create table if not exists public.gold_formula_recommendations (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  category text not null,
  priority text not null,
  message text not null,
  action text not null,
  created_at timestamptz default now()
);

create index if not exists idx_gold_formula_stability_formula on public.gold_formula_stability_risks(formula_code, revision, risk_level);
create index if not exists idx_gold_formula_regulation_formula on public.gold_formula_regulation_risks(formula_code, revision, country, risk_level);
create index if not exists idx_gold_formula_scores_formula on public.gold_formula_scores(formula_code, revision, overall_score);
create index if not exists idx_gold_formula_recommendations_formula on public.gold_formula_recommendations(formula_code, revision, priority);

alter table public.gold_formula_stability_risks enable row level security;
alter table public.gold_formula_regulation_risks enable row level security;
alter table public.gold_formula_scores enable row level security;
alter table public.gold_formula_recommendations enable row level security;

drop policy if exists "gold_formula_stability_risks_all" on public.gold_formula_stability_risks;
create policy "gold_formula_stability_risks_all" on public.gold_formula_stability_risks for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_regulation_risks_all" on public.gold_formula_regulation_risks;
create policy "gold_formula_regulation_risks_all" on public.gold_formula_regulation_risks for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_scores_all" on public.gold_formula_scores;
create policy "gold_formula_scores_all" on public.gold_formula_scores for all to authenticated using (true) with check (true);

drop policy if exists "gold_formula_recommendations_all" on public.gold_formula_recommendations;
create policy "gold_formula_recommendations_all" on public.gold_formula_recommendations for all to authenticated using (true) with check (true);
