-- 연구원 홈 화면에 "시스템 업데이트" 표를 추가하기 위한 테이블.
-- 등록된 업데이트 내용은 조회 시 created_at 기준 최근 2일 것만 필터링해서 보여주고, 그 이후로는
-- 화면에서 자동으로 사라진다 - 행 자체를 지우지는 않고(나중에 이력이 필요할 수 있어 보존), 조회
-- 함수(fetchRecentSystemUpdates)가 "최근 2일" 조건을 걸어서 오래된 항목을 걸러낸다.
-- 등록/삭제는 Admin만 가능하고(plm_system_updates_write), 조회는 전 역할이 가능하다.
--
-- 참고: 이 마이그레이션은 2026-09-23에 Supabase 프로젝트(ztzitdhngdtfwmfqusbb)에 이미 적용되어
-- 있습니다. 이 파일은 로컬 저장소의 supabase/migrations/ 이력을 실제 DB 상태와 맞추기 위한
-- 기록용입니다 - if not exists 가드가 있어 다시 실행해도 안전합니다.

create table if not exists plm_system_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  created_by text
);

comment on table plm_system_updates is '연구원 홈에 표시되는 "시스템 업데이트" 안내 - 등록 후 2일이 지나면 화면에서 자동으로 사라진다(조회 시 created_at 기준으로 필터링, 행 자체는 삭제하지 않음).';

alter table plm_system_updates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'plm_system_updates' and policyname = 'plm_system_updates_read') then
    create policy plm_system_updates_read on plm_system_updates for select to authenticated
      using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'plm_system_updates' and policyname = 'plm_system_updates_write') then
    create policy plm_system_updates_write on plm_system_updates for all to authenticated
      using (plm_has_role(array['Admin'])) with check (plm_has_role(array['Admin']));
  end if;
end $$;
