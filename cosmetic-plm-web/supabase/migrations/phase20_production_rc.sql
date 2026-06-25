-- Phase 20 Production Release Candidate Support

create table if not exists public.enterprise_release_candidates (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  module text not null,
  status text default 'READY',
  release_note text,
  locked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.enterprise_go_live_checklist (
  id uuid primary key default gen_random_uuid(),
  step integer not null,
  task text not null,
  status text default 'TODO',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_release_candidates_version on public.enterprise_release_candidates(version);
create index if not exists idx_go_live_checklist_status on public.enterprise_go_live_checklist(status);

alter table public.enterprise_release_candidates enable row level security;
alter table public.enterprise_go_live_checklist enable row level security;

drop policy if exists "release_candidates_read" on public.enterprise_release_candidates;
create policy "release_candidates_read"
on public.enterprise_release_candidates
for select
to authenticated
using (true);

drop policy if exists "release_candidates_write" on public.enterprise_release_candidates;
create policy "release_candidates_write"
on public.enterprise_release_candidates
for insert
to authenticated
with check (true);

drop policy if exists "go_live_checklist_read" on public.enterprise_go_live_checklist;
create policy "go_live_checklist_read"
on public.enterprise_go_live_checklist
for select
to authenticated
using (true);

drop policy if exists "go_live_checklist_write" on public.enterprise_go_live_checklist;
create policy "go_live_checklist_write"
on public.enterprise_go_live_checklist
for all
to authenticated
using (true)
with check (true);
