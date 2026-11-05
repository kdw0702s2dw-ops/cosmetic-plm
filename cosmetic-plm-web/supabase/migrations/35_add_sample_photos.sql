-- 품질관리(시료 목록) 시료 사진 + 처방관리(Revision별) 샘플 사진 추가.
-- 원격 적용 마이그레이션명: add_stability_test_sample_photos, add_formula_sample_photos

-- 1) plm_stability_tests에 image_urls(여러 장 지원) 컬럼 추가 - 체크포인트별 photo_urls(StabilityCheckpoint)와는
--    별개 필드. 버킷은 체크포인트 사진과 동일한 기존 stability-test-photos를 재사용(RLS도 이미
--    Admin/Researcher/QA로 canWriteQuality와 일치해서 추가 정책 불필요).
alter table public.plm_stability_tests
  add column if not exists image_urls text[] not null default '{}'::text[];

comment on column public.plm_stability_tests.image_urls is '시료(샘플) 사진(여러 장 가능) - Supabase Storage(stability-test-photos 버킷, 체크포인트 사진과 동일 버킷) 공개 URL 목록';

-- 2) plm_formulas에 image_urls(여러 장 지원) 컬럼 추가 - Revision별로 전달받은 실물 샘플 사진.
alter table public.plm_formulas
  add column if not exists image_urls text[] not null default '{}'::text[];

comment on column public.plm_formulas.image_urls is '처방(Revision)별 전달 샘플 사진(여러 장 가능) - Supabase Storage(formula-sample-photos 버킷) 공개 URL 목록';

-- 3) formula-sample-photos 버킷 생성 - material-photos/stability-test-photos와 동일하게 public
insert into storage.buckets (id, name, public)
values ('formula-sample-photos', 'formula-sample-photos', true)
on conflict (id) do nothing;

-- 4) RLS: 조회는 누구나, 업로드/수정/삭제는 plm_formulas 쓰기 권한(Admin/Researcher, canWriteFormula와
--    동일 기준)만 - material_photos_* 정책과 동일 패턴.
create policy formula_sample_photos_select on storage.objects
  for select to public
  using (bucket_id = 'formula-sample-photos');

create policy formula_sample_photos_upload on storage.objects
  for insert to public
  with check (bucket_id = 'formula-sample-photos' and plm_has_role(array['Admin','Researcher']));

create policy formula_sample_photos_update on storage.objects
  for update to public
  using (bucket_id = 'formula-sample-photos' and plm_has_role(array['Admin','Researcher']));

create policy formula_sample_photos_delete on storage.objects
  for delete to public
  using (bucket_id = 'formula-sample-photos' and plm_has_role(array['Admin','Researcher']));
