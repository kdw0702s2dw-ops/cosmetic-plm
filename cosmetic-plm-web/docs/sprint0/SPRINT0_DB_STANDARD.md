# Sprint 0 - DB 표준화 기준

## 목표
새 기능 추가를 중단하고 실제 운영 가능한 PLM 기반을 고정합니다.

## 표준 테이블
- `plm_raw_materials`: 원료 마스터 1개 표준 테이블
- `plm_raw_material_components`: 복합원료 구성성분
- `plm_formulas`: 처방 Header
- `plm_formula_lines`: 처방 BOM
- `plm_formula_revisions`: Revision 이력
- `plm_documents`: 문서 마스터
- `plm_user_profiles`: 사용자/권한
- `plm_audit_logs`: 감사 로그
- `plm_table_archive_registry`: 기존 중복 테이블 보관 후보

## 원칙
기존 테이블은 삭제하지 않고, 표준 테이블로 안전 이관 후 Archive Registry에만 등록합니다.
