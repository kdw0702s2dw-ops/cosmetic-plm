export default function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "white", marginBottom: 18 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </section>
  );
}
