-- ============================================================
-- 전성분 문서 3종 자동생성용 뷰 (이미 적용됨 — 재현/백업용)
-- 새 테이블 없음. 기존 테이블 조인 + 계산만.
-- ============================================================

-- 복합성분표: 처방 × 원료 구성성분 전개. 최종함량 = 투입량 × 구성비 ÷ 100
create or replace view v_composite_breakdown as
select
  f.id              as formula_id,
  f.formula_code,
  f.formula_name,
  rm.raw_code,
  rm.raw_name,
  fi.percentage     as input_pct,
  ing.inci_name     as inci_en,
  ing.korean_name   as inci_kr,
  rc.percentage     as ratio_pct,
  round(fi.percentage * rc.percentage / 100.0, 6) as final_pct,
  ing.cas_no,
  ing.ec_no
from formula_items fi
join formulas f             on f.id = fi.formula_id
join raw_materials rm       on rm.id = fi.raw_material_id
join raw_compositions rc    on rc.raw_material_id = fi.raw_material_id
join ingredients ing        on ing.id = rc.ingredient_id
where fi.deleted_at is null
  and (rm.deleted_at is null);

-- 단일성분표: 복합성분표를 INCI(국문명) 기준 합산
create or replace view v_single_ingredient as
select
  formula_id,
  formula_code,
  formula_name,
  inci_en,
  inci_kr,
  max(cas_no) as cas_no,
  max(ec_no)  as ec_no,
  round(sum(final_pct), 6) as final_pct
from v_composite_breakdown
group by formula_id, formula_code, formula_name, inci_en, inci_kr;
