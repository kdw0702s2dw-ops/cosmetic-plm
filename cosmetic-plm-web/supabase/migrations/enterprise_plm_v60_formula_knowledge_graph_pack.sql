-- Enterprise PLM v6.0 Phase 2 Formula Knowledge Graph Pack
-- MES/ERP integrations intentionally excluded.

create table if not exists public.v60_formula_knowledge_graph_runs (
  id uuid primary key default gen_random_uuid(),
  formula_code text not null,
  revision text not null,
  node_count numeric,
  edge_count numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists public.v60_raw_impact_runs (
  id uuid primary key default gen_random_uuid(),
  raw_code text not null,
  raw_name text,
  used_formula_count numeric,
  result_json jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

alter table public.v60_formula_knowledge_graph_runs enable row level security;
alter table public.v60_raw_impact_runs enable row level security;

drop policy if exists "v60_formula_knowledge_graph_runs_all" on public.v60_formula_knowledge_graph_runs;
create policy "v60_formula_knowledge_graph_runs_all"
on public.v60_formula_knowledge_graph_runs
for all to authenticated
using (true)
with check (true);

drop policy if exists "v60_raw_impact_runs_all" on public.v60_raw_impact_runs;
create policy "v60_raw_impact_runs_all"
on public.v60_raw_impact_runs
for all to authenticated
using (true)
with check (true);

create table if not exists public.enterprise_release_markers (
  id uuid primary key default gen_random_uuid(),
  release_code text not null unique,
  title text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.enterprise_release_markers enable row level security;

drop policy if exists "enterprise_release_markers_all" on public.enterprise_release_markers;
create policy "enterprise_release_markers_all"
on public.enterprise_release_markers
for all to authenticated
using (true)
with check (true);

insert into public.enterprise_release_markers
(release_code, title, description)
values
('V6.0-FORMULA-KNOWLEDGE-GRAPH', 'Enterprise PLM v6.0 Phase 2 Formula Knowledge Graph Pack', 'Adds formula knowledge graph, raw material impact analysis and similar formula search. MES/ERP integrations excluded.')
on conflict (release_code) do nothing;
