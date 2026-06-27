-- Enterprise PLM v5.0 Document & Manufacturing PRO Activation Pack
-- UI activation marker only.

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
('V5.0-DOC-MFG-ACTIVATION', 'Enterprise PLM v5.0 Document & Manufacturing PRO Activation Pack', 'Activates DocumentProPanel and ManufacturingProPanel as default v5.0 workspace screens.')
on conflict (release_code) do nothing;
