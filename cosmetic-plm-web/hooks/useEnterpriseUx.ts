"use client";

import { useEffect, useState } from "react";
import { fetchEnterpriseUxDashboard } from "@/services/enterprise-ux/enterpriseUxService";
import type { UxKpi, UxModule, UxWorkItem } from "@/types/enterpriseUx";

export function useEnterpriseUx() {
  const [kpis, setKpis] = useState<UxKpi[]>([]);
  const [modules, setModules] = useState<UxModule[]>([]);
  const [workItems, setWorkItems] = useState<UxWorkItem[]>([]);
  const [message, setMessage] = useState("Professional UX Dashboard 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEnterpriseUxDashboard();
      setKpis(data.kpis);
      setModules(data.modules);
      setWorkItems(data.workItems);
      setMessage("Enterprise Professional UX 데이터 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dashboard 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { kpis, modules, workItems, message, loading, load };
}
