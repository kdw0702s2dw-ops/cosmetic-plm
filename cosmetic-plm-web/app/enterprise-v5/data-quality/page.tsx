import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import DataQualityPanel from "@/components/enterprise-v50/common/DataQualityPanel";

export default function DataQualityPage() {
  return (
    <V51StandaloneShell
      title="데이터 품질 점검"
      description="원료, 처방, INCI, CAS, 단가, 총합 오류를 점검합니다."
    >
      <DataQualityPanel />
    </V51StandaloneShell>
  );
}
