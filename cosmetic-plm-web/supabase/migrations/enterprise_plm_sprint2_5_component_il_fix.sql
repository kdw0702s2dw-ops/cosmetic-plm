-- Enterprise PLM Sprint 2-5 Component IL Fix
-- Marker only. Document generation logic is in the web service.

insert into public.enterprise_release_markers (release_code, title, description)
values (
  'SPRINT2-5-COMPONENT-IL-FIX',
  'Enterprise PLM Sprint 2-5 Component IL Fix',
  'Fixes complex component table to expand plm_raw_material_components and output KR INCI, EN INCI, CAS, EC, function, final percent.'
)
on conflict (release_code) do nothing;
