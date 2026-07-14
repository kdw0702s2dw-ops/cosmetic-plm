-- 전성분관리(plm_ingredient_dictionary) 소프트 삭제 기반 마련
-- 이미 DB에 적용 완료. 재현/백업용.

alter table plm_ingredient_dictionary
  add column is_active boolean not null default true;

-- 원료관리 INCI 자동완성이 이 테이블을 쓰는데, is_active 필터가 없으면
-- 전성분관리에서 삭제(is_active=false)한 항목도 계속 자동완성에 뜨게 되어 필터 추가
create or replace function public.plm_search_ingredients(keyword text)
returns table(inci_en text, inci_kr text, inci_cn text, inci_jp text, cas_no text, ec_no text, function_kr text, function_en text)
language sql
stable security definer
set search_path to 'public'
as $$
  select inci_en, inci_kr, inci_cn, inci_jp, cas_no, ec_no, function_kr, function_en
  from plm_ingredient_dictionary
  where is_active = true
    and (keyword is null or keyword = ''
     or inci_en ilike '%'||keyword||'%'
     or inci_kr ilike '%'||keyword||'%')
  order by
    (case when cas_no is not null and cas_no<>'' then 0 else 1 end),
    inci_kr nulls last
  limit 20;
$$;
