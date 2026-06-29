import AuthGate from "@/components/sprint1/AuthGate";
import RawMaterialCorePanel from "@/components/sprint2/RawMaterialCorePanel";

export default function Page() {
  return (
    <AuthGate>
      <RawMaterialCorePanel />
    </AuthGate>
  );
}
