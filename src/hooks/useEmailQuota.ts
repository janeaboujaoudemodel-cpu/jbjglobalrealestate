import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmailQuotaSnapshot {
  sentToday: number;
  dailyLimit: number;
  sentMonth: number;
  monthlyLimit: number;
  ratePerSec: number;
  loading: boolean;
}

export function useEmailQuota(pollMs = 30_000) {
  const [snap, setSnap] = useState<EmailQuotaSnapshot>({
    sentToday: 0,
    dailyLimit: 100,
    sentMonth: 0,
    monthlyLimit: 2900,
    ratePerSec: 2,
    loading: true,
  });

  const refresh = useCallback(async () => {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 30 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const [{ data: cfg }, { data: today }, { data: month }] = await Promise.all([
      supabase.from("email_send_quota_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("email_send_quota").select("sent_count").eq("day", todayUtc).maybeSingle(),
      supabase.from("email_send_quota").select("sent_count").gte("day", since),
    ]);

    setSnap({
      sentToday: today?.sent_count ?? 0,
      dailyLimit: cfg?.daily_limit ?? 100,
      sentMonth: (month ?? []).reduce((a: number, r: any) => a + (r.sent_count ?? 0), 0),
      monthlyLimit: cfg?.monthly_limit ?? 2900,
      ratePerSec: cfg?.rate_per_sec ?? 2,
      loading: false,
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const updateLimits = useCallback(
    async (patch: { daily_limit?: number; monthly_limit?: number; rate_per_sec?: number }) => {
      const { error } = await supabase
        .from("email_send_quota_config")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { ...snap, refresh, updateLimits };
}
