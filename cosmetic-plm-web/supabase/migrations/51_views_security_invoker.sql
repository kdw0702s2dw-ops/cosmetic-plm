-- [미적용 - 검토/승인 대기] 45번에서 anon만 회수한 뷰 12개의 남은 문제(뷰가 소유자 postgres 권한으로 실행되어
-- 기반 테이블 RLS를 우회함)를 정리한다. 작성 시점(2026-11-27)에는 운영 DB에 실행하지 않았다.
--
-- 지금 상태의 실제 영향: 로그인 계정이면 비활성 계정이나 프로필이 없는 계정도 이 뷰들로 원료 목록, 처방별 원료 문서,
-- 발주 내역 등을 읽을 수 있다(기반 테이블은 plm_has_role로 막혀 있지만 뷰가 그 검사를 건너뜀).
--
-- a) 현재 앱이 쓰는 뷰 4개 -> security_invoker = true (조회하는 사용자 권한으로 실행되게)
--    - v_plm_raw_material_list (원료관리 목록, services/sprint2/rawMaterialService.ts 외)
--    - v_plm_formula_raw_material_documents (처방별 원료 문서, services/sprint2/rawMaterialDocumentService.ts)
--    - v_plm_purchase_order_summary, v_plm_purchase_order_items_detail (원료 발주관리, services/sprint2/purchaseOrderService.ts)
--    결과 변화: 기반 테이블(plm_raw_materials, plm_companies, plm_raw_material_components, plm_formula_lines,
--    plm_raw_material_documents, plm_raw_material_purchase_orders/_items)의 조회 정책이 모두 5개 역할
--    (Admin/Researcher/QA/Viewer/Production) 허용이라 활성 계정의 결과는 같다. 비활성 계정과 프로필이 없는
--    계정만 0행이 된다. authenticated는 기반 테이블 SELECT 권한이 있어 권한 오류는 나지 않는다.
--    성능(2026-11-27, 같은 쿼리를 authenticated + 실제 계정 JWT로 읽기 전용 트랜잭션에서 EXPLAIN ANALYZE 후 rollback):
--      - 원료 목록(updated_at 순 100건): 현재 약 6ms -> RLS 적용 시 약 230ms. 행마다 plm_has_role()이 실행되기 때문.
--        화면에서 체감할 수준은 아니지만 느려지는 것은 맞다. 필요하면 정책을 (select plm_has_role(...)) 형태로
--        바꿔 한 번만 계산되게 하는 최적화를 별도로 할 수 있다.
--      - 처방별 원료 문서(처방 1건): 약 12ms.
--
-- b) 앱이 쓰지 않는 뷰 8개 -> authenticated 권한 회수 (+ 다시 열리더라도 RLS를 따르도록 security_invoker 설정)
--    - v_home_formula_progress, v_home_recent_formulas, v_home_recent_materials, v_home_regulatory_alerts:
--      현재 코드 어디에서도 참조 없음.
--    - v_composite_breakdown, v_single_ingredient, v_kovas_composite: 어느 화면도 쓰지 않는 죽은 코드에만 남아 있음.
--    - gold_formula_summary: 2e8290a로 사용 화면이 모두 삭제됨. 기반 테이블(gold_formula_headers/lines)은 50번 a에서 회수.
--    로그: 2026-11-12 이후 표본 구간에서 이 8개 뷰로 간 요청 0건.

-- a) 사용 중인 뷰 4개
alter view public.v_plm_raw_material_list set (security_invoker = true);
alter view public.v_plm_formula_raw_material_documents set (security_invoker = true);
alter view public.v_plm_purchase_order_summary set (security_invoker = true);
alter view public.v_plm_purchase_order_items_detail set (security_invoker = true);

-- b) 사용하지 않는 뷰 8개
revoke all on public.v_home_formula_progress from authenticated;
revoke all on public.v_home_recent_formulas from authenticated;
revoke all on public.v_home_recent_materials from authenticated;
revoke all on public.v_home_regulatory_alerts from authenticated;
revoke all on public.v_composite_breakdown from authenticated;
revoke all on public.v_single_ingredient from authenticated;
revoke all on public.v_kovas_composite from authenticated;
revoke all on public.gold_formula_summary from authenticated;
alter view public.v_home_formula_progress set (security_invoker = true);
alter view public.v_home_recent_formulas set (security_invoker = true);
alter view public.v_home_recent_materials set (security_invoker = true);
alter view public.v_home_regulatory_alerts set (security_invoker = true);
alter view public.v_composite_breakdown set (security_invoker = true);
alter view public.v_single_ingredient set (security_invoker = true);
alter view public.v_kovas_composite set (security_invoker = true);
alter view public.gold_formula_summary set (security_invoker = true);

-- 적용 후 확인:
-- select relname, reloptions, has_table_privilege('authenticated', oid, 'SELECT') auth_select
-- from pg_class where relnamespace = 'public'::regnamespace and relkind = 'v' order by 1;
--   -> 12개 모두 reloptions에 security_invoker=true, a)의 4개만 auth_select = true.
-- 화면 확인: 원료관리 목록, 처방관리 문서(원료 COA/MSDS), 원료 발주관리 목록/상세가 이전과 같은 건수로 나오는지.
--
-- 되돌리기:
--   a) alter view public.<view> reset (security_invoker);
--   b) grant all on public.<view> to authenticated;  (적용 전 ACL: postgres/authenticated/service_role 모두 arwdDxtm)
--      alter view public.<view> reset (security_invoker);
