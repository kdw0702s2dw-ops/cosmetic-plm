-- Enterprise PLM Sprint 2-6 Realtime Home + Document Templates
-- Marker only. UI/service logic is in the web app.

insert into public.enterprise_release_markers (release_code, title, description)
values (
  'SPRINT2-6-REALTIME-HOME-DOC-TEMPLATES',
  'Enterprise PLM Sprint 2-6 Realtime Home Document Templates',
  'Adds realtime researcher home dashboard and document templates based on uploaded INCI, complex component and single component CSV samples.'
)
on conflict (release_code) do nothing;
