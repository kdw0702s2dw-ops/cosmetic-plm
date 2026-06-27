-- Enterprise PLM v5.0 Live Data Connection Pack
-- UI marker only. No destructive schema changes.

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
('V5.0-LIVE-DATA-CONNECTION', 'Enterprise PLM v5.0 Live Data Connection Pack', 'Connects v5.0 GOLD UX Formula, Documents, Manufacturing and Dashboard screens to Supabase live data.')
on conflict (release_code) do nothing;
