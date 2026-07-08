-- plm_allergen_master의 CAS/EC/국문명을 plm_ingredient_dictionary(기존 검증 데이터, source='plm_raw_materials')와
-- INCI 영문명 매칭으로 채움. 매칭 안 되는 항목은 그대로 비워둠 (임의로 CAS 번호를 채우지 않음 - 공식 자료로 별도 확인 필요)
UPDATE plm_allergen_master am
SET cas_no = d.cas_no,
    ec_no = d.ec_no,
    allergen_name_kr = coalesce(am.allergen_name_kr, d.inci_kr),
    updated_at = now()
FROM plm_ingredient_dictionary d
WHERE lower(trim(d.inci_en)) = lower(trim(am.allergen_name_en))
  AND d.cas_no IS NOT NULL
  AND d.source = 'plm_raw_materials';
