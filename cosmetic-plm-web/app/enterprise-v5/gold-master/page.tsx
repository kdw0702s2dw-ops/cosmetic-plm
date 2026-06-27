import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import GoldMasterCompletionPanel from "@/components/enterprise-v50/common/GoldMasterCompletionPanel";

export default function GoldMasterPage() {
  return (
    <V51StandaloneShell
      title="v5.1 GOLD MASTER"
      description="Enterprise PLM v5.1의 운영 준비 상태와 완성도를 점검합니다."
    >
      <GoldMasterCompletionPanel />
    </V51StandaloneShell>
  );
}
