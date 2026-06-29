"use client";

import { useEffect, useState } from "react";
import { fetchSprint0ArchiveRegistry, fetchSprint0Status } from "@/services/platform/sprint0Service";

export function useSprint0Status() {
  const [status, setStatus] = useState<any | null>(null);
  const [archive, setArchive] = useState<any[]>([]);
  const [message, setMessage] = useState("Sprint 0 점검 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([fetchSprint0Status(), fetchSprint0ArchiveRegistry()]);
      setStatus(s);
      setArchive(a);
      setMessage(`Sprint 0 점검 완료: ${s.overall}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sprint 0 점검 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  return { status, archive, message, loading, load };
}
