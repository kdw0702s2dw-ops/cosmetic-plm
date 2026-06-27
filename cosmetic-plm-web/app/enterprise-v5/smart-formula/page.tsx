import V51StandaloneShell from "@/components/enterprise-v50/common/V51StandaloneShell";
import SmartFormulaEnginePanel from "@/components/enterprise-v50/common/SmartFormulaEnginePanel";

export default function SmartFormulaRoutePage() {
  return (
    <V51StandaloneShell
      title="스마트 처방엔진"
      description="총합, 원가, pH, 점도, 전성분, Batch 소요량을 실시간 계산합니다."
    >
      <SmartFormulaEnginePanel />
    </V51StandaloneShell>
  );
}
