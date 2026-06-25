-- Phase 18 + 18.5 Master Repository Support
-- Optional support table for persisted repository impact results.

create table if not exists public.enterprise_repository_impacts (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  target text not null,
  impact_type text not null,
  risk text default 'LOW',
  action text,
  created_at timestamptz default now()
);

create index if not exists idx_repository_impacts_source on public.enterprise_repository_impacts(source);
create index if not exists idx_repository_impacts_target on public.enterprise_repository_impacts(target);
create index if not exists idx_repository_impacts_risk on public.enterprise_repository_impacts(risk);

alter table public.enterprise_repository_impacts enable row level security;

drop policy if exists "enterprise_repository_impacts_read" on public.enterprise_repository_impacts;
create policy "enterprise_repository_impacts_read"
on public.enterprise_repository_impacts
for select
to authenticated
using (true);

drop policy if exists "enterprise_repository_impacts_insert" on public.enterprise_repository_impacts;
create policy "enterprise_repository_impacts_insert"
on public.enterprise_repository_impacts
for insert
to authenticated
with check (true);
