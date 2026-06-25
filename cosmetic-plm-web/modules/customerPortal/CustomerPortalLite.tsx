import EnterpriseCard from "@/shared/ui/EnterpriseCard";

export default function CustomerPortalLite() {
  return (
    <EnterpriseCard title="v35.0 Customer Portal Lite">
      <p style={{ color: "#6b7280" }}>고객사별 프로젝트 현황, 제출자료, 승인상태를 공유하는 고객 대응 화면입니다.</p>
      <ul>
        <li>고객별 프로젝트 리스트</li>
        <li>진행률/상태 공유</li>
        <li>제출 패키지 이력</li>
        <li>외부 공유용 CSV 리포트</li>
      </ul>
    </EnterpriseCard>
  );
}
