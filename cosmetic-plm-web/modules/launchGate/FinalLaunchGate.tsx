import EnterpriseCard from "@/shared/ui/EnterpriseCard";

export default function FinalLaunchGate() {
  return (
    <EnterpriseCard title="v39.0 Final Launch Readiness Gate">
      <p style={{ color: "#6b7280" }}>출시 전 QA/RA/원가/문서/승인 상태를 종합 점검합니다.</p>
      <ul>
        <li>출시 가능 점수</li>
        <li>QA/RA 승인 확인</li>
        <li>문서 완성도 확인</li>
        <li>Launch Blocker 표시</li>
      </ul>
    </EnterpriseCard>
  );
}
