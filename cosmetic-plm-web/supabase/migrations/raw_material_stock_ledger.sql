-- 칭량_원료재고 화면의 날짜별 현재재고량(opening)/입고재고량(incoming)/금일사용량(usage)/최종재고량
-- (closing) 원장. raw_code + ledger_date 조합으로 하루 1행만 존재한다(UNIQUE 제약).
-- RLS는 다른 plm_* 테이블과 동일한 패턴(read: Admin/Researcher/QA/Viewer/Production,
-- write: Admin/Researcher/Production)을 따른다.
--
-- 참고: 이 마이그레이션은 실제 운영 DB에는 Supabase MCP(apply_migration)로 이미 적용되어 있고,
-- 이 파일은 로컬 저장소와 동기화하기 위해 사후에 추가되었다 (적용된 스키마를 직접 조회해 그대로 기록).
CREATE TABLE IF NOT EXISTS plm_raw_material_stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_code text NOT NULL,
  ledger_date date NOT NULL,
  opening_stock numeric NOT NULL DEFAULT 0,
  incoming_stock numeric NOT NULL DEFAULT 0,
  usage_today numeric NOT NULL DEFAULT 0,
  closing_stock numeric NOT NULL DEFAULT 0,
  note text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (raw_code, ledger_date)
);

ALTER TABLE plm_raw_material_stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_raw_material_stock_ledger_read ON plm_raw_material_stock_ledger
  FOR SELECT
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'QA', 'Viewer', 'Production']));

CREATE POLICY plm_raw_material_stock_ledger_write ON plm_raw_material_stock_ledger
  FOR ALL
  USING (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']))
  WITH CHECK (plm_has_role(ARRAY['Admin', 'Researcher', 'Production']));
