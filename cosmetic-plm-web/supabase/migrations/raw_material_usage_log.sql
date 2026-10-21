-- 칭량_원료재고 > "오늘 제조한 처방으로 금일사용량 자동 반영" 기능 사용 이력(여러 사람이 같은 날짜에
-- 반영/수정할 수 있어 누가 언제 무엇을 반영/수정했는지 확인하기 위함). event_type이 'apply_formula'
-- (처방 반영)인지 'manual_edit'(이미 저장된 금일사용량을 나중에 고침)인지로 구분해서 기록한다.
-- RLS는 plm_raw_material_stock_ledger와 동일한 패턴(read: Admin/Researcher/QA/Viewer/Production,
-- write: Admin/Researcher/Production)을 그대로 따른다.
--
-- 참고: 이 마이그레이션은 실제 운영 DB에는 Supabase MCP(apply_migration)로 이미 적용되어 있고,
-- 이 파일은 로컬 저장소와 동기화하기 위해 사후에 추가되었다 (적용된 스키마를 직접 조회해 그대로 기록).
CREATE TABLE IF NOT EXISTS plm_raw_material_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_code text NOT NULL,
  ledger_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('apply_formula', 'manual_edit')),
  formula_code text,
  formula_revision text,
  formula_name text,
  confirmed_code text,
  target_qty_kg numeric,
  applied_usage numeric,
  old_usage_today numeric,
  new_usage_today numeric,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plm_raw_material_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_raw_material_usage_log_read ON plm_raw_material_usage_log
  FOR SELECT
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'QA', 'Viewer', 'Production']));

CREATE POLICY plm_raw_material_usage_log_write ON plm_raw_material_usage_log
  FOR ALL
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']))
  WITH CHECK (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']));
