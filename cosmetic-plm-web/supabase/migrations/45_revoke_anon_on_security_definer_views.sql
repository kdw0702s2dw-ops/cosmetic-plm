-- [긴급 보안 조치] 로그인 없이(anon 키만으로) 조회 가능했던 뷰 12개에서 anon 권한을 회수한다.
--
-- 발견 경위: "원료 목록 검색에 제조사 포함" 기능(76318b1) 로컬 리뷰 중 로컬 Claude Code가
-- 이번 변경과 무관한 별도 문제로 보고함(2026-11-25). v_plm_raw_material_list를 로그인 토큰 없이
-- anon 키만으로 조회했더니 활성 원료 355건 전체(단가/공급사/제조사/INCI/비고 포함)가 그대로
-- 노출됨을 확인했다고 함.
--
-- 독립 검증(이 세션에서 직접 확인):
--   1) mcp__Supabase__get_advisors(type=security) 결과, 정확히 동일한 12개 뷰가
--      "security_definer_view"(ERROR 등급)로 잡힘 - 뷰 소유자(postgres) 권한으로 실행되어 RLS를
--      우회하는 설정.
--   2) information_schema.role_table_grants로 직접 조회한 결과, 12개 뷰 전부 anon에 SELECT를
--      포함한 권한이 부여되어 있었음(쓰기 권한도 부여돼 있었으나 전부 갱신 불가능한 뷰라 실제
--      데이터 변경 경로는 아님).
--   3) services/components 전체에서 이 12개 뷰를 참조하는 코드를 grep했으나, 이것만으로는
--      "로그인 필요 화면에서만 쓰인다"를 보장하지 못함 - 실제로 gold_formula_summary,
--      v_composite_breakdown, v_single_ingredient는 AuthGate가 없는 구버전 화면
--      (/enterprise-gold-*, /enterprise-v5/*, /enterprise-v6/*, /formula-docs-example,
--      /enterprise-activity, /enterprise-global-search, /enterprise-launch-readiness,
--      /enterprise-notifications, /enterprise-role-workspace)에서도 쓰이고 있어, 이번 회수로 그 화면들의 데이터 조회가 실패하게 됨(로컬 Claude Code가 발견).
--      사용자 확인 결과 이 구버전 화면들은 현재 로그인 없이 쓰는 사람이 없어 영향 없음 - 재발
--      방지 차원에서 해당 화면들에 AuthGate를 추가하는 작업을 별도로 진행 예정.
--
-- 조치 범위(1단계만, 즉시 적용): anon 권한 회수. 로그인하지 않은 외부인이 이 12개 뷰를 전혀
-- 조회할 수 없게 된다. 로그인했지만 역할이 없거나 비활성 계정인 사용자, 또는 역할별로 원래보다
-- 넓게 보이는 문제(= 뷰가 security_invoker 없이 소유자 권한으로 실행되는 근본 원인)는 아직
-- 남아있다 - 2단계(각 뷰에 security_invoker = true 적용)는 하위 테이블 RLS가 전부 적용되므로
-- 역할별 화면 점검이 필요해 별도 작업으로 진행한다.
--
-- Supabase MCP 도구(execute_sql)로 즉시 적용하고 즉시 재조회로 확인했다(2026-11-25).
-- apply_migration을 거치지 않아 list_migrations에는 등록되지 않은 기록 보존용 로컬 파일이다.

revoke all on public.v_plm_formula_raw_material_documents from anon;
revoke all on public.v_home_formula_progress from anon;
revoke all on public.v_home_recent_materials from anon;
revoke all on public.v_home_recent_formulas from anon;
revoke all on public.v_home_regulatory_alerts from anon;
revoke all on public.v_plm_raw_material_list from anon;
revoke all on public.v_composite_breakdown from anon;
revoke all on public.v_single_ingredient from anon;
revoke all on public.gold_formula_summary from anon;
revoke all on public.v_kovas_composite from anon;
revoke all on public.v_plm_purchase_order_summary from anon;
revoke all on public.v_plm_purchase_order_items_detail from anon;
