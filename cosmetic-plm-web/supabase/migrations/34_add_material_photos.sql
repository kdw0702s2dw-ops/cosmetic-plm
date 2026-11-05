-- 부자재 사진 첨부/미리보기 기능 추가.
-- 원격 적용 마이그레이션명: add_material_photos

-- 1) plm_materials에 image_urls(여러 장 지원) 컬럼 추가 - photo_urls(plm_raw_material_purchase_order_items)와
--    동일한 패턴(text[], Supabase Storage 공개 URL 목록).
alter table public.plm_materials
  add column if not exists image_urls text[] not null default '{}'::text[];

comment on column public.plm_materials.image_urls is '부자재 사진(여러 장 가능) - Supabase Storage(material-photos 버킷) 공개 URL 목록';

-- 2) material-photos 버킷 생성 - purchase-order-inspection-photos/stability-test-photos와 동일하게 public
insert into storage.buckets (id, name, public)
values ('material-photos', 'material-photos', true)
on conflict (id) do nothing;

-- 3) RLS: 조회는 누구나(공개 URL로 문서/화면에 바로 노출해야 하므로), 업로드/수정/삭제는 plm_materials
--    쓰기 권한(Admin/Researcher, canWriteMaterials와 동일 기준)만 - po_inspection_photos_* 정책과 동일 패턴.
create policy material_photos_select on storage.objects
  for select to public
  using (bucket_id = 'material-photos');

create policy material_photos_upload on storage.objects
  for insert to public
  with check (bucket_id = 'material-photos' and plm_has_role(array['Admin','Researcher']));

create policy material_photos_update on storage.objects
  for update to public
  using (bucket_id = 'material-photos' and plm_has_role(array['Admin','Researcher']));

create policy material_photos_delete on storage.objects
  for delete to public
  using (bucket_id = 'material-photos' and plm_has_role(array['Admin','Researcher']));
