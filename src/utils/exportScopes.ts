/**
 * exportScopes
 * Fetch CRM rows for a given export scope (company / event / segment /
 * campaign). "Current view" rows are passed in by the caller — no fetch.
 *
 * Returns rows compatible with `exportLeads`.
 */
import { supabase } from "@/integrations/supabase/client";

export type ExportScopeKind =
  | "view" | "company" | "event" | "segment" | "campaign";

export interface ScopeOption {
  id: string;
  label: string;
  sublabel?: string;
}

const PAGE = 1000;

async function fetchAllLeadsBy(filter: (q: any) => any, limit = 50_000) {
  const all: any[] = [];
  let from = 0;
  for (let i = 0; i < Math.ceil(limit / PAGE); i++) {
    const q = filter(
      supabase.from("crm_leads").select("*").is("deleted_at", null)
    ).range(from, from + PAGE - 1);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data as any[]) ?? [];
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

/* -------------------- Scope option lists -------------------- */

export async function listCompanyOptions(): Promise<ScopeOption[]> {
  const out = new Map<string, ScopeOption>();
  const { data: brks = [] } = await supabase
    .from("crm_brokerages")
    .select("id, company_name")
    .order("company_name")
    .limit(500);
  for (const b of brks ?? []) {
    if (b.company_name) out.set(b.company_name.toLowerCase(), {
      id: `brokerage:${b.company_name}`, label: b.company_name, sublabel: "Brokerage",
    });
  }
  const { data: devs = [] } = await supabase
    .from("crm_developer_registry")
    .select("id, developer_name")
    .order("developer_name")
    .limit(500);
  for (const d of devs ?? []) {
    if (d.developer_name) out.set(d.developer_name.toLowerCase(), {
      id: `developer:${d.developer_name}`, label: d.developer_name, sublabel: "Developer",
    });
  }
  return Array.from(out.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export async function listEventOptions(): Promise<ScopeOption[]> {
  const { data = [] } = await supabase
    .from("crm_brokerage_events")
    .select("id, title, event_type, event_date")
    .order("event_date", { ascending: false })
    .limit(500);
  return (data ?? []).map((e: any) => ({
    id: e.id,
    label: e.title || e.event_type || "Event",
    sublabel: e.event_date ? new Date(e.event_date).toLocaleDateString() : undefined,
  }));
}

export async function listSegmentOptions(): Promise<ScopeOption[]> {
  const { data = [] } = await supabase
    .from("crm_lead_lists")
    .select("id, name, kind")
    .is("archived_at", null)
    .order("name")
    .limit(500);
  return (data ?? []).map((s: any) => ({
    id: s.id, label: s.name, sublabel: s.kind ?? undefined,
  }));
}

export async function listCampaignOptions(): Promise<ScopeOption[]> {
  const { data = [] } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((c: any) => ({
    id: c.id, label: c.name, sublabel: c.status ?? undefined,
  }));
}

/* -------------------- Row fetchers -------------------- */

export async function rowsForCompany(optionId: string): Promise<any[]> {
  const [, name] = optionId.split(":", 2);
  if (!name) return [];
  return fetchAllLeadsBy((q) => q.ilike("company_name", name));
}

export async function rowsForEvent(eventId: string): Promise<any[]> {
  const { data: attendees = [] } = await supabase
    .from("crm_brokerage_event_attendees")
    .select("name, phone, email, matched_via, agent_id, brokerage_id, created_at")
    .eq("event_id", eventId)
    .limit(5000);
  return (attendees ?? []).map((a: any) => ({
    full_name: a.name,
    phone_e164: a.phone,
    email_lower: a.email,
    source: a.matched_via,
    last_contacted_at: a.created_at,
  }));
}

export async function rowsForSegment(listId: string): Promise<any[]> {
  return fetchAllLeadsBy((q) => q.eq("list_id", listId));
}

export async function rowsForCampaign(campaignId: string): Promise<any[]> {
  // Pull recipients first, then enrich with crm_leads.
  const recs: any[] = [];
  let from = 0;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("crm_campaign_recipients")
      .select("lead_id, email, status, sent_at, opened_at")
      .eq("campaign_id", campaignId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data as any[]) ?? [];
    recs.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  const ids = Array.from(new Set(recs.map((r) => r.lead_id).filter(Boolean)));
  const leadsById = new Map<string, any>();
  for (let i = 0; i < ids.length; i += 200) {
    const slice = ids.slice(i, i + 200);
    const { data = [] } = await supabase
      .from("crm_leads")
      .select("*")
      .in("id", slice);
    for (const l of (data ?? []) as any[]) leadsById.set(l.id, l);
  }
  return recs.map((r) => ({
    ...(leadsById.get(r.lead_id) ?? {}),
    email_lower: r.email ?? leadsById.get(r.lead_id)?.email_lower,
    campaign_status: r.status,
    campaign_sent_at: r.sent_at,
    campaign_opened_at: r.opened_at,
  }));
}
