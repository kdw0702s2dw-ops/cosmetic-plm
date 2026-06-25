import EnterpriseCard from "@/shared/ui/EnterpriseCard";

export default function SampleFeedbackCenter() {
  return (
    <EnterpriseCard title="v36.0 Sample Request & Feedback Center">
      <p style={{ color: "#6b7280" }}>샘플 요청, 발송, 고객 피드백, Revision 연결 흐름을 관리합니다.</p>
      <ul>
        <li>샘플번호 자동 생성</li>
        <li>발송 차수/수량/일자 관리</li>
        <li>고객 피드백 기록</li>
        <li>피드백 기반 Revision 후보 생성</li>
      </ul>
    </EnterpriseCard>
  );
}
