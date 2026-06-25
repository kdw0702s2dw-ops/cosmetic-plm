# PLM Enterprise Phase 2 적용법

## 적용
압축을 풀면 아래 파일이 있습니다.

```text
app/enterprise/page.tsx
```

현재 프로젝트 루트에 그대로 복사하세요.

최종 구조:

```text
cosmetic-plm-web
└─ app
   ├─ page.tsx
   └─ enterprise
      └─ page.tsx
```

## 기존 src 폴더 관련
이전 단계에서 `src/app/enterprise`, `src/modules`, `src/shared`를 복사했다면 현재 구조에서는 사용하지 않습니다.
`/enterprise` 정상 확인 후 혼선 방지를 위해 삭제해도 됩니다.

## 실행
```bash
npm run build
npm run dev
```

## 접속
```text
http://localhost:3000/enterprise
```

## Git 반영
```bash
git add .
git commit -m "add enterprise phase2 module migration hub"
git push
```
