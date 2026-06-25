export default function EnterpriseCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px",
        background: "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "18px" }}>{title}</h2>
      {children}
    </section>
  );
}
