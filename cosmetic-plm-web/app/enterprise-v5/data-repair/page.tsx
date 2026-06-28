import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import DataRepairAssistantPanel from "@/components/enterprise-v50/common/DataRepairAssistantPanel";

export default function DataRepairPage() {
  return (
    <V51StandaloneShell
      title="데이터 보정 도우미"
      description="처방 총합, 누락 원료, 단가 NULL 등 운영 전 데이터 오류를 보정합니다."
    >
      <DataRepairAssistantPanel />
    </V51StandaloneShell>
  );
}
