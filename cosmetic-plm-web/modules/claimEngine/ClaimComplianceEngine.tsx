import EnterpriseCard from "@/shared/ui/EnterpriseCard";

export default function ClaimComplianceEngine() {
  return (
    <EnterpriseCard title="v37.0 Claim Compliance Engine">
      <p style={{ color: "#6b7280" }}>미백, 주름, 비건, EWG, 논코메도 등 클레임 가능성을 검토합니다.</p>
      <ul>
        <li>클레임별 적합성 점검</li>
        <li>성분 기반 경고</li>
        <li>필요 시험/근거 표시</li>
        <li>고객 요청사항 준수 여부</li>
      </ul>
    </EnterpriseCard>
  );
}
