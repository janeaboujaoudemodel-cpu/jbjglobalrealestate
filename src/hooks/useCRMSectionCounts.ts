// Live count badges for the CRM hub.
// Single parallel fetch of head-counts + Supabase realtime subscriptions
// so the sub-section badges (Leads, Flagged, VIP, Tasks, Calendar, Notes,
// Inbox, Notifications, Campaigns, Automation, Lead Mgmt) update in real time.
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_EMAILS_LC } from "@/config/ownerEmails";

export type CRMCounts = {
  // entity-level
  leads: number;
  flagged: number;
  vip: number;
  investors: number;
  developers: number;
  salesReps: number;
  brokers: number;
  agencies: number;
  employees: number;
  // workspace-level (sub-tabs)
  tasks: number;
  notes: number;
  calendarUpcoming: number;
  inbox: number;
  emailCenter: number;
  notifications: number;
  campaigns: number;
  automation: number;
  leadMgmt: number;
};

const EMPTY: CRMCounts = {
  leads: 0, flagged: 0, vip: 0, investors: 0, developers: 0,
  salesReps: 0, brokers: 0, agencies: 0, employees: 0,
  tasks: 0, notes: 0, calendarUpcoming: 0, inbox: 0,
  emailCenter: 0, notifications: 0, campaigns: 0, automation: 0,
  leadMgmt: 0,
};

let cache: { at: number; data: CRMCounts } | null = null;
const TTL = 5_000;

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

  const load = async (force = false) => {
    if (!force && cache && Date.now() - cache.at < TTL) {
      setCounts(cache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    const nowIso = new Date().toISOString();
    const [
      leads, flagged, vip, investors, developers,
      salesReps, brokers, agencies, employees,
      tasks, notes, calendarUpcoming, inbox, emailCenter,
      notifications, campaigns, automation, leadMgmt,
    ] = await Promise.all([
      headCount("crm_leads", (q) => q.is("deleted_at", null)),
      headCount("crm_leads", (q) => q.eq("flagged", true).is("deleted_at", null)),
      headCount("crm_leads", (q) => q.eq("vip", true).is("deleted_at", null)),
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
      headCount("crm_tasks", (q) => q.in("status", ["todo", "in_progress", "pending"])),
      headCount("crm_notes"),
      headCount("owner_calendar_events", (q) => q.gte("start_at", nowIso)),
      headCount("user_notifications", (q) => q.eq("is_read", false)),
      headCount("email_inbox_items", (q) => q.is("archived_at", null)),
      headCount("user_notifications", (q) => q.eq("is_read", false)),
      headCount("crm_email_campaigns"),
      headCount("crm_automation_rules", (q) => q.eq("is_active", true)),
      headCount("crm_leads", (q) => q.not("deleted_at", "is", null)),
    ]);
    const data: CRMCounts = {
      leads, flagged, vip, investors, developers,
      salesReps, brokers, agencies, employees,
      tasks, notes, calendarUpcoming, inbox, emailCenter,
      notifications, campaigns, automation, leadMgmt,
    };
    cache = { at: Date.now(), data };
    setCounts(data);
    setLoading(false);
  };

  useEffect(() => { cache = null; load(true); /* eslint-disable-next-line */ }, [tick.current]);

  // Realtime: invalidate cache + reload on relevant table changes (debounced).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => { cache = null; load(true); }, 500);
    };
    const channel = supabase
      .channel("crm-section-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_tasks" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_notes" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_calendar_events" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "email_inbox_items" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_notifications" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_email_campaigns" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_automation_rules" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_brokers" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_brokerages" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "developers" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "developer_sales_reps" }, bump)
      .on("postgres_changes", { event: "*", schema: "public", table: "broker_profiles" }, bump)
      .subscribe();
    return () => {
      if (t) clearTimeout(t);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    counts,
    loading,
    refresh: () => { cache = null; tick.current++; load(true); },
  };
}
