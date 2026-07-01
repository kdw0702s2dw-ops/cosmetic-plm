import AuthGate from "@/components/sprint1/AuthGate";
import RawMaterialManager from "@/components/sprint2/RawMaterialManager";
export default function Page() {
  return (
    <AuthGate>
      <RawMaterialManager />
    </AuthGate>
  );
}
