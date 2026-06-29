import AuthGate from "@/components/sprint1/AuthGate";
import EnterpriseSprint1Workspace from "@/components/sprint1/EnterpriseSprint1Workspace";

export default function EnterprisePage() {
  return (
    <AuthGate>
      <EnterpriseSprint1Workspace />
    </AuthGate>
  );
}
