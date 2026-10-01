-- 출고관리의 "고객사" 입력칸을 원료관리 Manufacturer/Supplier와 동일하게 업체관리(plm_companies)
-- 자동완성 + 그 자리에서 신규 등록이 되도록 연동한다.

-- 1) 업체 구분에 "고객사" 추가 (기존: 원료사/브랜드사/제조사/공급사)
alter table plm_companies drop constraint plm_companies_category_check;
alter table plm_companies add constraint plm_companies_category_check
  check (category <@ array['원료사','브랜드사','제조사','공급사','고객사']);

-- 2) 출고 기록에 업체 FK 추가 (plm_raw_materials.manufacturer_company_id/supplier_company_id와 동일 패턴)
--    customer(텍스트)는 그대로 두고, 자동완성에서 선택한 경우에만 이 값이 채워짐(직접 입력 시 null)
alter table plm_shipment_records add column if not exists customer_company_id uuid references plm_companies(id);
comment on column plm_shipment_records.customer_company_id is '고객사 자동완성에서 선택한 plm_companies.id - 직접 입력한 경우 null';

-- 3) 출고관리는 Production 역할도 입력 가능한 화면인데, 그 안의 고객사 자동완성이 plm_companies를
--    조회해야 하므로 Production에게도 읽기 권한을 열어준다 (쓰기/신규 업체 등록은 기존대로
--    Admin/Researcher만 가능하도록 plm_companies_write는 그대로 둠 - 신규 고객사가 없으면 Admin/
--    Researcher에게 등록을 요청해야 함).
drop policy if exists plm_companies_read on plm_companies;
create policy plm_companies_read on plm_companies for select
  using (plm_has_role(array['Admin','Researcher','QA','Viewer','Production']));
