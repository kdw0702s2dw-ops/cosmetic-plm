import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import EnterpriseAiRecommendationDashboard from "@/components/enterprise-ai-recommendation/EnterpriseAiRecommendationDashboard";

export default function Page() {
  return (
    <EnterpriseShell>
      <EnterpriseAiRecommendationDashboard />
    </EnterpriseShell>
  );
}
