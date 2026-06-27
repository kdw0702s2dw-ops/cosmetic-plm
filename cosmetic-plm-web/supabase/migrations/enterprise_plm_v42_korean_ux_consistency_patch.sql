-- Enterprise PLM v4.2 Korean UX Consistency Patch
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
('V4.2-KOREAN-UX', 'Enterprise PLM v4.2 Korean UX Consistency Patch', 'Dashboard version consistency and Korean menu/text update.')
on conflict (release_code) do nothing;
