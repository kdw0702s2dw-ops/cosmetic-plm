# Sprint 2-7 글로벌 규제검증

포함:
- 국가별 규칙 테이블: `plm_regulatory_rules`
- 규제 경고 테이블: `plm_regulatory_alerts`
- 지원 국가: 한국, EU, 중국, 미국, 일본, ASEAN
- 처방 선택 검증
- 최근 처방 일괄 검증
- 경고 상태 관리: OPEN, CONFIRMED, RESOLVED, IGNORED
- 연구원 홈 규제 알림 연동
- `/enterprise` 글로벌 규제검증 메뉴 연결

중요:
- SQL에 포함된 규칙은 초기 검증용 샘플 데이터입니다.
- 실제 운영 전에는 공식 규제자료 기반으로 룰을 검증/교체해야 합니다.
