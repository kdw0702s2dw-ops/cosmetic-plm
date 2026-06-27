"use client";

import { useEffect, useState } from "react";
import { fetchDatabaseHealth } from "@/services/database-live/databaseHealthService";
import type { DatabaseHealthRow } from "@/types/databaseLive";

export function useDatabaseHealthLive() {
  const [rows, setRows] = useState<DatabaseHealthRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchDatabaseHealth());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { rows, loading, load };
}
