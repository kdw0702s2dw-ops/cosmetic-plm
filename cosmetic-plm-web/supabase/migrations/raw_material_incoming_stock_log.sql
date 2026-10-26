-- 칭량_원료재고 화면에서 "입고재고량"을 입력/수정해서 저장할 때마다 남기는 이력. plm_raw_material_stock_ledger는
-- (원료, 날짜)당 1행만 upsert로 유지되는 스냅샷이라 값을 고치면 이전 값이 사라지므로, 저장 시점마다
-- 이전값(old_incoming_stock, 최초 입력이면 null)/이후값을 별도로 기록해 사용량 이력 화면에서 조회한다.
-- RLS는 다른 plm_raw_material_* 테이블과 동일한 패턴(read: Admin/Researcher/QA/Viewer/Production,
-- write: Admin/Researcher/Production)을 따른다.
--
-- 참고: 이 마이그레이션은 실제 운영 DB에는 Supabase MCP(apply_migration)로 이미 적용되어 있고,
-- 이 파일은 로컬 저장소와 동기화하기 위해 사후에 추가되었다 (적용된 스키마를 직접 조회해 그대로 기록).
CREATE TABLE IF NOT EXISTS plm_raw_material_incoming_stock_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_code text NOT NULL,
  ledger_date date NOT NULL,
  old_incoming_stock numeric,
  new_incoming_stock numeric NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plm_raw_material_incoming_stock_log_date
  ON plm_raw_material_incoming_stock_log (ledger_date DESC);

ALTER TABLE plm_raw_material_incoming_stock_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_raw_material_incoming_stock_log_read ON plm_raw_material_incoming_stock_log
  FOR SELECT
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'QA', 'Viewer', 'Production']));

CREATE POLICY plm_raw_material_incoming_stock_log_write ON plm_raw_material_incoming_stock_log
  FOR ALL
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']))
  WITH CHECK (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']));
