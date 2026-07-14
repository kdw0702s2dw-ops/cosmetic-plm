# 식약처(MFDS) 공공데이터 API 연동 조사 노트

2026-07-14 세션에서 진행한 사전 조사 결과 인계 문서. **코드/DB 변경 없이 조사·테스트 호출만 진행한 상태.**

## 1. 확인된 API 엔드포인트

인증키는 공통으로 `.env.local`의 `MFDS_COSMETIC_API_KEY` 환경변수 사용 (하드코딩 금지, `process.env`에서 읽을 것).

| # | 이름 | 오퍼레이션명 | End Point |
|---|---|---|---|
| 1 | 화장품 원료성분정보 | `getCsmtcsIngdCpntInfoService01` | `https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService01/getCsmtcsIngdCpntInfoService01` |
| 2 | 화장품 사용제한 원료정보 | `getCsmtcsUseRstrcInfoService` | `https://apis.data.go.kr/1471000/CsmtcsUseRstrcInfoService/getCsmtcsUseRstrcInfoService` |
| 3 | 배합금지국가 정보 | `getCsmtcsUseRstrcNatnInfoService` | `https://apis.data.go.kr/1471000/CsmtcsUseRstrcInfoService/getCsmtcsUseRstrcNatnInfoService` |

공통 요청 파라미터: `serviceKey`, `pageNo`, `numOfRows`, `type=json`.

테스트 호출 결과 (각 1회, `numOfRows=5`):
- API 1: 전체 `totalCount=21833`
- API 2: 전체 `totalCount=31191`
- API 3: 전체 `totalCount=6630`

## 2. 응답 필드 ↔ DB 컬럼 매핑

### 2-1. API 1 (원료성분정보) → `plm_ingredient_dictionary`

| API 필드 | DB 컬럼 | 비고 |
|---|---|---|
| INGR_KOR_NAME | inci_kr | |
| INGR_ENG_NAME | inci_en | 값이 null인 표본 있음(예: 가공소금) |
| CAS_NO | cas_no | 한 필드에 복수 CAS가 `\r,` 구분자로 같이 들어오는 경우 있음 (예: 류신 `"328-39-2(DL-)\r,61-90-5(L-)"`) — 그대로 저장할지 분리할지 결정 필요 |
| ORIGIN_MAJOR_KOR_NAME | 대응 컬럼 없음 | "기원 및 정의" 텍스트. 신규 컬럼 또는 별도 텍스트 필드 필요 |
| INGR_SYNONYM | 대응 컬럼 없음 | 이명. 현재 스키마에 없음 |
| (없음) | ec_no | API 응답에 EC No 필드 자체가 없음 |
| (없음) | function_kr / function_en | API에 효능 정보 없음 |
| (고정값) | source | 예: `'mfds_open_api'` |

### 2-2. API 2/3 (사용제한/배합금지국가) → `plm_regulatory_rules`

| API 필드 | DB 컬럼 | 비고 |
|---|---|---|
| COUNTRY_NAME (한국/EU/중국/아세안/대만 등 한글) | region | 코드 변환 필요: 한국→KR, EU→EU, 중국→CN, 아세안→ASEAN. **대만은 매핑 대상 아님(4번 참고)** |
| INGR_STD_NAME | ingredient_name_kr | API 3에는 이 필드 자체가 없음(코드만 있음) |
| INGR_ENG_NAME | ingredient_name_en | API 3에는 없음 |
| CAS_NO | 대응 컬럼 없음 | `plm_regulatory_rules`에 cas_no 컬럼 자체가 없음. 현재 BOM 대조 로직(`matchRule`)이 키워드 텍스트 대조 방식이라 CAS 매칭이 원천적으로 안 되는 구조 |
| INGR_SYNONYM | ingredient_keyword (참고용) | BOM 대조용 키워드 후보로 활용 가능 |
| REGULATE_TYPE (금지/한도) | allowed_status | 금지→BANNED, 한도→LIMITED. "사용가능" 등 다른 값은 이번 표본(각 5건)엔 안 나와서 미확인 |
| NOTICE_INGR_NAME | rule_title | |
| PROVIS_ATRCL | rule_description | 단서조항. 표본 5건은 전부 null이었음 |
| LIMIT_COND | rule_description / source_note (원문 그대로) | 제품 유형별 복수 %가 한 텍스트에 섞여 있는 자유 텍스트. **자동으로 max_percent에 매핑하지 않음(4번 참고)** |
| REGL_CODE / INGR_CODE (API 3만) | rule_code (참고) | 조합해서 고유 rule_code 생성 가능 |

### 2-3. "제한사항"(LIMIT_COND) 필드의 숫자(%) 포함 여부

포함됨. API 3의 `REGULATE_TYPE="한도"` 표본에서 실제 확인:

> "Maximum concentration in ready for use preparation : (a) 1) 8% 2) 11% (b) 5% (c) 2% (d) 11%"

다만 단일 숫자가 아니라 제품 유형(a)~(d)별로 서로 다른 %가 한 텍스트 블록에 섞여 있어, 정규식만으로 "이 규정의 max_percent" 하나를 기계적으로 뽑아내기엔 애매함(어떤 유형을 대표값으로 볼지 판단 필요).

## 3. 확정된 결정사항

1. **대만(TW) 데이터는 이번 연동 범위에서 제외.** `plm_regulatory_rules.region` CHECK 제약(`KR/EU/CN/US/JP/ASEAN`)은 확장하지 않는다.
2. **LIMIT_COND(제한사항)는 자동 파싱하지 않는다.** 원문 그대로 `rule_description` 또는 `source_note`에 저장하고, `max_percent`는 사람이 원문을 검토한 뒤 수동으로 입력한다.
3. **CAS_NO 기반 매칭은 이번 범위 밖.** `plm_regulatory_rules`는 기존과 동일하게 키워드 텍스트 대조 방식(`ingredient_keyword`/`ingredient_name_kr`/`ingredient_name_en`)을 유지한다.

## 4. 보류된 작업

- **전체 데이터셋 기준 CAS 겹침/신규 건수 조사.** API 1 전체 21,833건을 `plm_ingredient_dictionary`(현재 443건, 고유 CAS 247건)와 대조하려면 페이지네이션으로 약 220회 이상 추가 호출이 필요함 — 이번 세션의 "호출 1회" 제약을 벗어나 보류. 5건 표본 기준 겹침은 0건이었으나 통계적으로 의미 없는 수치임.

## 5. 다음 단계 제안 (미승인, 아이디어 단계)

- `plm_regulatory_rules_staging` 같은 스테이징 테이블을 신설.
- Vercel Cron으로 매일 API 1~3을 자동 호출해 신규/변경 데이터를 스테이징 테이블에 적재.
- 사람이 스테이징 데이터를 검토(특히 LIMIT_COND → max_percent 수동 확정, region 매핑 확인)한 뒤 `plm_regulatory_rules`/`plm_ingredient_dictionary`로 승격하는 구조.
- 이력 관리는 기존에 구축된 `plm_regulatory_rule_history` 트리거를 그대로 재사용 가능(승격 시 UPDATE/INSERT가 일어나면 자동으로 이력이 남음).
