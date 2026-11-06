-- 역할별 사이드바/상단 탭 메뉴 노출(활성/비활성) 설정 추가.
-- 원격 적용 마이그레이션명: add_role_page_access

-- 행이 "존재"하면 해당 role에게 그 page_key를 숨긴다는 뜻이고, 행이 없으면(기본값) 보인다 - 그래서
-- 기존 역할(Researcher/QA/Viewer)은 아무 행도 없어 지금과 동일하게 전부 보이는 상태를 유지한다.
-- Admin은 의도적으로 이 매트릭스에서 제외(관리자 본인이 사용자 권한관리 메뉴를 실수로 잠그는 사고
-- 방지) - role CHECK로 DB에서도 막는다.
create table if not exists public.plm_role_page_access (
  role text not null check (role in ('Researcher','QA','Viewer','Production')),
  page_key text not null,
  created_at timestamptz not null default now(),
  primary key (role, page_key)
);

comment on table public.plm_role_page_access is '역할별 메뉴(사이드바/상단 탭) 숨김 설정 - 행 존재=숨김, 행 없음=보임(기본값). Admin 역할은 제외(항상 전체 메뉴).';

alter table public.plm_role_page_access enable row level security;

-- 조회는 로그인한 사용자 누구나 - 자기 역할의 네비게이션을 그리려면 이 설정을 읽어야 한다(민감 정보 아님).
create policy plm_role_page_access_select_authenticated on public.plm_role_page_access
  for select to authenticated
  using (true);

-- 쓰기는 Admin만 - plm_is_admin()은 기존 사용자 권한관리(plm_user_profiles) RLS와 동일하게 쓰는 함수.
create policy plm_role_page_access_write_admin on public.plm_role_page_access
  for all to authenticated
  using (plm_is_admin())
  with check (plm_is_admin());

-- 기존 하드코딩되어 있던 PRODUCTION_ALLOWED_TABS(부자재관리/원료관리/통합BOM/생산관리/생산실적관리/품질관리만
-- 허용)와 정확히 동일한 결과가 나오도록, Production 역할에 대해 그 외 페이지를 전부 숨김으로 시드한다
-- (배포 직후 Production 사용자가 보는 메뉴가 지금과 100% 동일하게 유지됨).
insert into public.plm_role_page_access (role, page_key) values
  ('Production', 'home'),
  ('Production', 'companyManager'),
  ('Production', 'ingredientDict'),
  ('Production', 'purchaseOrder'),
  ('Production', 'formula'),
  ('Production', 'docs'),
  ('Production', 'regulation'),
  ('Production', 'externalRegCheck'),
  ('Production', 'sprint0')
on conflict (role, page_key) do nothing;
