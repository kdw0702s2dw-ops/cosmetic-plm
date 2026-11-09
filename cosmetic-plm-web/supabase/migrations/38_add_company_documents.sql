-- 업체(공급사)별 통장사본/사업자등록증을 한 번 업로드해두면, 발주서 출력 시 자동으로 다운로드할 수
-- 있게 해서 발주 내부 승인마다 매번 공급사에 다시 요청하는 수고를 없앤다. 계좌번호/사업자등록번호가
-- 들어있는 민감한 서류라 저장은 비공개 Storage 버킷(company-documents)을 쓰고, 열람도 로그인한
-- 사용자(plm_companies 조회 권한과 동일한 역할)로 제한한다.
create table if not exists public.plm_company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.plm_companies(id) on delete cascade,
  doc_type text not null check (doc_type in ('BANKBOOK','BUSINESS_REG')),
  file_name text not null,
  storage_path text not null,
  file_size bigint,
  uploaded_at timestamptz not null default now(),
  uploaded_by text,
  unique (company_id, doc_type)
);

alter table public.plm_company_documents enable row level security;

create policy plm_company_documents_read on public.plm_company_documents
  for select using (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text, 'QA'::text, 'Viewer'::text, 'Production'::text]));

create policy plm_company_documents_write on public.plm_company_documents
  for all using (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text]))
  with check (plm_has_role(ARRAY['Admin'::text, 'Researcher'::text]));

-- 비공개 Storage 버킷 - public=false로 생성, URL만으로는 접근 불가. 업로드(CompanyManager)와
-- 다운로드(.storage.from(bucket).download())는 모두 인증된 클라이언트 세션으로 아래 RLS를 그대로 적용받는다.
insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do nothing;

create policy company_documents_select on storage.objects
  for select using (bucket_id = 'company-documents' and plm_has_role(ARRAY['Admin'::text, 'Researcher'::text, 'QA'::text, 'Viewer'::text, 'Production'::text]));

create policy company_documents_insert on storage.objects
  for insert with check (bucket_id = 'company-documents' and plm_has_role(ARRAY['Admin'::text, 'Researcher'::text]));

create policy company_documents_update on storage.objects
  for update using (bucket_id = 'company-documents' and plm_has_role(ARRAY['Admin'::text, 'Researcher'::text]));

create policy company_documents_delete on storage.objects
  for delete using (bucket_id = 'company-documents' and plm_has_role(ARRAY['Admin'::text, 'Researcher'::text]));
