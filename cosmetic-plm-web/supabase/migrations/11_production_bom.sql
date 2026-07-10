-- 처방관리: 생산 BOM 전개 표 신규 테이블
-- plm_formula_lines와 동일한 패턴이되, FK는 ON DELETE RESTRICT로 두어
-- 생산 BOM 기록이 있는 처방은 삭제되지 않도록 함(처방은 보통 소프트 삭제이지만 안전장치로 유지)

CREATE TABLE plm_production_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_code text,
  formula_code text NOT NULL,
  revision text NOT NULL,
  product_name text,
  material_name_1 text,
  material_name_2 text,
  material_name_3 text,
  molding_type text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (formula_code, revision) REFERENCES plm_formulas(formula_code, revision) ON DELETE RESTRICT
);

CREATE INDEX idx_plm_production_bom_formula ON plm_production_bom(formula_code, revision);

ALTER TABLE plm_production_bom ENABLE ROW LEVEL SECURITY;

CREATE POLICY plm_production_bom_read ON plm_production_bom
  FOR SELECT TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher','QA','Viewer']));

CREATE POLICY plm_production_bom_write ON plm_production_bom
  FOR ALL TO authenticated
  USING (plm_has_role(ARRAY['Admin','Researcher']))
  WITH CHECK (plm_has_role(ARRAY['Admin','Researcher']));
