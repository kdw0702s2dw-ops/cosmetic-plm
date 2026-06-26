# Real DB Operation Pack

검증 완료 데이터를 실제 Supabase 운영 테이블로 반영하기 위한 패키지입니다.

Included:
1. Supabase Table Connections
2. Import Execution
3. Operation Dashboard Metrics
4. Search Index Preparation
5. Correction Actions
6. Actual operation master tables:
   - enterprise_raw_material_master
   - enterprise_inci_master
   - enterprise_formula_master
   - enterprise_regulation_rules

Apply:
1. 압축 해제
2. cosmetic-plm-web 폴더에 덮어쓰기
3. Supabase SQL Editor에서 supabase/migrations/real_db_operation_pack.sql 실행
4. npm run build
5. git add .
6. git commit -m "add real db operation pack"
7. git push
