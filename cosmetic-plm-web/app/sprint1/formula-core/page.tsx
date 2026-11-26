import AuthGate from "@/components/sprint1/AuthGate";
import FormulaCorePanel from "@/components/sprint1/FormulaCorePanel";

export default function Page() {
  return (
    <AuthGate pageKey="formula">
      <FormulaCorePanel />
    </AuthGate>
  );
}
