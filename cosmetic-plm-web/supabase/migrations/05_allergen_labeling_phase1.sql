-- 알러젠 표기 자동계산 기능 Phase 1: 스키마 변경

-- 1) 알러젠 마스터 테이블 (신규)
CREATE TABLE plm_allergen_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allergen_name_en text NOT NULL,
  allergen_name_kr text,
  cas_no text,
  ec_no text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) 원료 구성성분 테이블에 알러젠 표기 추가
ALTER TABLE plm_raw_material_components
  ADD COLUMN is_allergen boolean DEFAULT false,
  ADD COLUMN allergen_id uuid REFERENCES plm_allergen_master(id);

-- 3) 처방 테이블에 Leave-on/Rinse-off 구분 추가 (product_type과 별개)
ALTER TABLE plm_formulas
  ADD COLUMN exposure_type text CHECK (exposure_type IN ('LEAVE_ON','RINSE_OFF'));

-- 4) 알러젠 계산 결과 테이블 (plm_regulatory_alerts와 동일 패턴)
CREATE TABLE plm_allergen_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_code text NOT NULL,
  revision text NOT NULL,
  formula_name text,
  exposure_type text,
  allergen_id uuid REFERENCES plm_allergen_master(id),
  allergen_name_kr text,
  allergen_name_en text,
  formula_percent numeric,
  threshold_percent numeric,
  label_required boolean,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) 기존 SINGLE 원료 백필: 상위 INCI 필드를 components row 1개로 복제
INSERT INTO plm_raw_material_components
  (raw_code, component_no, inci_kr, inci_en, cas_no, ec_no, composition_percent, function_kr, function_en)
SELECT raw_code, 1, inci_kr, inci_en, cas_no, ec_no, 100, function_kr, function_en
FROM plm_raw_materials rm
WHERE NOT EXISTS (
  SELECT 1 FROM plm_raw_material_components c WHERE c.raw_code = rm.raw_code
);
