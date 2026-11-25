-- [보안 후속조치 1/5] public 스키마에 새로 만들어지는 테이블/시퀀스/함수에 anon 권한이 자동으로
-- 부여되던 기본 ACL(default privileges)을 제거한다. 44/45/46번은 "이미 있던" 노출을 닫은 것이고,
-- 이 작업은 "앞으로 만들 테이블/뷰"에서 같은 문제가 재발하지 않도록 막는 예방 조치다.
--
-- 확인한 원인: pg_default_acl 조회 결과, postgres/supabase_admin 두 역할 모두 public 스키마에
-- obj_type 'r'(테이블)·'S'(시퀀스)·'f'(함수)에 대해 anon에게도 기본적으로 권한을 자동 부여하도록
-- 설정되어 있었다(Supabase 프로젝트 생성 시 기본값으로 추정).
--
-- 적용 범위: postgres 역할 몫만 수정했다(mcp__Supabase__apply_migration으로 적용 성공, 즉시
-- pg_default_acl 재조회로 anon이 빠진 것을 확인). supabase_admin 역할 몫은
-- "permission denied to change default privileges" 에러로 수정하지 못했다 - supabase_admin은
-- Supabase 플랫폼이 내부적으로 관리하는 역할이라 이 프로젝트의 실제 마이그레이션/대시보드
-- SQL Editor 작업은 전부 postgres로 실행되는 것으로 보이며, 이번 세션에서 지금까지의 모든
-- 마이그레이션(44~46번 포함)도 postgres로 적용됐다. 따라서 supabase_admin 몫이 남아있어도
-- 이 프로젝트의 정상적인 개발 워크플로에서 실제로 새 객체가 그 경로로 생성될 가능성은 낮다고
-- 판단했다 - 다만 완전히 닫힌 것은 아니라는 한계는 남는다.
--
-- Supabase MCP 도구(apply_migration)로 적용했고 마이그레이션 이력에도 등록된다(46번과 동일한
-- 방식).

alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;
