import AuthGate from "@/components/sprint1/AuthGate";
import UserAdminPanel from "@/components/sprint1/UserAdminPanel";

export default function AdminUsersPage() {
  return (
    <AuthGate>
      <UserAdminPanel />
    </AuthGate>
  );
}
