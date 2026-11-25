-- [적용 완료 - 2026-11-25] RLS 정책 조건이 true라서 anon 키만으로 접근 가능했던 구버전 테이블 13개에서
-- anon 권한을 회수한다.
--
-- 적용: 사용자 승인 후 Supabase MCP apply_migration으로 운영 DB에 적용했다(44/45번과 달리
-- list_migrations에 등록됨: 20261125035948 revoke_anon_on_open_policy_tables). 적용한 SQL은 아래 revoke
-- 13건이며, begin/commit은 apply_migration 호출에는 넣지 않았다.
--
-- 적용 후 확인 결과:
--   - 하단 확인 쿼리와 같은 조건으로 조회해 13개 모두 anon 권한이 없음을 확인.
--   - authenticated/service_role의 SELECT 권한과 ACL, RLS 정책은 그대로 유지됨.
--   - 로그인 토큰 없이 anon 키로 REST 요청을 보내면 13개 모두 401로 거부됨(헤더만 요청, 데이터 미조회).
--
-- 배경: 45번(뷰 12개 anon 회수) 후속 점검에서, RLS는 켜져 있지만 anon 또는 public 대상 정책의 조건이
-- true여서 실제로는 아무것도 막지 못하는 테이블 13개를 발견했다.
--
-- 적용 전 확인 내용(메타데이터/행 수 조회만 했고, anon 키로 실제 요청은 보내지 않음):
--   1) 13개 모두 anon에 테이블 권한 전체(arwdDxtm)가 있었고, PUBLIC에 부여된 권한은 없다
--      -> anon에서만 회수하면 우회 경로가 남지 않는다.
--   2) 11개는 정책상 조회/추가/수정/삭제가 모두 anon에 열려 있고, material_documents/process_steps는
--      조회/추가만 열려 있다.
--   3) 이 테이블들에 딸린 시퀀스/트리거, 이 테이블들을 참조하는 public 뷰는 없고, 본문에 테이블명이
--      나오는 public 함수도 없다.
--   4) 행 수: ingredient_master_global 20, audit_logs 7, approval_requests/process_steps/
--      project_formulas/project_stages/projects/user_profiles 각 1, 나머지 5개는 0.
--   5) 코드 사용처(테이블명 문자열을 찾아 page/route까지 import 역추적):
--      - ingredient_master_global, audit_logs: services/enterpriseSupabaseRealService.ts,
--        services/enterpriseSupabaseService.ts, services/masterRepositoryService.ts에서 참조하지만,
--        세 파일 모두 import하는 곳이 없는 죽은 코드다.
--      - user_profiles: services/enterprise-v50/knowledgeAdminProService.ts의 safeCount()가 건수만 조회.
--        AdminProPanel("사용자" KPI)을 거쳐 AuthGate 없는 /enterprise-v5 7개 화면(v5 루트, admin, ai,
--        documents, formula, knowledge, manufacturing)에 포함된다. safeCount()는 에러 시 0을 반환하므로
--        비로그인 상태에서는 화면이 깨지지 않고 해당 값만 0으로 표시된다.
--      - 나머지 10개: 앱 코드에서 참조 없음(backups/page.backup.tsx에만 남아있고 import되지 않음).
--
-- 조치 범위: anon 권한 회수만. authenticated/service_role 권한과 RLS 정책은 바꾸지 않는다.
-- 남는 문제: process_steps를 제외한 12개는 public 또는 authenticated 대상 true 정책이 그대로라,
-- 로그인 계정이면 역할/활성 여부와 무관하게 여전히 접근할 수 있다 - 정책 정리는 별도 작업.

begin;

revoke all on table public.app_profiles from anon;
revoke all on table public.approval_requests from anon;
revoke all on table public.audit_logs from anon;
revoke all on table public.bom_costs from anon;
revoke all on table public.country_regulations from anon;
revoke all on table public.ingredient_master_global from anon;
revoke all on table public.material_documents from anon;
revoke all on table public.process_steps from anon;
revoke all on table public.project_formulas from anon;
revoke all on table public.project_stages from anon;
revoke all on table public.projects from anon;
revoke all on table public.stability_tests from anon;
revoke all on table public.user_profiles from anon;

commit;

-- 적용 후 확인(0행이어야 정상):
-- select t.n
-- from unnest(array[
--   'app_profiles','approval_requests','audit_logs','bom_costs','country_regulations',
--   'ingredient_master_global','material_documents','process_steps','project_formulas',
--   'project_stages','projects','stability_tests','user_profiles'
-- ]) as t(n)
-- where has_table_privilege('anon', ('public.' || t.n)::regclass,
--   'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');
--
-- 되돌리기(문제가 생긴 테이블만): grant all on table public.<table> to anon;
