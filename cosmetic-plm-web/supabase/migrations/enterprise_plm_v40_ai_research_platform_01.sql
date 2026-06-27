-- Enterprise PLM v4.0 AI Research Platform Pack 01

create table if not exists public.v40_ai_research_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  title text not null,
  mode text not null,
  target_product_type text,
  target_claim text,
  target_cost_per_kg numeric,
  target_country text,
  prompt text not null,
  status text not null default 'DRAFT',
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v40_ai_research_actions (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  priority text not null default 'P2',
  category text not null,
  message text not null,
  action text not null,
  status text not null default 'OPEN',
  created_at timestamptz default now()
);

create index if not exists idx_v40_ai_research_projects_status
on public.v40_ai_research_projects(project_code, mode, status);

create index if not exists idx_v40_ai_research_actions_project
on public.v40_ai_research_actions(project_code, priority, status);

alter table public.v40_ai_research_projects enable row level security;
alter table public.v40_ai_research_actions enable row level security;

drop policy if exists "v40_ai_research_projects_all" on public.v40_ai_research_projects;
create policy "v40_ai_research_projects_all"
on public.v40_ai_research_projects
for all to authenticated
using (true)
with check (true);

drop policy if exists "v40_ai_research_actions_all" on public.v40_ai_research_actions;
create policy "v40_ai_research_actions_all"
on public.v40_ai_research_actions
for all to authenticated
using (true)
with check (true);
