-- ============================================================
-- Sprint 0: RLS 정책 정리 SQL
-- 목표: (1) 비로그인(anon) 접근 차단  (2) USING(true) 제거  (3) 중복 정책 제거
--
-- ⚠️ 적용 전 필독
--  - Supabase SQL Editor에서 STEP 단위로 하나씩 실행하며 결과를 확인하세요.
--  - 각 STEP 실행 후, 앱에서 로그인→처방 조회가 되는지 바로 테스트하세요.
--  - 문제가 생기면 맨 아래 "롤백" 섹션으로 즉시 되돌릴 수 있습니다.
--  - 이 SQL은 핵심 6개 테이블만 다룹니다. 빈 enterprise_* 테이블 160개는
--    건드리지 않습니다(사용 안 하므로 우선순위 낮음).
-- ============================================================


-- ============================================================
-- STEP 1. 현재 상태 백업 (실행 → 결과를 따로 저장해두세요)
-- ============================================================
select tablename, policyname, cmd, roles::text, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('formulas','formula_items','raw_materials','raw_compositions','ingredients')
order by tablename, cmd;


-- ============================================================
-- STEP 2. 기존 "전체 허용 / anon 허용" 정책 삭제
-- (plm_user_profiles 는 이미 올바르므로 건드리지 않습니다)
-- ============================================================
drop policy if exists "allow select formulas"        on public.formulas;
drop policy if exists "allow insert formulas"         on public.formulas;
drop policy if exists "allow update formulas"         on public.formulas;
drop policy if exists "allow delete formulas"         on public.formulas;

drop policy if exists "allow select formula items"    on public.formula_items;
drop policy if exists "allow insert formula items"    on public.formula_items;
drop policy if exists "allow update formula items"    on public.formula_items;
drop policy if exists "allow delete formula items"    on public.formula_items;

drop policy if exists "allow select raw materials"    on public.raw_materials;
drop policy if exists "allow insert raw materials"    on public.raw_materials;
drop policy if exists "allow update raw materials"    on public.raw_materials;
drop policy if exists "allow delete raw materials"    on public.raw_materials;

drop policy if exists "allow select raw compositions" on public.raw_compositions;
drop policy if exists "allow insert raw compositions" on public.raw_compositions;

drop policy if exists "allow select ingredients"      on public.ingredients;
drop policy if exists "allow insert ingredients"      on public.ingredients;


-- ============================================================
-- STEP 3. 새 정책: "로그인한 연구원 이상"만 접근 (authenticated 전용)
--
-- 설계 방침 (연구팀 내부 공유용이므로):
--  - 조회/등록/수정: 로그인한 모든 활성 연구원 허용 (팀 공유가 목적)
--  - 삭제: 관리자(plm_is_admin)만 허용 (실수 방지)
--  - anon(비로그인) 은 전부 차단
-- ============================================================

-- 활성 사용자 여부 헬퍼 (비활성 계정 차단)
create or replace function public.plm_is_active_user()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.plm_user_profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- ---- formulas ----
create policy "formulas_select" on public.formulas
  for select to authenticated using (plm_is_active_user());
create policy "formulas_insert" on public.formulas
  for insert to authenticated with check (plm_is_active_user());
create policy "formulas_update" on public.formulas
  for update to authenticated using (plm_is_active_user()) with check (plm_is_active_user());
create policy "formulas_delete" on public.formulas
  for delete to authenticated using (plm_is_admin());

-- ---- formula_items ----
create policy "formula_items_select" on public.formula_items
  for select to authenticated using (plm_is_active_user());
create policy "formula_items_insert" on public.formula_items
  for insert to authenticated with check (plm_is_active_user());
create policy "formula_items_update" on public.formula_items
  for update to authenticated using (plm_is_active_user()) with check (plm_is_active_user());
create policy "formula_items_delete" on public.formula_items
  for delete to authenticated using (plm_is_active_user());

-- ---- raw_materials ----
create policy "raw_materials_select" on public.raw_materials
  for select to authenticated using (plm_is_active_user());
create policy "raw_materials_insert" on public.raw_materials
  for insert to authenticated with check (plm_is_active_user());
create policy "raw_materials_update" on public.raw_materials
  for update to authenticated using (plm_is_active_user()) with check (plm_is_active_user());
create policy "raw_materials_delete" on public.raw_materials
  for delete to authenticated using (plm_is_admin());

-- ---- raw_compositions ----
create policy "raw_compositions_select" on public.raw_compositions
  for select to authenticated using (plm_is_active_user());
create policy "raw_compositions_insert" on public.raw_compositions
  for insert to authenticated with check (plm_is_active_user());
create policy "raw_compositions_update" on public.raw_compositions
  for update to authenticated using (plm_is_active_user()) with check (plm_is_active_user());
create policy "raw_compositions_delete" on public.raw_compositions
  for delete to authenticated using (plm_is_active_user());

-- ---- ingredients ----
create policy "ingredients_select" on public.ingredients
  for select to authenticated using (plm_is_active_user());
create policy "ingredients_insert" on public.ingredients
  for insert to authenticated with check (plm_is_active_user());
create policy "ingredients_update" on public.ingredients
  for update to authenticated using (plm_is_active_user()) with check (plm_is_active_user());


-- ============================================================
-- STEP 4. 검증 (실행 → anon 정책이 사라졌는지 확인)
-- 결과에 roles 가 전부 {authenticated} 여야 합니다. {anon}/{public} 이 남아있으면 안 됨.
-- ============================================================
select tablename, policyname, cmd, roles::text, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('formulas','formula_items','raw_materials','raw_compositions','ingredients')
order by tablename, cmd;


-- ============================================================
-- 롤백 (문제 발생 시: STEP 2~3을 되돌려 다시 전체 허용으로)
-- 아래 주석을 풀고 실행하면 임시로 로그인 사용자 전체 허용으로 복구됩니다.
-- (anon 복구는 보안상 권장하지 않으므로 제외)
-- ============================================================
-- create policy "rollback_formulas_all" on public.formulas
--   for all to authenticated using (true) with check (true);
-- create policy "rollback_formula_items_all" on public.formula_items
--   for all to authenticated using (true) with check (true);
-- create policy "rollback_raw_materials_all" on public.raw_materials
--   for all to authenticated using (true) with check (true);
-- create policy "rollback_raw_compositions_all" on public.raw_compositions
--   for all to authenticated using (true) with check (true);
-- create policy "rollback_ingredients_all" on public.ingredients
--   for all to authenticated using (true) with check (true);
