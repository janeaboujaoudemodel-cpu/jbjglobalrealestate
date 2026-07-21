/**
 * Unified Relationships Hub
 * ─────────────────────────
 * Replaces the empty "Agency Activity Log" page at /owner/crm/relationships/activity.
 *
 * Four segmented tabs:
 *   • Brokers · Secondary   → crm_brokers where broker_segment IN ('secondary','both','unclassified')
 *   • Brokers · Off-plan    → crm_brokers where broker_segment IN ('offplan','both')
 *   • Brokerages            → crm_brokerages
 *   • Developers            → crm_developer_registry
 *
 * Each tab shows:
 *   – KPI strip (Total · Untouched · Needs follow-up · Briefing booked · Registered · New from DLD today)
 *   – Table of records with per-row status controls
 *   – Filter chips (status + "new from DLD today")
 *   – Search
 *
 * Shared bottom panel: Activity feed (crm_relationship_activity) filtered by the active tab.
 *
 * Owner-only. Uses existing OwnerGuard on the route.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, RefreshCw, Search, Users, Building2, Home, Landmark,
  CheckCircle2, Clock, Bell, Handshake, XCircle, Sparkles, Calendar,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { formatDistanceToNow } from "date-fns";
import { DLDFilterDropdown, type DLDFilterValue } from "@/components/crm/DLDFilterDropdown";
import { DLDExportButton, type DLDExportSegment } from "@/components/crm/DLDExportButton";
import { DLDConflictsSection } from "@/components/crm/DLDConflictsSection";


type Segment = "broker_secondary" | "broker_offplan" | "brokerage" | "developer";
type Status =
  | "untouched"
  | "needs_follow_up"
  | "briefing_booked"
  | "registered"
  | "declined"
  | "archived";

const SEGMENTS: Array<{ key: Segment; label: string; icon: any; sub: string }> = [
  { key: "broker_secondary", label: "Brokers · Secondary", icon: Home, sub: "DLD-registered individual brokers licensed for ready/secondary market." },
  { key: "broker_offplan",   label: "Brokers · Off-plan",  icon: Sparkles, sub: "DLD-registered individual brokers licensed for off-plan sales." },
  { key: "brokerage",        label: "Brokerages",          icon: Building2, sub: "Agencies from DLD + your uploads. Bulk outreach and briefing bookings." },
  { key: "developer",        label: "Developers",          icon: Landmark, sub: "Master and sub-developers registered with DLD." },
];

const STATUS_META: Record<Status, { label: string; icon: any; color: string; bg: string }> = {
  untouched:       { label: "Untouched",       icon: Bell,          color: "#7A5C1E", bg: "rgba(184,149,85,0.14)" },
  needs_follow_up: { label: "Needs follow-up", icon: Clock,         color: "#B45309", bg: "rgba(180,83,9,0.10)"  },
  briefing_booked: { label: "Briefing booked", icon: Calendar,      color: "#1D4ED8", bg: "rgba(29,78,216,0.10)" },
  registered:      { label: "Registered",      icon: CheckCircle2,  color: "#064E3B", bg: "rgba(6,78,59,0.10)"   },
  declined:        { label: "Declined",        icon: XCircle,       color: "#7F1D1D", bg: "rgba(127,29,29,0.08)" },
  archived:        { label: "Archived",        icon: XCircle,       color: "#6B7280", bg: "rgba(107,114,128,0.10)" },
};

const SEGMENT_TO_TABLE: Record<Segment, { table: string; nameCol: string; extra: string[]; brokerFilter?: (q: any) => any }> = {
  broker_secondary: {
    table: "crm_brokers",
    nameCol: "full_name",
    extra: ["email_lower", "phone_e164", "current_company", "rera_license"],
    brokerFilter: (q) => q.in("broker_segment", ["secondary", "both", "unclassified"]),
  },
  broker_offplan: {
    table: "crm_brokers",
    nameCol: "full_name",
    extra: ["email_lower", "phone_e164", "current_company", "rera_license"],
    brokerFilter: (q) => q.in("broker_segment", ["offplan", "both"]),
  },
  brokerage: {
    table: "crm_brokerages",
    nameCol: "company_name",
    extra: ["email", "phone_number", "website"],
  },
  developer: {
    table: "crm_developer_registry",
    nameCol: "name",
    extra: ["email", "phone_number", "website"],
  },
};

function startOfTodayUtcIso(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/* ------------------------------------------------------------------ */
/* KPI query                                                          */
/* ------------------------------------------------------------------ */
function useSegmentKpis(segment: Segment) {
  return useQuery({
    queryKey: ["rel-hub-kpis", segment],
    queryFn: async () => {
      const cfg = SEGMENT_TO_TABLE[segment];
      const todayIso = startOfTodayUtcIso();
      const build = (extra?: (q: any) => any) => {
        let q: any = supabase.from(cfg.table as any).select("id", { count: "exact", head: true });
        if (cfg.brokerFilter) q = cfg.brokerFilter(q);
        if (extra) q = extra(q);
        return q;
      };
      const [total, untouched, follow, briefing, registered, newToday] = await Promise.all([
        build(),
        build((q) => q.eq("relationship_status", "untouched")),
        build((q) => q.eq("relationship_status", "needs_follow_up")),
        build((q) => q.eq("relationship_status", "briefing_booked")),
        build((q) => q.eq("relationship_status", "registered")),
        build((q) => q.gte("first_seen_at", todayIso)),
      ]);
      return {
        total: total.count ?? 0,
        untouched: untouched.count ?? 0,
        needs_follow_up: follow.count ?? 0,
        briefing_booked: briefing.count ?? 0,
        registered: registered.count ?? 0,
        new_today: newToday.count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/* Rows query                                                         */
/* ------------------------------------------------------------------ */
function useSegmentRows(segment: Segment, statusFilter: Status | "all", search: string, newTodayOnly: boolean) {
  return useQuery({
    queryKey: ["rel-hub-rows", segment, statusFilter, search, newTodayOnly],
    queryFn: async () => {
      const cfg = SEGMENT_TO_TABLE[segment];
      const cols = ["id", cfg.nameCol, "relationship_status", "last_contacted_at", "first_seen_at", ...cfg.extra].join(",");
      let q: any = supabase.from(cfg.table as any).select(cols).limit(300).order("first_seen_at", { ascending: false });
      if (cfg.brokerFilter) q = cfg.brokerFilter(q);
      if (statusFilter !== "all") q = q.eq("relationship_status", statusFilter);
      if (newTodayOnly) q = q.gte("first_seen_at", startOfTodayUtcIso());
      if (search.trim()) q = q.ilike(cfg.nameCol, `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Activity feed                                                      */
/* ------------------------------------------------------------------ */
function useActivityFeed(segment: Segment) {
  return useQuery({
    queryKey: ["rel-hub-activity", segment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_relationship_activity" as any)
        .select("*")
        .eq("segment", segment)
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });
}

/* ------------------------------------------------------------------ */
/* Row helpers                                                        */
/* ------------------------------------------------------------------ */
async function setRowStatus(segment: Segment, id: string, status: Status, label: string) {
  const cfg = SEGMENT_TO_TABLE[segment];
  const { error: e1 } = await supabase
    .from(cfg.table as any)
    .update({ relationship_status: status, last_contacted_at: new Date().toISOString() })
    .eq("id", id);
  if (e1) throw e1;
  await supabase.from("crm_relationship_activity" as any).insert({
    segment,
    target_id: id,
    target_label: label,
    activity_type: "status_change",
    title: `Status → ${STATUS_META[status].label}`,
    status,
    done: true,
  });
}

/* ================================================================== */
/* Component                                                          */
/* ================================================================== */
export default function RelationshipsHub() {
  const nav = useNavigate();
  const [seg, setSeg] = useState<Segment>("broker_secondary");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [newTodayOnly, setNewTodayOnly] = useState(false);

  const kpis = useSegmentKpis(seg);
  const rows = useSegmentRows(seg, statusFilter, search, newTodayOnly);
  const feed = useActivityFeed(seg);

  const segMeta = useMemo(() => SEGMENTS.find((s) => s.key === seg)!, [seg]);
  const cfg = SEGMENT_TO_TABLE[seg];

  return (
    <div className="min-h-screen bg-[#F7F1E4]/40" data-no-contrast-guard>
      <SEOHead title="Relationships Hub · JBJ CRM" description="Unified brokers · brokerages · developers hub with daily DLD sync." />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => nav("/owner/crm")} className="border-[#B89555]/40">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="font-[Cormorant_Garamond] text-3xl font-black text-[#0F1A16] leading-none">
                Relationships Hub
              </h1>
              <p className="text-xs text-[#4B5D55] mt-1">
                Daily DLD sync · segmented outreach · unified activity feed.
              </p>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            className="border-[#064E3B] text-[#064E3B]"
            onClick={() => { kpis.refetch(); rows.refetch(); feed.refetch(); }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>

        {/* Segment tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            const active = seg === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => { setSeg(s.key); setStatusFilter("all"); setNewTodayOnly(false); }}
                className="rounded-lg border p-3 text-left transition-colors"
                style={{
                  borderColor: active ? "#064E3B" : "rgba(184,149,85,0.35)",
                  background: active ? "#064E3B" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#0F1A16",
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-black tracking-tight">{s.label}</span>
                </div>
                <p className="text-[11px] mt-1 leading-snug opacity-80">{s.sub}</p>
              </button>
            );
          })}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { k: "total",           label: "Total",            v: kpis.data?.total ?? 0,           tone: "#0F1A16" },
            { k: "untouched",       label: "Untouched",        v: kpis.data?.untouched ?? 0,       tone: "#7A5C1E" },
            { k: "needs_follow_up", label: "Needs follow-up",  v: kpis.data?.needs_follow_up ?? 0, tone: "#B45309" },
            { k: "briefing_booked", label: "Briefing booked",  v: kpis.data?.briefing_booked ?? 0, tone: "#1D4ED8" },
            { k: "registered",      label: "Registered",       v: kpis.data?.registered ?? 0,      tone: "#064E3B" },
            { k: "new_today",       label: "New from DLD (24h)", v: kpis.data?.new_today ?? 0,     tone: "#B89555" },
          ].map((s) => (
            <Card key={s.k} className="bg-white border-[#B89555]/30 p-3">
              <p className="text-[10px] uppercase tracking-widest text-[#4B5D55] font-black">{s.label}</p>
              <p className="mt-1 font-[Cormorant_Garamond] text-2xl font-black leading-none" style={{ color: s.tone }}>
                {kpis.isLoading ? "…" : s.v.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5D55]" />
            <Input
              placeholder={`Search ${segMeta.label.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 border-[#B89555]/40 bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(["all","untouched","needs_follow_up","briefing_booked","registered","declined"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s as any)}
                className="rounded-full border text-[11px] px-3 py-1 font-semibold"
                style={{
                  borderColor: statusFilter === s ? "#064E3B" : "rgba(184,149,85,0.4)",
                  background: statusFilter === s ? "#064E3B" : "#FFFFFF",
                  color: statusFilter === s ? "#FFFFFF" : "#0F1A16",
                }}
              >
                {s === "all" ? "All" : STATUS_META[s as Status].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setNewTodayOnly((v) => !v)}
              className="rounded-full border text-[11px] px-3 py-1 font-semibold"
              style={{
                borderColor: newTodayOnly ? "#B89555" : "rgba(184,149,85,0.4)",
                background: newTodayOnly ? "#B89555" : "#FFFFFF",
                color: newTodayOnly ? "#FFFFFF" : "#0F1A16",
              }}
            >
              ⚡ New from DLD (today)
            </button>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-white border-[#B89555]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F1E4]/60 text-left">
                <tr className="text-[11px] uppercase tracking-widest text-[#4B5D55]">
                  <th className="px-3 py-2 font-black">Name</th>
                  <th className="px-3 py-2 font-black">Contact</th>
                  <th className="px-3 py-2 font-black">Status</th>
                  <th className="px-3 py-2 font-black">Last contacted</th>
                  <th className="px-3 py-2 font-black">First seen</th>
                  <th className="px-3 py-2 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.isLoading && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-[#4B5D55]">Loading…</td></tr>
                )}
                {!rows.isLoading && (rows.data ?? []).length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-[#4B5D55]">
                    No records match the current filter.
                  </td></tr>
                )}
                {(rows.data ?? []).map((r: any) => {
                  const status: Status = r.relationship_status ?? "untouched";
                  const meta = STATUS_META[status];
                  const StatusIcon = meta.icon;
                  const name = r[cfg.nameCol] ?? "—";
                  const email = r.email_lower ?? r.email ?? "";
                  const phone = r.phone_e164 ?? r.phone_number ?? "";
                  return (
                    <tr key={r.id} className="border-t border-[#B89555]/15 hover:bg-[#F7F1E4]/30">
                      <td className="px-3 py-2 font-semibold text-[#0F1A16]">{name}</td>
                      <td className="px-3 py-2 text-[12px] text-[#4B5D55]">
                        {email && <div>{email}</div>}
                        {phone && <div>{phone}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-black rounded px-2 py-0.5"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          <StatusIcon className="h-3 w-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-[#4B5D55]">
                        {r.last_contacted_at ? formatDistanceToNow(new Date(r.last_contacted_at), { addSuffix: true }) : "—"}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-[#4B5D55]">
                        {r.first_seen_at ? formatDistanceToNow(new Date(r.first_seen_at), { addSuffix: true }) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex flex-wrap gap-1 justify-end">
                          {(["needs_follow_up","briefing_booked","registered","declined"] as Status[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={async () => {
                                try {
                                  await setRowStatus(seg, r.id, s, name);
                                  rows.refetch();
                                  kpis.refetch();
                                  feed.refetch();
                                } catch (e: any) {
                                  console.error(e);
                                }
                              }}
                              className="text-[10px] font-bold rounded px-2 py-0.5 border"
                              style={{
                                color: STATUS_META[s].color,
                                borderColor: STATUS_META[s].color + "40",
                                background: STATUS_META[s].bg,
                              }}
                            >
                              {STATUS_META[s].label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Activity feed */}
        <div>
          <h2 className="font-[Cormorant_Garamond] text-xl font-black text-[#0F1A16] mb-2">
            Activity · {segMeta.label}
          </h2>
          <Card className="bg-white border-[#B89555]/30 divide-y divide-[#B89555]/15">
            {feed.isLoading && <div className="p-4 text-sm text-[#4B5D55]">Loading activity…</div>}
            {!feed.isLoading && (feed.data ?? []).length === 0 && (
              <div className="p-4 text-sm text-[#4B5D55]">
                No activity yet. Every email you send, reply you receive, status change,
                calendar booking, or new record pulled from DLD lands here.
              </div>
            )}
            {(feed.data ?? []).map((a: any) => (
              <div key={a.id} className="px-4 py-2 flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] uppercase border-[#B89555]/40">
                  {a.activity_type.replace(/_/g, " ")}
                </Badge>
                <span className="text-[13px] font-semibold text-[#0F1A16] flex-1 truncate">
                  {a.title}
                </span>
                <span className="text-[11px] text-[#4B5D55] shrink-0">
                  {a.target_label}
                </span>
                <span className="text-[11px] text-[#4B5D55] shrink-0">
                  {a.occurred_at ? formatDistanceToNow(new Date(a.occurred_at), { addSuffix: true }) : ""}
                </span>
              </div>
            ))}
          </Card>
        </div>

        <div className="rounded-lg border border-[#B89555]/40 bg-[#F7F1E4]/60 p-4 text-[12px] text-[#4B5D55]">
          <strong className="text-[#0F1A16]">Daily DLD sync:</strong> The background job runs at 06:00 Dubai time
          and adds new brokers (auto-classified as Secondary or Off-plan from their DLD license category),
          brokerages, and developers directly into this hub. Every new record gets status <em>Untouched</em>
          and appears in the <em>New from DLD (today)</em> filter above.
        </div>
      </div>
    </div>
  );
}
