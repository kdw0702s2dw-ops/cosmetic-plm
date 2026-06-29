"use client";

import FormulaCorePanel from "@/components/sprint1/FormulaCorePanel";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import "@/styles/enterprise-v50.css";

export default function FormulaCoreWithAuthPanel() {
  const auth = useSprint1Auth();

  if (!auth.canWriteFormula && auth.profile?.role) {
    return (
      <div>
        <section className="v50-panel" style={{ marginBottom: 16 }}>
          <h2>읽기 전용 모드</h2>
          <p style={{ color: "#64748b" }}>
            현재 역할은 {auth.profile.role}입니다. 조회는 가능하지만 등록/수정/삭제는 Sprint 1-4에서 버튼 단위로 제한됩니다.
          </p>
        </section>
        <FormulaCorePanel />
      </div>
    );
  }

  return <FormulaCorePanel />;
}
