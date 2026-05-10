// Live count badges for the CRM hub.
// Single parallel fetch of head-counts; cached for 60s.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_EMAILS_LC } from "@/config/ownerEmails";

export type CRMCounts = {
  leads: number;
  flagged: number;
  vip: number;
  investors: number;
  developers: number;
  salesReps: number;
  brokers: number;
  agencies: number;
  employees: number;
  tasks: number;
};

const EMPTY: CRMCounts = {
  leads: 0, flagged: 0, vip: 0, investors: 0, developers: 0,
  salesReps: 0, brokers: 0, agencies: 0, employees: 0, tasks: 0,
};

let cache: { at: number; data: CRMCounts } | null = null;
const TTL = 60_000;

async function headCount(table: string, builder?: (q: any) => any): Promise<number> {
  let q: any = (supabase.from(table as any).select("*", { count: "exact", head: true }) as any);
  if (builder) q = builder(q);
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}

export function useCRMSectionCounts(): { counts: CRMCounts; loading: boolean; refresh: () => void } {
  const [counts, setCounts] = useState<CRMCounts>(cache?.data ?? EMPTY);
  const [loading, setLoading] = useState<boolean>(!cache);
  const tick = useRef(0);

  const load = async () => {
    if (cache && Date.now() - cache.at < TTL) {
      setCounts(cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [
      leads, flagged, vip, investors, developers,
      salesReps, brokers, agencies, employees, tasks,
    ] = await Promise.all([
      headCount("crm_leads"),
      headCount("crm_leads", (q) => q.eq("flagged", true)),
      headCount("crm_leads", (q) => q.eq("vip", true)),
      headCount("crm_leads", (q) =>
        q
          .is("deleted_at", null)
          .or("contact_type.eq.investor,tags.cs.{investor}")
          .not("email_lower", "in", `(${OWNER_EMAILS_LC.map((e) => `"${e}"`).join(",")})`)
      ),
      headCount("developers"),
      headCount("developer_sales_reps"),
      headCount("crm_brokers"),
      headCount("crm_brokerages"),
      headCount("team_members"),
      headCount("crm_tasks", (q) => q.in("status", ["todo", "in_progress"])),
    ]);
    const data: CRMCounts = {
      leads, flagged, vip, investors, developers, salesReps, brokers, agencies, employees, tasks,
    };
    cache = { at: Date.now(), data };
    setCounts(data);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tick.current]);

  return {
    counts,
    loading,
    refresh: () => { cache = null; tick.current++; load(); },
  };
}
