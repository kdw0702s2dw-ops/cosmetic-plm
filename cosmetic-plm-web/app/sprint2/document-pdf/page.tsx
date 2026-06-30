import AuthGate from "@/components/sprint1/AuthGate";
import DocumentPdfPanel from "@/components/sprint2/DocumentPdfPanel";

export default function Page() {
  return (
    <AuthGate>
      <DocumentPdfPanel />
    </AuthGate>
  );
}
