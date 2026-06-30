-- Enterprise PLM Sprint 2-4 Pagination + INCI KR/EN
insert into public.enterprise_release_markers (release_code, title, description)
values ('SPRINT2-4-PAGINATION-INCI-KR-EN', 'Enterprise PLM Sprint 2-4 Pagination INCI KR EN', 'Adds raw material pagination and Korean/English INCI list document format.')
on conflict (release_code) do nothing;
