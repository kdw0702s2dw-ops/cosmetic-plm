-- 전성분관리(plm_ingredient_dictionary)에 주의성분 체크 + 사유 필드 추가
-- 이미 DB에 적용 완료. 재현/백업용.

alter table plm_ingredient_dictionary
  add column if not exists is_caution boolean not null default false,
  add column if not exists caution_note text;

-- 반환 타입(컬럼 구성)이 바뀌므로 기존 함수를 먼저 제거하고 다시 만든다
drop function if exists public.plm_search_ingredients(text);

-- 원료관리 구성성분 INCI 자동완성이 쓰는 함수도 주의성분 여부/사유를 함께 반환하도록 갱신
create function public.plm_search_ingredients(keyword text)
returns table(
  inci_en text, inci_kr text, inci_cn text, inci_jp text,
  cas_no text, ec_no text, function_kr text, function_en text,
  is_caution boolean, caution_note text
)
language sql
stable security definer
set search_path to 'public'
as $$
  select inci_en, inci_kr, inci_cn, inci_jp, cas_no, ec_no, function_kr, function_en, is_caution, caution_note
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
