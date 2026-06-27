"use client";

import { useEffect, useState } from "react";
import { buildWorkflowSteps, fetchWorkflowSummary } from "@/services/enterprise-workflow/enterpriseWorkflowService";
import type { WorkflowStep, WorkflowSummary } from "@/types/enterpriseWorkflow";

export function useEnterpriseWorkflow() {
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [message, setMessage] = useState("Workflow Center 준비 완료");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchWorkflowSummary();
      setSummary(data);
      setSteps(buildWorkflowSteps(data));
      setMessage("Workflow 데이터 조회 완료");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Workflow 조회 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { summary, steps, message, loading, load };
}
