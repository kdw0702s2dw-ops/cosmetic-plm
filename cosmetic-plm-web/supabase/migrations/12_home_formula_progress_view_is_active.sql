-- v_home_formula_progress: plm_formula_workflow가 참조하는 처방이 비활성(삭제)이거나
-- 아예 없는(고아) 경우 뷰에서 자동으로 걸러지도록 f.is_active = true 조건 추가
CREATE OR REPLACE VIEW v_home_formula_progress AS
SELECT w.formula_code,
    w.revision,
    f.formula_name,
    w.researcher,
    w.customer,
    w.current_stage,
    w.formula_registered_at,
    w.sample_made_at,
    w.sample_shipped_at,
    w.additional_request_at,
    w.additional_request_note,
    w.confirmed_at,
    w.document_issued,
    w.document_code,
    w.updated_at
FROM plm_formula_workflow w
LEFT JOIN plm_formulas f ON f.formula_code = w.formula_code AND f.revision = w.revision
WHERE w.current_stage <> '컨펌완료'::text
  AND f.is_active = true
ORDER BY w.updated_at DESC;
