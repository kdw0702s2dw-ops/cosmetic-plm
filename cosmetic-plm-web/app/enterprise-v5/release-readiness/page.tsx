import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import ReleaseReadinessProPanel from "@/components/enterprise-v50/common/ReleaseReadinessProPanel";

export default function ReleaseReadinessRoutePage() {
  return (
    <V51StandaloneShell
      title="출시 준비도 PRO"
      description="처방, 검증, 원가, 문서, Batch, 리스크를 종합해 Go/No-Go를 판단합니다."
    >
      <ReleaseReadinessProPanel />
    </V51StandaloneShell>
  );
}
