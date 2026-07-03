"use client";

import { useEffect, useState } from "react";
import {
  createUserAccount,
  deleteUserAccount,
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

  async function createUser(input: { email: string; password: string; role: PlmRole; display_name?: string }) {
    setLoading(true);
    try {
      const user = await createUserAccount(input);
      await load();
      setMessage(`${user.email} 계정 생성 완료`);
      return { error: null };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "사용자 생성 오류";
      setMessage(msg);
      return { error: msg };
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`${email} 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    setLoading(true);
    try {
      await deleteUserAccount(id);
      await load();
      setMessage(`${email} 계정 삭제 완료`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사용자 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { users, message, loading, load, updateRole, createUser, deleteUser };
}
