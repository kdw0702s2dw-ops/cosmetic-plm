"use client";

import { useMemo, useState } from "react";
import { getGoLiveChecklist, getGoLiveDataSeeds, getGoLiveDecision, getGoLiveIssues, getGoLiveQuickStart } from "@/services/go-live/goLiveFinalData";

export function useGoLiveFinal() {
  const [checklist, setChecklist] = useState(getGoLiveChecklist());
  const [quickStart] = useState(getGoLiveQuickStart());
  const [dataSeeds, setDataSeeds] = useState(getGoLiveDataSeeds());
  const [issues, setIssues] = useState(getGoLiveIssues());
  const [message, setMessage] = useState("Go-Live Final Check 준비 완료");

  const stats = useMemo(() => {
    const pass = checklist.filter((x) => x.status === "PASS").length;
    const watch = checklist.filter((x) => x.status === "WATCH").length;
    const block = checklist.filter((x) => x.status === "BLOCK").length;
    const decision = getGoLiveDecision(pass, block);
    return {
      pass,
      watch,
      block,
      total: checklist.length,
      decision,
      seedReady: dataSeeds.filter((x) => x.status === "READY").length,
      seedTotal: dataSeeds.length,
      openIssues: issues.filter((x) => x.status === "OPEN").length,
    };
  }, [checklist, dataSeeds, issues]);

  function passItem(id: string) {
    setChecklist((prev) => prev.map((x) => x.id === id ? { ...x, status: "PASS" } : x));
    setMessage("체크 항목을 PASS로 변경했습니다.");
  }

  function markSeedReady(id: string) {
    setDataSeeds((prev) => prev.map((x) => x.id === id ? { ...x, status: "READY" } : x));
    setMessage("데이터 준비 항목을 READY로 변경했습니다.");
  }

  function closeIssue(id: string) {
    setIssues((prev) => prev.map((x) => x.id === id ? { ...x, status: "CLOSED" } : x));
    setMessage("이슈를 CLOSED로 변경했습니다.");
  }

  return { checklist, quickStart, dataSeeds, issues, stats, message, passItem, markSeedReady, closeIssue };
}
