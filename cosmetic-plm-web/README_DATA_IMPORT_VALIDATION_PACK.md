# Data Import & Validation Pack

실제 원료/INCI/처방/공급사/규제/LIMS 데이터를 넣기 전에 검증하는 패키지입니다.

Included:
1. Import Templates
2. Column Mapping
3. Validation Rules
4. Validation Results
5. Error Report
6. Import Approval

Apply:
1. 압축 해제
2. cosmetic-plm-web 폴더에 덮어쓰기
3. Supabase SQL Editor에서 supabase/migrations/data_import_validation_pack.sql 실행
4. npm run build
5. git add .
6. git commit -m "add data import validation pack"
7. git push
