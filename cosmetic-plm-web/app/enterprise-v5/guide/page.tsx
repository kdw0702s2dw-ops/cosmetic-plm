import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import V51UserGuidePanel from "@/components/enterprise-v50/common/V51UserGuidePanel";

export default function GuidePage() {
  return (
    <V51StandaloneShell
      title="v5.1 사용 가이드"
      description="연구원 업무 흐름에 따라 v5.1 핵심 기능을 테스트하고 사용할 수 있습니다."
    >
      <V51UserGuidePanel />
    </V51StandaloneShell>
  );
}
