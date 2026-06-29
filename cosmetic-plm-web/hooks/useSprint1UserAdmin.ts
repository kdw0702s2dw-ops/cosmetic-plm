"use client";

import { useEffect, useState } from "react";
import {
  fetchUserProfiles,
  updateUserProfileRole,
  type PlmRole,
} from "@/services/sprint1/authRbacService";

export function useSprint1UserAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState("사용자 관리 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchUserProfiles();
      setUsers(data);
      setMessage(`사용자 ${data.length}명 조회 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사용자 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(id: string, role: PlmRole, isActive: boolean) {
    setLoading(true);
    try {
      await updateUserProfileRole(id, role, isActive);
      await load();
      setMessage("사용자 권한 수정 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "권한 수정 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { users, message, loading, load, updateRole };
}
