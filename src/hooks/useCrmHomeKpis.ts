// Live KPI metrics for the JBJ CRM Home dashboard.
// Zoho-parity tiles: My Open Deals, My Untouched Leads, Today's Leads, My Leads.
// All counts are head-only queries (never rows.length) and refresh via realtime.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CrmHomeKpis = {
  openDeals: number;
  untouchedLeads: number;
  todaysLeads: number;
  myLeads: number;
};

const EMPTY: CrmHomeKpis = {
  openDeals: 0,
  untouchedLeads: 0,
  todaysLeads: 0,
  myLeads: 0,
};

// Asia/Dubai is UTC+4 with no DST — safe fixed offset for "start of today".
function startOfTodayDubaiIso(): string {
  const now = new Date();
  const dubaiMs = now.getTime() + 4 * 60 * 60 * 1000;
  const d = new Date(dubaiMs);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - 4 * 60 * 60 * 1000).toISOString();
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

async function headCount(
  table: string,
  builder?: (q: any) => any,
): Promise<number> {
  let q: any = supabase.from(table as any).select("*", { count: "exact", head: true });
  if (builder) q = builder(q);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

export function useCrmHomeKpis() {
  const [kpis, setKpis] = useState<CrmHomeKpis>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = async () => {
    const myId = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const todayIso = startOfTodayDubaiIso();
      const staleIso = sevenDaysAgoIso();
      const [openDeals, untouchedLeads, todaysLeads, myLeads] = await Promise.all([
        headCount("deals", (q) =>
          q.not("deal_status", "in", "(closed_won,closed_lost,rejected,cancelled)"),
        ),
        headCount("crm_leads", (q) =>
          q.is("deleted_at", null).lt("updated_at", staleIso),
        ),
        headCount("crm_leads", (q) =>
          q.is("deleted_at", null).gte("created_at", todayIso),
        ),
        headCount("crm_leads", (q) => q.is("deleted_at", null)),
      ]);
      if (myId !== reqId.current) return;
      setKpis({ openDeals, untouchedLeads, todaysLeads, myLeads });
    } catch (e: any) {
      if (myId !== reqId.current) return;
      setError(e?.message ?? "Failed to load metrics");
      setKpis(EMPTY);
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    let t: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(load, 600);
    };
    const channel = supabase
      .channel("crm-home-kpis")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, bump)
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { kpis, loading, error, refresh: load };
}

/** Zoho-style compact number formatter: 1,234 · 12.3K · 1.2M */
export function formatKpi(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("en-US");
}
