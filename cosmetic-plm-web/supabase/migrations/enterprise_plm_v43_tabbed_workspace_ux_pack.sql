-- Enterprise PLM v4.3 Tabbed Workspace UX Pack
-- No destructive schema change. Release marker only.

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
('V4.3-TABBED-WORKSPACE', 'Enterprise PLM v4.3 Tabbed Workspace UX Pack', 'Korean tabbed workspace interface with browser-like tabs and simplified menu.')
on conflict (release_code) do nothing;
