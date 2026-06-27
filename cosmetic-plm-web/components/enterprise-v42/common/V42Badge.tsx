export default function V42Badge({ value }: { value: string }) {
  const cls = `enterprise-v41-badge enterprise-v41-badge-${String(value).toLowerCase()}`;
  return <span className={cls}>{value}</span>;
}
