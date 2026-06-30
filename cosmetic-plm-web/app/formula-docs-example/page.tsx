'use client';

// ============================================================
// 처방 상세 페이지에서 전성분 문서를 보여주는 "예시" 페이지입니다.
// 이미 처방 상세 페이지가 있다면, 아래 import 1줄과
// <IngredientDocuments formulaId={...} /> 1줄만 그 페이지에 추가하면 됩니다.
// ============================================================

import IngredientDocuments from '@/components/IngredientDocuments';

// formulaId 는 실제로는 처방 목록에서 클릭한 처방의 id를 넘기게 됩니다.
// 아래는 단독 테스트용으로 하드코딩한 예시입니다.
// (DB에 있던 실제 처방 id 중 하나입니다. 본인 처방 id로 바꾸세요.)
const EXAMPLE_FORMULA_ID = '1fa0a778-a51e-4b6d-9f53-d96798414484';

export default function FormulaDocsExamplePage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-xl font-bold">전성분 문서</h1>
      <p className="mb-5 text-sm text-neutral-500">
        처방을 기준으로 복합성분표 · 단일성분표 · 전성분표가 자동 생성됩니다.
      </p>

      <IngredientDocuments formulaId={EXAMPLE_FORMULA_ID} />
    </main>
  );
}
