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
import { DldSyncStatusAlert } from "@/components/crm/DldSyncStatusAlert";


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

// Per-segment column lists. Only include columns that actually exist on the
// underlying table — mixing dld_office_no onto crm_brokers or phone_number onto
// crm_brokerages / crm_developer_registry throws PostgREST "column does not
// exist" errors and breaks the whole hub.
const SEGMENT_TO_TABLE: Record<Segment, {
  table: string;
  nameCol: string;
  extra: string[];
  supportsDldArea?: boolean;
  supportsDldProject?: boolean;
  brokerFilter?: (q: any) => any;
}> = {
  broker_secondary: {
    table: "crm_brokers",
    nameCol: "full_name",
    extra: [
      "email_lower", "phone_e164", "current_company", "rera_license",
      "dld_license_category", "dld_area", "dld_project", "dld_broker_no",
    ],
    supportsDldArea: true,
    supportsDldProject: true,
    brokerFilter: (q) => q.in("broker_segment", ["secondary", "both", "unclassified"]),
  },
  broker_offplan: {
    table: "crm_brokers",
    nameCol: "full_name",
    extra: [
      "email_lower", "phone_e164", "current_company", "rera_license",
      "dld_license_category", "dld_area", "dld_project", "dld_broker_no",
    ],
    supportsDldArea: true,
    supportsDldProject: true,
    brokerFilter: (q) => q.in("broker_segment", ["offplan", "both"]),
  },
  brokerage: {
    table: "crm_brokerages",
    nameCol: "company_name",
    extra: [
      "email", "phone", "website",
      "dld_license_category", "dld_area", "dld_office_no", "name_arabic",
    ],
    supportsDldArea: true,
  },
  developer: {
    table: "crm_developer_registry",
    nameCol: "developer_name",
    extra: ["developer_email", "phone", "website"],
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
function useSegmentRows(
  segment: Segment,
  statusFilter: Status | "all",
  search: string,
  newTodayOnly: boolean,
  dld: DLDFilterValue,
) {
  return useQuery({
    queryKey: ["rel-hub-rows", segment, statusFilter, search, newTodayOnly, dld.category, dld.detail ?? ""],
    queryFn: async () => {
      const cfg = SEGMENT_TO_TABLE[segment];
      const cols = ["id", cfg.nameCol, "relationship_status", "last_contacted_at", "first_seen_at", ...cfg.extra].join(",");
      let q: any = supabase.from(cfg.table as any).select(cols).limit(500).order("first_seen_at", { ascending: false });
      if (cfg.brokerFilter) q = cfg.brokerFilter(q);
      if (statusFilter !== "all") q = q.eq("relationship_status", statusFilter);
      if (newTodayOnly) q = q.gte("first_seen_at", startOfTodayUtcIso());
      if (search.trim()) q = q.ilike(cfg.nameCol, `%${search.trim()}%`);

      // DLD-style filters (skip when the segment's table doesn't have the column)
      if (dld.category !== "all") {
        if (dld.category === "by_area" && dld.detail) {
          if (cfg.supportsDldArea) q = q.eq("dld_area", dld.detail);
        } else if (dld.category === "by_project" && dld.detail) {
          if (cfg.supportsDldProject) q = q.eq("dld_project", dld.detail);
        } else if (cfg.extra.includes("dld_license_category")) {
          q = q.eq("dld_license_category", dld.category);
        }
      }
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
  const [dld, setDld] = useState<DLDFilterValue>({ category: "all" });

  const kpis = useSegmentKpis(seg);
  const rows = useSegmentRows(seg, statusFilter, search, newTodayOnly, dld);

  const feed = useActivityFeed(seg);

  const segMeta = useMemo(() => SEGMENTS.find((s) => s.key === seg)!, [seg]);
  const cfg = SEGMENT_TO_TABLE[seg];

  return (
    <div data-relationships-hub data-no-contrast-guard className="min-h-screen" style={{ background: "#F7F5EF" }}>
      <SEOHead title="Relationships Hub · JBJ CRM" description="Unified brokers · brokerages · developers hub with daily DLD sync." />
      {/* Emerald page header band */}
      <div
        className="rh-header w-full"
        style={{
          background: "linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#010806 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => nav("/owner/crm/jbj")}
              className="rh-pill inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-none truncate">
                Relationships Hub
              </h1>
              <p className="text-xs mt-1" style={{ opacity: 0.85 }}>
                Daily DLD sync · segmented outreach · unified activity feed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { kpis.refetch(); rows.refetch(); feed.refetch(); }}
            className="rh-pill inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold shrink-0"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* DLD scraper health — red banner if the nightly scrape fails or goes stale. */}
        <DldSyncStatusAlert />

        {/* Segment tabs — emerald ombré, white ink locked */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            const active = seg === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => { setSeg(s.key); setStatusFilter("all"); setNewTodayOnly(false); }}
                className={`rh-tile ${active ? "rh-tile-active" : "rh-tile-inactive"} rounded-xl p-4 text-left transition-all overflow-hidden min-h-[112px]`}
                style={{
                  border: active ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(6,78,59,0.18)",
                  background: active
                    ? "linear-gradient(180deg,#064E3B 0%,#042c1c 60%,#010806 100%)"
                    : "#FFFFFF",
                  boxShadow: active
                    ? "0 8px 24px -12px rgba(6,78,59,0.55), inset 0 1px 0 rgba(255,255,255,0.12)"
                    : "0 1px 2px rgba(15,23,42,0.05)",
                }}
              >
                <div className="rh-tile-row">
                  <Icon className="rh-tile-icon" />
                  <span className="rh-tile-label">{s.label}</span>
                </div>
                <p className="rh-tile-sub">{s.sub}</p>
              </button>
            );
          })}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { k: "total",           label: "Total",              v: kpis.data?.total ?? 0 },
            { k: "untouched",       label: "Untouched",          v: kpis.data?.untouched ?? 0 },
            { k: "needs_follow_up", label: "Needs follow-up",    v: kpis.data?.needs_follow_up ?? 0 },
            { k: "briefing_booked", label: "Briefing booked",    v: kpis.data?.briefing_booked ?? 0 },
            { k: "registered",      label: "Registered",         v: kpis.data?.registered ?? 0 },
            { k: "new_today",       label: "New from DLD (24h)", v: kpis.data?.new_today ?? 0 },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-xl p-3"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(6,78,59,0.15)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <p className="rh-kpi-label">{s.label}</p>
              <p className="rh-kpi-value" data-empty={!kpis.isLoading && s.v === 0 ? "true" : undefined}>
                {kpis.isLoading ? "…" : s.v === 0 ? "—" : s.v.toLocaleString()}
              </p>
            </div>
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

          {/* DLD-style category dropdown (mirrors DLD's public list) */}
          <DLDFilterDropdown
            value={dld}
            onChange={setDld}
            showOffices={seg === "brokerage"}
            areaOptions={Array.from(
              new Set(((rows.data ?? []) as any[]).map((r) => r.dld_area).filter(Boolean)),
            ).sort()}
            projectOptions={Array.from(
              new Set(((rows.data ?? []) as any[]).map((r) => r.dld_project).filter(Boolean)),
            ).sort()}
          />

          {/* Export current filtered view (CSV + branded XLSX) */}
          <DLDExportButton
            segment={
              seg === "brokerage"
                ? "brokerage"
                : seg === "developer"
                ? "developer"
                : "broker"
            }
            rows={(rows.data ?? []) as any[]}
            filenameSuffix={seg}
          />

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
                  const email = r.email_lower ?? r.email ?? r.developer_email ?? "";
                  const showLogo = seg === "brokerage" || seg === "developer";
                  return (
                    <tr key={r.id} className="border-t border-[#B89555]/15 hover:bg-[#F7F1E4]/30">
                      <td className="px-3 py-2 font-semibold text-[#0F1A16]">
                        <div className="inline-flex items-center gap-2">
                          {showLogo && <EntityLogo name={name} website={r.website} logoUrl={r.logo_url} />}
                          <span className="truncate">{name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-[#4B5D55]">
                        {email ? <div className="truncate">{email}</div> : <span className="text-[#B89555]/60">—</span>}
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

        {/* DLD Conflicts — needs owner review; never auto-updates live rows. */}
        <DLDConflictsSection />

        <div className="rounded-lg border border-[#B89555]/40 bg-[#F7F1E4]/60 p-4 text-[12px] text-[#4B5D55]">
          <strong className="text-[#0F1A16]">Daily DLD sync (fully automatic):</strong> runs nightly at 03:00 UTC
          (07:00 Dubai) via pg_cron. The scraper visits DLD's public developer, brokerage, and broker lists.
          Existing rows are <strong>never overwritten</strong> — only net-new records are inserted, and any
          partial match (same name but different email or phone) is flagged in the <em>DLD Conflicts</em>
          panel above. If a run fails or is missed, a red alert appears at the top of this page.
        </div>

      </div>
    </div>
  );
}

function EntityLogo({ name, website, logoUrl }: { name: string; website?: string | null; logoUrl?: string | null }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const domain = (() => {
    try {
      if (!website) return null;
      const u = new URL(website.startsWith("http") ? website : `https://${website}`);
      return u.hostname.replace(/^www\./, "");
    } catch { return null; }
  })();
  const src = stage === 0 && logoUrl ? logoUrl
    : stage <= 1 && domain ? `https://logo.clearbit.com/${domain}`
    : null;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-6 rounded object-contain bg-white border border-[#B89555]/25"
        onError={() => setStage((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : 2))}
      />
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className="size-6 rounded bg-[#064E3B] text-white text-[10px] font-black inline-flex items-center justify-center">
      {initial}
    </span>
  );
}
