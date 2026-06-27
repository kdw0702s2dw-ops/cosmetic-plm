import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import EnterpriseKnowledgeDbDashboard from "@/components/enterprise-knowledge-db/EnterpriseKnowledgeDbDashboard";

export default function Page() {
  return (
    <EnterpriseShell>
      <EnterpriseKnowledgeDbDashboard />
    </EnterpriseShell>
  );
}
