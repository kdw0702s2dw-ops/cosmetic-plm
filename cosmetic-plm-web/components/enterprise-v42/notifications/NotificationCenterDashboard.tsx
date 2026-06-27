"use client";

import EnterpriseShell from "@/components/enterprise-ux/common/EnterpriseShell";
import { useNotifications } from "@/hooks/useEnterpriseV42";
import V42Badge from "../common/V42Badge";

export default function NotificationCenterDashboard() {
  const s = useNotifications();
  return (
    <EnterpriseShell>
      <section className="enterprise-v41-hero">
        <div>
          <h1 className="enterprise-v41-title">Notification Center</h1>
          <p className="enterprise-v41-subtitle">검증 실패, 문서 승인, AI Action 등 운영 알림을 관리합니다.</p>
        </div>
        <button className="enterprise-v41-button" onClick={s.generate}>Generate System Notifications</button>
      </section>
      <p style={{ color: "#2563eb", fontWeight: 800 }}>{s.message}</p>
      <section className="enterprise-v41-panel">
        <div className="enterprise-v41-table-wrap">
          <table className="enterprise-v41-table">
            <thead><tr><th>Priority</th><th>Area</th><th>Title</th><th>Message</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {s.rows.map((n) => (
                <tr key={n.id}>
                  <td><V42Badge value={n.priority} /></td>
                  <td>{n.area}</td>
                  <td>{n.title}</td>
                  <td>{n.message}</td>
                  <td><V42Badge value={n.status} /></td>
                  <td><button className="enterprise-v41-button-secondary" onClick={() => s.mark(n.id, "READ")}>Read</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </EnterpriseShell>
  );
}
