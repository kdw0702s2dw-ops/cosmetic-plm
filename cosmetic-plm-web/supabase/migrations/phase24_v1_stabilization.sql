-- Phase 24 Enterprise v1.0 Stabilization Support

create table if not exists public.enterprise_stabilization_items (
  id text primary key,
  category text,
  item text,
  status text default 'WATCH',
  priority text default 'P2',
  owner text,
  action text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.enterprise_v1_release_notes (
  id uuid primary key default gen_random_uuid(),
  module text,
  version text,
  status text,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_post_go_live_tasks (
  id uuid primary key default gen_random_uuid(),
  week text,
  task text,
  owner text,
  status text default 'TODO',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.enterprise_stabilization_items enable row level security;
alter table public.enterprise_v1_release_notes enable row level security;
alter table public.enterprise_post_go_live_tasks enable row level security;

drop policy if exists "stabilization_items_all" on public.enterprise_stabilization_items;
create policy "stabilization_items_all" on public.enterprise_stabilization_items for all to authenticated using (true) with check (true);

drop policy if exists "v1_release_notes_all" on public.enterprise_v1_release_notes;
create policy "v1_release_notes_all" on public.enterprise_v1_release_notes for all to authenticated using (true) with check (true);

drop policy if exists "post_go_live_tasks_all" on public.enterprise_post_go_live_tasks;
create policy "post_go_live_tasks_all" on public.enterprise_post_go_live_tasks for all to authenticated using (true) with check (true);
