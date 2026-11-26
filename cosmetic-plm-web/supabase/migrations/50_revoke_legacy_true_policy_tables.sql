-- [미적용 - 검토/승인 대기] RLS 정책 조건이 true라서 "로그인만 하면" 역할/활성 여부와 무관하게 읽기·쓰기가
-- 되던 구버전 테이블 187개에서 anon/authenticated 권한을 회수한다. 작성 시점(2026-11-27)에는 운영 DB에 실행하지 않았다.
--
-- 대상 선정(2026-11-27 운영 DB 조회):
--   - public 스키마에서 qual 또는 with_check가 'true'인 정책이 하나라도 있는 테이블 189개 중,
--     현재 앱이 쓰는 plm_role_page_access, plm_signatures 2개를 뺀 187개(아래 b 참고).
--   - 46번에서 anon만 회수한 13개(app_profiles 등)도 authenticated 대상 true 정책이 남아 있어 포함했다.
--
-- 사용처 확인:
--   - 코드: 2e8290a(구버전 화면 57개 삭제) 이후, 현재 라우트(/enterprise, /login, /admin/users, /sprint1·2, API 3개)에서
--     import로 닿는 파일 160개 중 이 테이블명을 쓰는 곳 0개. 어느 화면도 쓰지 않는 죽은 코드 몇 개에만 남아 있다
--     (audit_logs, ingredient_master_global, enterprise_projects/raw_materials/supplier_tasks 등 10개 테이블).
--   - 로그: Supabase API 로그(2026-11-12/19/23/24/25~27 표본)에서 이 테이블들로 간 요청 0건
--     (46번 검증 때 보낸 HEAD 요청 3건 제외).
--   - DB 내부: 이 테이블들을 참조하는 외래키, 트리거, public 함수 없음. 참조하는 뷰는 gold_formula_summary 1개
--     (51번 b에서 함께 회수).
--   - 데이터: 160개는 0행, 27개는 1~54행(최근 데이터 2026-06-30). 데이터는 그대로 두고 권한만 회수한다.
--
-- 조치: 테이블 권한 회수만(service_role, postgres는 유지). 정책과 데이터는 건드리지 않는다.
--   정책을 지우는 대신 권한을 회수하는 이유: 되돌리기가 grant 한 줄로 끝나고, 나중에 테이블 정리(drop) 여부를
--   따로 결정할 수 있다. 권한이 없으면 true 정책이 남아 있어도 REST/RPC로 접근할 수 없다.

-- a) 구버전 테이블 187개: anon, authenticated 권한 회수
revoke all on table public.app_profiles from anon, authenticated;
revoke all on table public.approval_requests from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.bom_costs from anon, authenticated;
revoke all on table public.country_regulations from anon, authenticated;
revoke all on table public.enterprise_activity_events from anon, authenticated;
revoke all on table public.enterprise_ai_brain_actions from anon, authenticated;
revoke all on table public.enterprise_ai_brain_advisors from anon, authenticated;
revoke all on table public.enterprise_ai_brain_runs from anon, authenticated;
revoke all on table public.enterprise_ai_brain_scenarios from anon, authenticated;
revoke all on table public.enterprise_ai_brain_summaries from anon, authenticated;
revoke all on table public.enterprise_ai_copilot_actions from anon, authenticated;
revoke all on table public.enterprise_ai_copilot_commands from anon, authenticated;
revoke all on table public.enterprise_ai_copilot_workflows from anon, authenticated;
revoke all on table public.enterprise_ai_cost_optimization from anon, authenticated;
revoke all on table public.enterprise_ai_formula_expert from anon, authenticated;
revoke all on table public.enterprise_analytics_center from anon, authenticated;
revoke all on table public.enterprise_api_hub from anon, authenticated;
revoke all on table public.enterprise_approval_records from anon, authenticated;
revoke all on table public.enterprise_audit_events from anon, authenticated;
revoke all on table public.enterprise_backup_jobs from anon, authenticated;
revoke all on table public.enterprise_bom_items from anon, authenticated;
revoke all on table public.enterprise_bulk_import_jobs from anon, authenticated;
revoke all on table public.enterprise_code_quality_checks from anon, authenticated;
revoke all on table public.enterprise_column_mappings from anon, authenticated;
revoke all on table public.enterprise_country_regulations from anon, authenticated;
revoke all on table public.enterprise_customer_portal_items from anon, authenticated;
revoke all on table public.enterprise_daily_operation_metrics from anon, authenticated;
revoke all on table public.enterprise_data_validation_rules from anon, authenticated;
revoke all on table public.enterprise_digital_twin_factory from anon, authenticated;
revoke all on table public.enterprise_dms_documents from anon, authenticated;
revoke all on table public.enterprise_document_automations from anon, authenticated;
revoke all on table public.enterprise_eln_attachments from anon, authenticated;
revoke all on table public.enterprise_eln_experiments from anon, authenticated;
revoke all on table public.enterprise_eln_observations from anon, authenticated;
revoke all on table public.enterprise_eln_signatures from anon, authenticated;
revoke all on table public.enterprise_error_logs from anon, authenticated;
revoke all on table public.enterprise_export_generators from anon, authenticated;
revoke all on table public.enterprise_external_account_mappings from anon, authenticated;
revoke all on table public.enterprise_final_sprint_metrics from anon, authenticated;
revoke all on table public.enterprise_formula_breakdown_results from anon, authenticated;
revoke all on table public.enterprise_formula_calculation_results from anon, authenticated;
revoke all on table public.enterprise_formula_ingredient_list_results from anon, authenticated;
revoke all on table public.enterprise_formula_items from anon, authenticated;
revoke all on table public.enterprise_formula_master from anon, authenticated;
revoke all on table public.enterprise_formula_optimizations from anon, authenticated;
revoke all on table public.enterprise_formula_simulations from anon, authenticated;
revoke all on table public.enterprise_formula_validation_results from anon, authenticated;
revoke all on table public.enterprise_formulas from anon, authenticated;
revoke all on table public.enterprise_global_regulatory_ai from anon, authenticated;
revoke all on table public.enterprise_global_search_results from anon, authenticated;
revoke all on table public.enterprise_go_live_checklist from anon, authenticated;
revoke all on table public.enterprise_go_live_data_seed from anon, authenticated;
revoke all on table public.enterprise_go_live_issues from anon, authenticated;
revoke all on table public.enterprise_go_live_operations from anon, authenticated;
revoke all on table public.enterprise_import_approvals from anon, authenticated;
revoke all on table public.enterprise_import_error_reports from anon, authenticated;
revoke all on table public.enterprise_import_templates from anon, authenticated;
revoke all on table public.enterprise_import_validation_results from anon, authenticated;
revoke all on table public.enterprise_inci_master from anon, authenticated;
revoke all on table public.enterprise_knowledge_graph from anon, authenticated;
revoke all on table public.enterprise_lims_coa from anon, authenticated;
revoke all on table public.enterprise_lims_samples from anon, authenticated;
revoke all on table public.enterprise_lims_stability from anon, authenticated;
revoke all on table public.enterprise_lims_tests from anon, authenticated;
revoke all on table public.enterprise_live_crud_audit from anon, authenticated;
revoke all on table public.enterprise_live_crud_endpoints from anon, authenticated;
revoke all on table public.enterprise_live_crud_operation_logs from anon, authenticated;
revoke all on table public.enterprise_live_crud_settings from anon, authenticated;
revoke all on table public.enterprise_live_document_approvals from anon, authenticated;
revoke all on table public.enterprise_live_document_downloads from anon, authenticated;
revoke all on table public.enterprise_live_document_risks from anon, authenticated;
revoke all on table public.enterprise_live_document_sections from anon, authenticated;
revoke all on table public.enterprise_live_documents from anon, authenticated;
revoke all on table public.enterprise_manufacturing_steps from anon, authenticated;
revoke all on table public.enterprise_master_data_connectors from anon, authenticated;
revoke all on table public.enterprise_material_documents from anon, authenticated;
revoke all on table public.enterprise_material_substitutions from anon, authenticated;
revoke all on table public.enterprise_mes_deviations from anon, authenticated;
revoke all on table public.enterprise_mes_lots from anon, authenticated;
revoke all on table public.enterprise_mes_process_logs from anon, authenticated;
revoke all on table public.enterprise_mes_work_orders from anon, authenticated;
revoke all on table public.enterprise_migration_batches from anon, authenticated;
revoke all on table public.enterprise_monitoring_checks from anon, authenticated;
revoke all on table public.enterprise_multi_plant from anon, authenticated;
revoke all on table public.enterprise_notifications from anon, authenticated;
revoke all on table public.enterprise_patent_paper_insights from anon, authenticated;
revoke all on table public.enterprise_performance_checks from anon, authenticated;
revoke all on table public.enterprise_performance_refactors from anon, authenticated;
revoke all on table public.enterprise_plm_chatbot_logs from anon, authenticated;
revoke all on table public.enterprise_post_go_live_tasks from anon, authenticated;
revoke all on table public.enterprise_production_ai_copilot from anon, authenticated;
revoke all on table public.enterprise_production_crud_readiness from anon, authenticated;
revoke all on table public.enterprise_production_export_readiness from anon, authenticated;
revoke all on table public.enterprise_production_final_ai from anon, authenticated;
revoke all on table public.enterprise_production_final_audit from anon, authenticated;
revoke all on table public.enterprise_production_final_crud from anon, authenticated;
revoke all on table public.enterprise_production_final_documents from anon, authenticated;
revoke all on table public.enterprise_production_final_health from anon, authenticated;
revoke all on table public.enterprise_production_health from anon, authenticated;
revoke all on table public.enterprise_projects from anon, authenticated;
revoke all on table public.enterprise_qms_processes from anon, authenticated;
revoke all on table public.enterprise_quick_access_items from anon, authenticated;
revoke all on table public.enterprise_raw_material_components from anon, authenticated;
revoke all on table public.enterprise_raw_material_market_forecast from anon, authenticated;
revoke all on table public.enterprise_raw_materials from anon, authenticated;
revoke all on table public.enterprise_real_db_connections from anon, authenticated;
revoke all on table public.enterprise_real_db_correction_actions from anon, authenticated;
revoke all on table public.enterprise_real_db_import_executions from anon, authenticated;
revoke all on table public.enterprise_real_db_operation_metrics from anon, authenticated;
revoke all on table public.enterprise_real_db_search_indexes from anon, authenticated;
revoke all on table public.enterprise_recent_works from anon, authenticated;
revoke all on table public.enterprise_regulation_rules from anon, authenticated;
revoke all on table public.enterprise_release_candidate_checks from anon, authenticated;
revoke all on table public.enterprise_release_candidates from anon, authenticated;
revoke all on table public.enterprise_release_gates from anon, authenticated;
revoke all on table public.enterprise_release_markers from anon, authenticated;
revoke all on table public.enterprise_repository_impacts from anon, authenticated;
revoke all on table public.enterprise_sample_feedbacks from anon, authenticated;
revoke all on table public.enterprise_scale_up_batches from anon, authenticated;
revoke all on table public.enterprise_scale_up_risks from anon, authenticated;
revoke all on table public.enterprise_stability_records from anon, authenticated;
revoke all on table public.enterprise_stabilization_items from anon, authenticated;
revoke all on table public.enterprise_supplier_scorecards from anon, authenticated;
revoke all on table public.enterprise_supplier_tasks from anon, authenticated;
revoke all on table public.enterprise_today_tasks from anon, authenticated;
revoke all on table public.enterprise_training_items from anon, authenticated;
revoke all on table public.enterprise_uat_scenarios from anon, authenticated;
revoke all on table public.enterprise_v1_release_notes from anon, authenticated;
revoke all on table public.enterprise_v2_integration_flows from anon, authenticated;
revoke all on table public.enterprise_validation_protocols from anon, authenticated;
revoke all on table public.enterprise_workflow_runs from anon, authenticated;
revoke all on table public.enterprise_workflow_steps from anon, authenticated;
revoke all on table public.enterprise_workflow_tasks from anon, authenticated;
revoke all on table public.enterprise_workflow_templates from anon, authenticated;
revoke all on table public.gold_ai_copilot_actions from anon, authenticated;
revoke all on table public.gold_ai_copilot_runs from anon, authenticated;
revoke all on table public.gold_document_export_logs from anon, authenticated;
revoke all on table public.gold_document_history from anon, authenticated;
revoke all on table public.gold_document_workflow_tasks from anon, authenticated;
revoke all on table public.gold_documents from anon, authenticated;
revoke all on table public.gold_formula_cost_lines from anon, authenticated;
revoke all on table public.gold_formula_cost_optimization from anon, authenticated;
revoke all on table public.gold_formula_cost_summaries from anon, authenticated;
revoke all on table public.gold_formula_headers from anon, authenticated;
revoke all on table public.gold_formula_history from anon, authenticated;
revoke all on table public.gold_formula_lines from anon, authenticated;
revoke all on table public.gold_formula_recommendations from anon, authenticated;
revoke all on table public.gold_formula_regulation_risks from anon, authenticated;
revoke all on table public.gold_formula_revisions from anon, authenticated;
revoke all on table public.gold_formula_scores from anon, authenticated;
revoke all on table public.gold_formula_stability_risks from anon, authenticated;
revoke all on table public.gold_formula_validation_issues from anon, authenticated;
revoke all on table public.gold_formula_validation_runs from anon, authenticated;
revoke all on table public.gold_manufacturing_batches from anon, authenticated;
revoke all on table public.gold_manufacturing_materials from anon, authenticated;
revoke all on table public.gold_manufacturing_steps from anon, authenticated;
revoke all on table public.gold_release_checklists from anon, authenticated;
revoke all on table public.gold_release_logs from anon, authenticated;
revoke all on table public.gold_sample_requests from anon, authenticated;
revoke all on table public.ingredient_master_global from anon, authenticated;
revoke all on table public.knowledge_compatibility_matrix from anon, authenticated;
revoke all on table public.knowledge_formula_library from anon, authenticated;
revoke all on table public.knowledge_global_inci_master from anon, authenticated;
revoke all on table public.knowledge_regulation_rules from anon, authenticated;
revoke all on table public.material_documents from anon, authenticated;
revoke all on table public.process_steps from anon, authenticated;
revoke all on table public.project_formulas from anon, authenticated;
revoke all on table public.project_stages from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.stability_tests from anon, authenticated;
revoke all on table public.user_profiles from anon, authenticated;
revoke all on table public.v40_ai_autopilot_runs from anon, authenticated;
revoke all on table public.v40_ai_autopilot_steps from anon, authenticated;
revoke all on table public.v40_ai_recommendation_items from anon, authenticated;
revoke all on table public.v40_ai_recommendation_runs from anon, authenticated;
revoke all on table public.v40_ai_research_actions from anon, authenticated;
revoke all on table public.v40_ai_research_projects from anon, authenticated;
revoke all on table public.v51_release_readiness_runs from anon, authenticated;
revoke all on table public.v51_smart_formula_runs from anon, authenticated;
revoke all on table public.v60_ai_recommendation_runs from anon, authenticated;
revoke all on table public.v60_compatibility_runs from anon, authenticated;
revoke all on table public.v60_cosmetic_intelligence_runs from anon, authenticated;
revoke all on table public.v60_cost_simulation_runs from anon, authenticated;
revoke all on table public.v60_formula_compare_runs from anon, authenticated;
revoke all on table public.v60_formula_knowledge_graph_runs from anon, authenticated;
revoke all on table public.v60_raw_impact_runs from anon, authenticated;

-- b) 유지하는 2개(plm_role_page_access, plm_signatures)는 true 정책이 의도된 것이다
--    (메뉴 숨김 설정과 서명 이미지는 로그인 사용자 전원이 읽어야 함, 쓰기는 Admin/본인으로 제한됨).
--    anon에는 정책이 없어 실제로 접근할 수 없지만 테이블 권한(arwdDxtm)이 남아 있어 정리 차원에서 회수한다.
revoke all on table public.plm_role_page_access from anon;
revoke all on table public.plm_signatures from anon;

-- 적용 후 확인(0행이어야 정상):
-- select c.relname from pg_class c
-- where c.relnamespace = 'public'::regnamespace and c.relkind in ('r','p')
--   and exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname
--               and (coalesce(p.qual,'') = 'true' or coalesce(p.with_check,'') = 'true'))
--   and c.relname not in ('plm_role_page_access', 'plm_signatures')
--   and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
--        or has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'));
--
-- 되돌리기(적용 전 ACL 기준):
--   a) 187개 모두: grant all on table public.<table> to authenticated;
--      그중 아래 13개를 뺀 174개는 anon에도 있었다: grant all on table public.<table> to anon;
--      (anon이 원래 없던 13개: app_profiles, approval_requests, audit_logs, bom_costs, country_regulations, ingredient_master_global, material_documents, process_steps, project_formulas, project_stages, projects, stability_tests, user_profiles)
--   b) grant all on table public.plm_role_page_access to anon; grant all on table public.plm_signatures to anon;

