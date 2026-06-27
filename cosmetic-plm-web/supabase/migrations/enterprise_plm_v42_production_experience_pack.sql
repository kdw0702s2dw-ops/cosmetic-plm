-- Enterprise PLM v4.2 Production Experience Pack

create table if not exists public.enterprise_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_code text not null unique,
  title text not null,
  message text not null,
  area text not null,
  href text,
  status text not null default 'UNREAD',
  priority text not null default 'P2',
  created_at timestamptz default now()
);

create table if not exists public.enterprise_activity_events (
  id uuid primary key default gen_random_uuid(),
  event_code text not null unique,
  area text not null,
  action text not null,
  title text not null,
  description text,
  href text,
  created_by text default 'SYSTEM',
  created_at timestamptz default now()
);

create index if not exists idx_enterprise_notifications_status
on public.enterprise_notifications(status, priority, area, created_at);

create index if not exists idx_enterprise_activity_events_area
on public.enterprise_activity_events(area, action, created_at);

alter table public.enterprise_notifications enable row level security;
alter table public.enterprise_activity_events enable row level security;

drop policy if exists "enterprise_notifications_all" on public.enterprise_notifications;
create policy "enterprise_notifications_all"
on public.enterprise_notifications
for all to authenticated
using (true)
with check (true);

drop policy if exists "enterprise_activity_events_all" on public.enterprise_activity_events;
create policy "enterprise_activity_events_all"
on public.enterprise_activity_events
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
('V4.2-PRODUCTION-EXPERIENCE', 'Enterprise PLM v4.2 Production Experience Pack', 'Role Workspace, Launch Readiness, Global Search, Notifications, Activity Timeline.')
on conflict (release_code) do nothing;
