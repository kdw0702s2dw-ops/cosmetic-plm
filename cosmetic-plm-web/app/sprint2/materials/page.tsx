import AuthGate from "@/components/sprint1/AuthGate";
import MaterialManager from "@/components/sprint2/MaterialManager";
export default function Page() {
  return (
    <AuthGate>
      <MaterialManager />
    </AuthGate>
  );
}
