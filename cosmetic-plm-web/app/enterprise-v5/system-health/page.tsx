import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import SystemHealthPanel from "@/components/enterprise-v50/common/SystemHealthPanel";

export default function SystemHealthRoutePage() {
  return (
    <V51StandaloneShell
      title="시스템 점검"
      description="v5.1 운영에 필요한 핵심 DB와 릴리즈 적용 상태를 점검합니다."
    >
      <SystemHealthPanel />
    </V51StandaloneShell>
  );
}
