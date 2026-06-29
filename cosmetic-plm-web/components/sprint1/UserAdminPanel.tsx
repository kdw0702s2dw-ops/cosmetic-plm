"use client";

import { useSprint1UserAdmin } from "@/hooks/useSprint1UserAdmin";
import { useSprint1Auth } from "@/hooks/useSprint1Auth";
import type { PlmRole } from "@/services/sprint1/authRbacService";
import "@/styles/enterprise-v50.css";

const roles: PlmRole[] = ["Admin", "Researcher", "QA", "Viewer"];

export default function UserAdminPanel() {
  const admin = useSprint1UserAdmin();
  const auth = useSprint1Auth();

  if (!auth.canManageUsers) {
    return (
      <div className="v50-page">
        <section className="v50-panel">
          <h1 className="v50-title">접근 권한이 없습니다</h1>
          <p className="v50-desc">사용자 관리는 Admin만 접근할 수 있습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="v50-page">
      <section className="v50-hero">
        <div>
          <h1 className="v50-title">사용자 권한관리</h1>
          <p className="v50-desc">관리자가 Supabase Auth에서 생성한 계정의 역할과 활성 상태를 관리합니다.</p>
        </div>
        <button className="v50-button" onClick={admin.load} disabled={admin.loading}>새로고침</button>
      </section>

      <p style={{ color: "#2563eb", fontWeight: 900 }}>{admin.message}</p>

      <section className="v50-panel">
        <h2>사용자 목록</h2>
        <div className="v50-table-wrap">
          <table className="v50-table">
            <thead>
              <tr><th>이메일</th><th>이름</th><th>역할</th><th>활성</th><th>수정</th></tr>
            </thead>
            <tbody>
              {admin.users.map((u) => (
                <UserRow key={u.id} user={u} onSave={admin.updateRole} />
              ))}
              {admin.users.length === 0 && (
                <tr><td colSpan={5}>아직 사용자 프로필이 없습니다. 사용자가 1회 로그인하면 자동 생성됩니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="v50-panel">
        <h2>관리자 계정 생성 안내</h2>
        <ol style={{ lineHeight: 1.8, color: "#334155" }}>
          <li>Supabase → Authentication → Users에서 이메일/비밀번호로 계정을 생성합니다.</li>
          <li>해당 계정으로 1회 로그인하면 `plm_user_profiles`에 Researcher로 자동 생성됩니다.</li>
          <li>관리자 승격은 SQL로 1회 처리하거나, 기존 Admin이 이 화면에서 역할을 변경합니다.</li>
        </ol>
      </section>
    </div>
  );
}

function UserRow({ user, onSave }: { user: any; onSave: (id: string, role: PlmRole, isActive: boolean) => Promise<void> }) {
  const [role, setRole] = useState<PlmRole>(user.role || "Researcher");
  const [active, setActive] = useState<boolean>(!!user.is_active);

  return (
    <tr>
      <td>{user.email}</td>
      <td>{user.display_name}</td>
      <td>
        <select className="v50-input" value={role} onChange={(e) => setRole(e.target.value as PlmRole)}>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td>
        <select className="v50-input" value={active ? "Y" : "N"} onChange={(e) => setActive(e.target.value === "Y")}>
          <option value="Y">활성</option>
          <option value="N">비활성</option>
        </select>
      </td>
      <td><button className="v50-button-light" onClick={() => onSave(user.id, role, active)}>저장</button></td>
    </tr>
  );
}

import { useState } from "react";
