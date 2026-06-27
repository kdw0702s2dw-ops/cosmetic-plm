import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import SmartDocumentBatchBridgePanel from "@/components/enterprise-v50/common/SmartDocumentBatchBridgePanel";

export default function SmartBridgeRoutePage() {
  return (
    <V51StandaloneShell
      title="스마트 문서·Batch"
      description="Smart Formula Engine 계산 결과를 문서와 Batch로 연결합니다."
    >
      <SmartDocumentBatchBridgePanel />
    </V51StandaloneShell>
  );
}
