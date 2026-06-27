import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import EnterpriseAiAutopilotDashboard from "@/components/enterprise-ai-autopilot/EnterpriseAiAutopilotDashboard";

export default function Page() {
  return (
    <EnterpriseShell>
      <EnterpriseAiAutopilotDashboard />
    </EnterpriseShell>
  );
}
