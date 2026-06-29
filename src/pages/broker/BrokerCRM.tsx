import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { useBrokerPersonalTasks } from "@/hooks/useBrokerPersonalTasks";
import {
  Database, Users, Activity, ArrowRight, Loader2, Plus, Phone, Upload,
  TrendingUp, BarChart3, Inbox, ClipboardList, Sparkles, Search,
  Calendar as CalendarIcon, ListTodo, StickyNote,
} from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RequestDatabaseDialog from "@/components/broker-portal/RequestDatabaseDialog";
import UploadDatabaseDialog from "@/components/crm/UploadDatabaseDialog";
import LogCallDialog from "@/components/broker-crm/LogCallDialog";
import CallDetailSheet from "@/components/broker-crm/CallDetailSheet";
import BrokerDatabaseSheet from "@/components/broker-crm/BrokerDatabaseSheet";
import MarkJunkDialog from "@/components/broker-crm/MarkJunkDialog";
import LeadHubSheet from "@/components/broker-crm/LeadHubSheet";
import { AlertTriangle } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

// CRM is the unified hub — these surfaces also remain in the sidebar but are
// embedded here as tabs for a single-pane workflow (matches owner CRM hub).
const BrokerCalendarTab = lazy(() => import("@/pages/broker/BrokerCalendar"));
const BrokerTasksTab    = lazy(() => import("@/pages/broker/BrokerTasks"));
const BrokerNotesTab    = lazy(() => import("@/pages/broker/BrokerNotes"));
const BrokerInboxTab    = lazy(() => import("@/pages/broker/BrokerInbox"));

type Tab =
  | "pipeline" | "databases" | "leads" | "calls" | "insights" | "activity"
  | "calendar" | "tasks" | "notes" | "inbox";

function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#F7F2EA] border border-[color:var(--emerald-1)]/24 p-5 md:p-6 shadow-[0_10px_30px_-24px_rgba(6,78,59,0.45)] ${className}`}>
      {children}
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, sub, onClick,
}: { icon: any; label: string; value: string | number; sub?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="jj-hover-emerald group text-left rounded-xl bg-[#F7F2EA] border border-[color:var(--emerald-1)]/28 px-5 py-5 w-full focus:outline-none"
    >
      <IconTile icon={Icon} tone="emerald" size="md" className="!h-10 !w-10 !rounded-xl" iconClassName="!h-5 !w-5" />
      <div className="mt-4 text-3xl md:text-4xl font-semibold tabular-nums text-[#1A1A1A] leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 mt-2 font-semibold">{label}</div>
      {sub && <div className="text-[11px] text-[#1A1A1A]/55 mt-1">{sub}</div>}
    </button>
  );
}



const STAGE_GROUPS: Array<{ key: string; label: string; match: string[] }> = [
  { key: "new",         label: "New",            match: ["new", "untouched"] },
  { key: "contacted",   label: "Contacted",      match: ["contacted", "engaged"] },
  { key: "qualified",   label: "Qualified",      match: ["qualified"] },
  { key: "viewing",     label: "Viewing",        match: ["viewing_scheduled", "viewing"] },
  { key: "negotiation", label: "Negotiation",    match: ["negotiation", "offer"] },
  { key: "won",         label: "Won",            match: ["won", "closed_won", "contract"] },
];

const getLeadEmail = (lead: any) => (lead?.email ?? lead?.email_lower ?? "").toString();
const getLeadPhone = (lead: any) => (lead?.phone ?? lead?.phone_e164 ?? "").toString();

const formatDuration = (seconds?: number | null) => {
  const safe = Math.max(0, Number(seconds ?? 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
};




export default function BrokerCRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [openCallId, setOpenCallId] = useState<string | null>(null);
  const [openDbSheet, setOpenDbSheet] = useState<{ id: string; name: string } | null>(null);
  const [junkLead, setJunkLead] = useState<{ id: string; name: string } | null>(null);
  const [hubLead, setHubLead] = useState<any | null>(null);
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();
  const tasks = useBrokerPersonalTasks();

  useEffect(() => {
    const nextTab = searchParams.get("tab") as Tab | null;
    const action = searchParams.get("action");
    if (nextTab && ["pipeline", "databases", "leads", "calls", "insights", "activity", "calendar", "tasks", "notes", "inbox"].includes(nextTab)) {
      setTab(nextTab);
    }
    if (action === "log-call") {
      setTab("calls");
      setCallDialogOpen(true);
    }
    if (nextTab || action) {
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [callsView, setCallsView] = useState<"active" | "deleted">("active");
  const [selectedCallIds, setSelectedCallIds] = useState<Set<string>>(new Set());

  // Clear selection when toggling view
  useEffect(() => { setSelectedCallIds(new Set()); }, [callsView]);

  const toggleSelectCall = (id: string) =>
    setSelectedCallIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const callLogs = useQuery({
    queryKey: ["broker-call-logs", user?.id, callsView],
    enabled: !!user?.id,
    queryFn: async () => {
      const q = supabase
        .from("broker_call_logs")
        .select("id, lead_id, phone_number, call_type, call_status, duration_seconds, notes, created_at, recording_url, ai_summary, ai_score, ai_processed_at, deleted_at")
        .eq("user_id", user!.id)
        .order(callsView === "deleted" ? "deleted_at" : "created_at", { ascending: false })
        .limit(100);
      const { data, error } = callsView === "deleted"
        ? await q.not("deleted_at", "is", null)
        : await q.is("deleted_at", null);
      if (error) throw error;
      return data ?? [];

    },
  });

  // Lightweight counts for both views (so the toggle can show a number badge).
  const callCounts = useQuery({
    queryKey: ["broker-call-counts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const [activeRes, deletedRes] = await Promise.all([
        supabase
          .from("broker_call_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .is("deleted_at", null),
        supabase
          .from("broker_call_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .not("deleted_at", "is", null),
      ]);
      return { active: activeRes.count ?? 0, deleted: deletedRes.count ?? 0 };
    },
  });

  const createCallLog = useMutation({
    mutationFn: async (input: {
      leadId?: string | null;
      phoneNumber: string;
      callType: string;
      callStatus: string;
      durationSeconds: number;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error("Please sign in");
      const { data, error } = await supabase
        .from("broker_call_logs")
        .insert({
          user_id: user.id,
          lead_id: input.leadId || null,
          phone_number: input.phoneNumber,
          call_type: input.callType,
          call_status: input.callStatus,
          duration_seconds: input.durationSeconds,
          notes: input.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data: existingStats } = await supabase
          .from("broker_activity_stats")
          .select("id, calls_made")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (existingStats?.id) {
          await supabase
            .from("broker_activity_stats")
            .update({
              calls_made: (existingStats.calls_made ?? 0) + 1,
            })
            .eq("id", existingStats.id);
        } else {
          await supabase.from("broker_activity_stats").insert({
            user_id: user.id,
            date: today,
            calls_made: 1,
          });
        }
      } catch (sideEffectError) {
        console.warn("Call logged; activity stat update skipped", sideEffectError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      queryClient.invalidateQueries({ queryKey: ["broker-personal-tasks"] });
      toast.success("Call logged successfully");
      setTab("calls");
    },
    onError: (e: any) => toast.error(e?.message || "Could not log call"),
  });

  const softDeleteCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success("Call moved to Recently deleted");
    },
    onError: (e: any) => toast.error(e?.message || "Could not delete call"),
  });

  const restoreCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .update({ deleted_at: null })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success("Call restored");
    },
    onError: (e: any) => toast.error(e?.message || "Could not restore call"),
  });

  const deleteAllCalls = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("broker_call_logs")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .is("deleted_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success("All calls moved to Recently deleted");
    },
    onError: (e: any) => toast.error(e?.message || "Could not delete all calls"),
  });

  const hardDeleteCall = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success("Call permanently deleted");
    },
    onError: (e: any) => toast.error(e?.message || "Could not permanently delete call"),
  });

  const bulkSoftDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success(`${ids.length} call${ids.length > 1 ? "s" : ""} moved to Recently deleted`);
      setSelectedCallIds(new Set());
    },
    onError: (e: any) => toast.error(e?.message || "Bulk delete failed"),
  });

  const bulkRestore = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .update({ deleted_at: null })
        .in("id", ids)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success(`${ids.length} call${ids.length > 1 ? "s" : ""} restored`);
      setSelectedCallIds(new Set());
    },
    onError: (e: any) => toast.error(e?.message || "Bulk restore failed"),
  });

  const bulkHardDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("broker_call_logs")
        .delete()
        .in("id", ids)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] }); queryClient.invalidateQueries({ queryKey: ["broker-call-counts"] });
      toast.success(`${ids.length} call${ids.length > 1 ? "s" : ""} permanently deleted`);
      setSelectedCallIds(new Set());
    },
    onError: (e: any) => toast.error(e?.message || "Bulk permanent delete failed"),
  });


  const leadsData: any[] = (leads.data as any[]) ?? [];
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leadsData;
    const q = search.toLowerCase();
    return leadsData.filter((l: any) =>
      (l.full_name || "").toLowerCase().includes(q) ||
      getLeadEmail(l).toLowerCase().includes(q) ||
      getLeadPhone(l).toLowerCase().includes(q) ||
      (l.pipeline_stage || "").toLowerCase().includes(q),
    );
  }, [leadsData, search]);

  const totalLeads = leadsData.length;
  const callsLogged = callLogs.data?.length ?? 0;
  const followUps = (tasks.data ?? []).filter((t: any) => t.status !== "done").length;
  const wonStage = leadsData.filter((l: any) =>
    ["won", "closed_won", "contract"].includes(((l.pipeline_stage ?? l.status) ?? "").toString().toLowerCase()),
  ).length;
  const conversion = totalLeads > 0 ? Math.round((wonStage / totalLeads) * 100) : 0;

  const stageCounts = useMemo(() => {
    return STAGE_GROUPS.map((g) => {
      const items = leadsData.filter((l: any) =>
        g.match.includes(((l.pipeline_stage ?? l.status) ?? "").toString().toLowerCase()),
      );
      return { ...g, count: items.length, items };
    });
  }, [leadsData]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <PremiumCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span data-section-label="" className="jj-section-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em]">
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.6} /> JBJ Global Real Estate
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-2">CRM Pipeline</h1>

            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Your assigned databases, leads, calls, and pipeline insights — all in one premium workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setUploadOpen(true)} variant="primary">
              <Upload className="w-4 h-4 mr-1.5" /> Add database
            </Button>
            <Button variant="secondary" onClick={() => setRequestOpen(true)}>
              <Inbox className="w-4 h-4 mr-1.5" /> Request database
            </Button>
            <Button asChild variant="primary">
              <Link to="/broker/leads?action=new">
                <Plus className="h-4 w-4 mr-1.5" /> Add lead
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => setCallDialogOpen(true)}>
              <Phone className="w-4 h-4 mr-1.5" /> Log a call
            </Button>
          </div>
        </div>
      </PremiumCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Kpi icon={Users} label="Assigned leads" value={totalLeads} onClick={() => setTab("leads")} />
        <Kpi icon={Database} label="Databases" value={dbs.data?.length ?? 0} onClick={() => setTab("databases")} />
        <Kpi icon={Phone} label="Calls logged" value={callsLogged} onClick={() => setTab("calls")} />
        <Kpi icon={ClipboardList} label="Pending follow-ups" value={followUps} onClick={() => setTab("activity")} />
        <Kpi icon={TrendingUp} label="Conversion" value={`${conversion}%`} sub={`${wonStage} won`} onClick={() => setTab("insights")} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#F7F2EA] border border-[color:var(--emerald-1)]/22 shadow-[0_6px_18px_-16px_rgba(6,78,59,0.35)]">
        {([
          { id: "pipeline", label: "Pipeline", icon: BarChart3 },
          { id: "databases", label: "My Databases", icon: Database },
          { id: "leads", label: "My Leads", icon: Users },
          { id: "calls", label: "Calls", icon: Phone },
          { id: "insights", label: "Insights", icon: Sparkles },
          { id: "activity", label: "Activity", icon: Activity },
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "tasks", label: "Tasks", icon: ListTodo },
          { id: "notes", label: "Notes", icon: StickyNote },
          { id: "inbox", label: "Inbox", icon: Inbox },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-jj-segmented-trigger=""
              data-state={active ? "active" : undefined}
              data-active={active ? "true" : undefined}
              className="jj-tab-pill"
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* Body */}
      {tab === "pipeline" && (
        <div className="space-y-4">
          <PremiumCard>
            <div className="flex items-center justify-between mb-4">
              <span data-section-label="" className="jj-section-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em]">
                <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.6} /> Pipeline by stage
              </span>
              <span className="text-xs text-[#1A1A1A]/60">{totalLeads} total leads</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {stageCounts.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setSearch(s.label.toLowerCase()); setTab("leads"); }}
                  className="jj-hover-emerald group text-left rounded-xl bg-[#FDFBF7] border border-[color:var(--emerald-1)]/22 px-4 py-4 focus:outline-none"
                >
                  <IconTile icon={BarChart3} tone="emerald" size="sm" className="!h-9 !w-9 !rounded-xl" iconClassName="!h-4 !w-4" />
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 mt-3 font-semibold">{s.label}</div>
                  <div className="text-2xl font-semibold tabular-nums text-[#1A1A1A] mt-1">{s.count}</div>
                </button>
              ))}
            </div>
          </PremiumCard>

          {/* Kanban board — premium lead-card columns per stage */}
          {leadsData.length > 0 && (
            <PremiumCard>
              <div className="flex items-center justify-between mb-4">
                <span data-section-label="" className="jj-section-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em]">
                  <Activity className="h-3.5 w-3.5" strokeWidth={2.6} /> Kanban board
                </span>
                <span className="text-[11px] text-[#1A1A1A]/60">Click any card to open the lead</span>
              </div>
              <div className="-mx-2 px-2 overflow-x-auto pb-2 jj-kanban-scroll">
                <div className="flex gap-3 min-w-max xl:grid xl:grid-cols-6 xl:min-w-0">
                {stageCounts.map((s) => (
                  <div
                    key={s.key}
                    className="w-[240px] xl:w-auto shrink-0 rounded-xl bg-[#FDFBF7] border border-[color:var(--emerald-1)]/22 flex flex-col min-h-[220px]"
                  >
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[color:var(--emerald-1)]/15">
                      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A] truncate">{s.label}</div>
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-[color:var(--emerald-1)] text-white text-[10px] font-bold tabular-nums shrink-0">
                        {s.count}
                      </span>
                    </div>
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[420px]">
                      {s.items.slice(0, 12).map((l: any) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setHubLead(l)}
                          className="jj-hover-emerald w-full text-left rounded-lg bg-white border border-[#B89555]/25 px-3 py-2.5 focus:outline-none transition-shadow hover:shadow-[0_8px_20px_-14px_rgba(6,78,59,0.35)]"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                              {(l.full_name || "?").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-semibold text-[#1A1A1A] truncate">{l.full_name || "Unnamed lead"}</div>
                              <div className="text-[10px] text-[#1A1A1A]/60 truncate">{getLeadEmail(l) || getLeadPhone(l) || "—"}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#B89555]/15 gap-2">
                            <span className="text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/55 truncate min-w-0">
                              {l.source || l.lead_source_type || "Direct"}
                            </span>
                            <span className="text-[9px] text-[#1A1A1A]/55 tabular-nums shrink-0">{formatDisplayDate(l.updated_at)}</span>
                          </div>
                        </button>
                      ))}
                      {s.items.length === 0 && (
                        <div className="text-[10px] text-[#1A1A1A]/45 italic text-center py-6">No leads in this stage</div>
                      )}
                      {s.items.length > 12 && (
                        <button
                          type="button"
                          onClick={() => { setSearch(s.label.toLowerCase()); setTab("leads"); }}
                          className="w-full text-[10px] text-[color:var(--emerald-1)] font-semibold py-1.5 hover:underline"
                        >
                          + {s.items.length - 12} more
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </PremiumCard>
          )}





          {/* Leads table — always visible on Pipeline tab so the empty state guides the broker */}
          <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/20">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Your leads</h3>
              <button
                type="button"
                onClick={() => setTab("leads")}
                className="text-[11px] text-[#1A1A1A]/65 hover:text-[#1A1A1A] inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {leads.isLoading ? (
              <Loading />
            ) : leadsData.length === 0 ? (
              <div>
                <div className="grid grid-cols-[40px_1fr_140px_140px_120px] gap-3 px-4 py-2.5 bg-[#EFE6D6]/60 border-b border-[#B89555]/20 text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70 font-semibold">
                  <div></div>
                  <div>Lead</div>
                  <div>Stage</div>
                  <div>Source</div>
                  <div className="text-right">Updated</div>
                </div>
                <div className="py-12 px-6 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 grid place-items-center rounded-2xl jj-icon-tile-emerald shadow-[0_10px_24px_-14px_rgba(6,78,59,0.55)]" data-icon-tile="">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">There are no leads yet</div>

                  <p className="text-xs text-[#1A1A1A]/65 mt-1 max-w-md mx-auto">
                    Start adding your first leads — your pipeline, stages, and conversion will fill in
                    automatically as you work.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Link
                      to="/broker/leads"
                      className="jj-cta-primary jj-cta-champagne inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-semibold shadow-sm transition-colors"
                      data-surface="emerald"
                      data-cta="primary"
                    >
                      <Plus className="h-4 w-4" /> Add your first lead
                    </Link>
                    <Button
                      type="button"
                      onClick={() => setUploadOpen(true)}
                      variant="secondary"
                    >
                      <Upload className="h-4 w-4" /> Upload a database
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[40px_1fr_140px_140px_120px] gap-3 px-4 py-2.5 bg-[#EFE6D6]/60 border-b border-[#B89555]/20 text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70 font-semibold">
                  <div></div>
                  <div>Lead</div>
                  <div>Stage</div>
                  <div>Source</div>
                  <div className="text-right">Updated</div>
                </div>
                <div className="divide-y divide-[#B89555]/15">
                  {leadsData.slice(0, 8).map((l: any) => (
                    <div key={l.id} className="grid grid-cols-[40px_1fr_140px_140px_120px] gap-3 items-center px-4 py-3">
                      <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/25 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                        {(l.full_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#1A1A1A] truncate">{l.full_name || "Unnamed lead"}</div>
                        <div className="text-[11px] text-[#1A1A1A]/65 truncate">{getLeadEmail(l) || getLeadPhone(l) || "—"}</div>
                      </div>
                      <div className="text-xs text-[#1A1A1A]/75 truncate">{l.pipeline_stage || "new"}</div>
                      <div className="text-xs text-[#1A1A1A]/75 truncate">{l.source || l.lead_source_type || "—"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60 tabular-nums text-right">{formatDisplayDate(l.updated_at)}</div>
                    </div>
                  ))}
                </div>
                {leadsData.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setTab("leads")}
                    className="w-full text-center text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] py-3 border-t border-[#B89555]/15 hover:bg-[#EFE6D6]/40"
                  >
                    View all {leadsData.length} leads →
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "databases" && (
        openDbSheet ? (
          <BrokerDatabaseSheet
            databaseId={openDbSheet.id}
            databaseName={openDbSheet.name}
            onBack={() => setOpenDbSheet(null)}
          />
        ) : (
        <section className="space-y-3">
          {dbs.isLoading ? (
            <Loading />
          ) : (dbs.data?.length ?? 0) === 0 ? (
            <PremiumCard className="text-center py-10">
              <div className="mx-auto mb-4 h-14 w-14 grid place-items-center rounded-2xl jj-icon-tile-emerald shadow-[0_10px_24px_-14px_rgba(6,78,59,0.55)]" data-icon-tile="">
                <Inbox className="h-7 w-7 text-white" />
              </div>
              <div className="text-sm font-semibold text-[#1A1A1A]">No databases shared with you yet</div>

              <p className="text-xs text-[#1A1A1A]/65 mt-1 max-w-md mx-auto">
                When your manager grants access to a CRM database — or you upload one yourself — it will appear here.
                Click any database to open it as a separate sheet without merging into My Leads.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  variant="primary"
                >
                  <Upload className="w-4 h-4" /> Add a database
                </Button>
                <Button
                  type="button"
                  onClick={() => setRequestOpen(true)}
                  variant="secondary"
                >
                  <Inbox className="w-4 h-4" /> Request a database
                </Button>
              </div>
            </PremiumCard>
          ) : (
            dbs.data!.map((d) => (
              <button
                key={d.grant_id}
                type="button"
                onClick={() => setOpenDbSheet({ id: d.database_id, name: d.database_name })}
                className="jj-hover-emerald group block w-full text-left p-4 rounded-xl bg-[#F7F2EA] border border-[color:var(--emerald-1)]/24"
              >
                <div className="flex items-center gap-3">
                  <IconTile icon={Database} tone="emerald" size="md" className="!h-10 !w-10 !rounded-xl" iconClassName="!h-5 !w-5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">{d.database_name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/65">
                      {d.permission_level === "edit" ? "Edit access" : "View access"} · granted {formatDisplayDate(d.granted_at)}
                      {d.date_window_mode !== "all" && ` · window: ${d.date_window_mode}`}
                    </div>
                  </div>
                  <span data-surface="emerald" data-allow-dark-cta className="allow-white inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75)] group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="h-4 w-4" strokeWidth={2.6} style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none", opacity: 1 }} />
                  </span>
                </div>
              </button>
            ))

          )}
        </section>
        )
      )}


      {tab === "leads" && (
        <div className="space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/45" />
            <Input
              placeholder="Search by name, email, phone, or stage…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
            />
          </div>
          <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
            {leads.isLoading ? (
              <Loading />
            ) : filteredLeads.length === 0 ? (
              <div>
                {/* Table header so the layout reads as a real table even when empty */}
                <div className="grid grid-cols-[40px_1fr_140px_140px_120px] gap-3 px-4 py-2.5 bg-[#EFE6D6]/60 border-b border-[#B89555]/20 text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70 font-semibold">
                  <div></div>
                  <div>Lead</div>
                  <div>Stage</div>
                  <div>Source</div>
                  <div className="text-right">Updated</div>
                </div>
                <div className="py-12 px-6 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 grid place-items-center rounded-2xl jj-icon-tile-emerald shadow-[0_10px_24px_-14px_rgba(6,78,59,0.55)]" data-icon-tile="">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-[#1A1A1A]">
                    {search ? "No leads match your search" : "You don't have any leads yet"}
                  </div>

                  <p className="text-xs text-[#1A1A1A]/65 mt-1 max-w-md mx-auto">
                    {search
                      ? "Try a different name, email, phone or pipeline stage."
                      : "Start building your pipeline by adding your first lead, or upload a database to import in bulk."}
                  </p>
                  {!search && (
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <Link
                        to="/broker/leads"
                        className="jj-cta-primary jj-cta-champagne inline-flex items-center gap-2 h-10 px-5 rounded-md text-sm font-semibold shadow-sm transition-colors"
                        data-surface="emerald"
                        data-cta="primary"
                      >
                        <Plus className="h-4 w-4" /> Add your first lead
                      </Link>
                      <Button
                        type="button"
                        onClick={() => setRequestOpen(true)}
                        variant="secondary"
                      >
                        <Upload className="h-4 w-4" /> Upload a database
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[40px_1fr_140px_140px_120px] gap-3 px-4 py-2.5 bg-[#EFE6D6]/60 border-b border-[#B89555]/20 text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70 font-semibold">
                  <div></div>
                  <div>Lead</div>
                  <div>Stage</div>
                  <div>Source</div>
                  <div className="text-right">Updated</div>
                </div>
                <div className="divide-y divide-[#B89555]/15">
                  {filteredLeads.map((l: any) => (
                    <div
                      key={l.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setHubLead(l)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHubLead(l); } }}
                      className="grid grid-cols-[40px_1fr_120px_120px_100px_90px] gap-3 items-center px-4 py-3 cursor-pointer hover:bg-[#EFE6D6]/40 transition-colors focus:outline-none focus:bg-[#EFE6D6]/60"
                      title="Open lead hub (calendar, tasks, notes)"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/25 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                        {(l.full_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#1A1A1A] truncate">{l.full_name || "Unnamed lead"}</div>
                        <div className="text-[11px] text-[#1A1A1A]/65 truncate">{getLeadEmail(l) || getLeadPhone(l) || "—"}</div>
                      </div>
                      <div className="text-xs text-[#1A1A1A]/75 truncate">{l.pipeline_stage || "new"}</div>
                      <div className="text-xs text-[#1A1A1A]/75 truncate">{l.source || l.lead_source_type || "—"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/60 tabular-nums text-right">{formatDisplayDate(l.updated_at)}</div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setJunkLead({ id: l.id, name: l.full_name }); }}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-[#B89555]/40 text-[11px] font-semibold text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
                          title="Return to JBJ owner as junk"
                        >
                          <AlertTriangle className="h-3 w-3" /> Junk
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>
      )}

      {tab === "calls" && (
        <PremiumCard>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[#1A1A1A]">
                {callsView === "deleted" ? "Recently deleted" : "Calls made"}
              </h2>
              <div className="inline-flex rounded-md border border-[#B89555]/35 bg-[#FDFBF7] p-0.5">
                <button
                  type="button"
                  onClick={() => setCallsView("active")}
                  className={`text-[11px] px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${callsView === "active" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "text-[#1A1A1A]/65 hover:text-[#1A1A1A]"}`}
                >
                  Active
                  <span className="tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A]/80">
                    {callCounts.data?.active ?? 0}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCallsView("deleted")}
                  className={`text-[11px] px-2.5 py-1 rounded inline-flex items-center gap-1.5 ${callsView === "deleted" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "text-[#1A1A1A]/65 hover:text-[#1A1A1A]"}`}
                >
                  Recently deleted
                  <span className="tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A]/80">
                    {callCounts.data?.deleted ?? 0}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {callsView === "active" && (callLogs.data ?? []).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className=""
                  onClick={() => {
                    if (confirm(`Move all ${callLogs.data!.length} calls to Recently deleted?`)) {
                      deleteAllCalls.mutate();
                    }
                  }}
                  disabled={deleteAllCalls.isPending}
                >
                  Delete all
                </Button>
              )}
              {callsView === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  className=""
                  onClick={() => setCallDialogOpen(true)}
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" /> Log a call
                </Button>
              )}
            </div>
          </div>
          {callLogs.isLoading ? (
            <Loading />
          ) : (callLogs.data ?? []).length === 0 ? (
            <Empty msg={callsView === "deleted" ? "No deleted calls. Items you delete will appear here and can be restored within 30 days." : "No calls logged yet. Use Log a call to capture broker activity, duration, outcome, and notes."} />
          ) : (
            <>
              {/* Bulk selection toolbar */}
              {(() => {
                const visible = (callLogs.data ?? []).slice(0, 50);
                const allSelected = visible.length > 0 && visible.every((l: any) => selectedCallIds.has(l.id));
                const someSelected = selectedCallIds.size > 0;
                const selectedArr = Array.from(selectedCallIds);
                return (
                  <div className="mb-3 flex items-center justify-between gap-2 flex-wrap rounded-lg bg-[#EFE6D6]/50 border border-[#B89555]/30 px-3 py-2">
                    <label className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCallIds(new Set(visible.map((l: any) => l.id)));
                          else setSelectedCallIds(new Set());
                        }}
                        className="h-4 w-4 accent-[#B89555]"
                      />
                      <span className="font-medium">
                        {allSelected
                          ? `Deselect all (${selectedCallIds.size})`
                          : someSelected
                            ? `${selectedCallIds.size} selected · Select all`
                            : "Select all"}
                      </span>
                    </label>
                    {someSelected && (
                      <div className="flex items-center gap-2">
                        {callsView === "active" ? (
                          <Button
                            variant="outline" size="sm"
                            className=""
                            onClick={() => {
                              if (confirm(`Move ${selectedArr.length} call(s) to Recently deleted?`)) bulkSoftDelete.mutate(selectedArr);
                            }}
                            disabled={bulkSoftDelete.isPending}
                          >
                            Delete selected
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline" size="sm"
                              className=""
                              onClick={() => bulkRestore.mutate(selectedArr)}
                              disabled={bulkRestore.isPending}
                            >
                              Restore selected
                            </Button>
                            <Button
                              variant="outline" size="sm"
                              className=""
                              onClick={() => {
                                if (confirm(`Permanently delete ${selectedArr.length} call(s)? This cannot be undone.`)) bulkHardDelete.mutate(selectedArr);
                              }}
                              disabled={bulkHardDelete.isPending}
                            >
                              Delete forever
                            </Button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedCallIds(new Set())}
                          className="text-[11px] px-2 py-1 rounded border "
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <ul className="space-y-2.5">
                {(callLogs.data ?? [])
                  .slice(0, 50)
                  .map((log: any) => {
                    const lead = leadsData.find((item) => item.id === log.lead_id);
                    const checked = selectedCallIds.has(log.id);
                    return (
                    <li key={log.id} className="group">
                      <div className={`w-full rounded-xl border transition-colors ${checked ? "bg-[#F2EADA] border-[#B89555]/60" : "bg-[#FDFBF7] border-[#B89555]/30 hover:border-[#B89555]/55 hover:bg-[#F7F2EA]"}`}>
                        <div className="flex items-stretch">
                          <label className="pl-3.5 flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectCall(log.id)}
                              className="h-4 w-4 accent-[#B89555]"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setOpenCallId(log.id)}
                            className="flex-1 min-w-0 p-3.5 flex items-center gap-3 text-left"
                          >
                            <div className="h-9 w-9 rounded-md bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center shrink-0">
                              <Phone className="h-4 w-4 text-[#1A1A1A]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[#1A1A1A] truncate flex items-center gap-2 flex-wrap">
                                {lead?.full_name ? `Call with ${lead.full_name}` : "Manual broker call"}
                                {log.recording_url && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#B89555]/40 text-[#1A1A1A]/75">Recording</span>
                                )}
                                {log.ai_processed_at && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#B89555]/40 text-[#1A1A1A]/75">AI</span>
                                )}
                                {typeof log.ai_score === "number" && (
                                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/45 text-[#1A1A1A]">Score {log.ai_score}</span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#1A1A1A]/60 truncate mt-0.5">
                                {log.call_status || "completed"} · {log.call_type || "outbound"} · {formatDuration(log.duration_seconds)} · {formatDisplayDate(log.created_at)}
                                {callsView === "deleted" && log.deleted_at && (
                                  <> · deleted {formatDisplayDate(log.deleted_at)}</>
                                )}
                              </div>
                              {(log.ai_summary || log.notes) && (
                                <div className="text-xs text-[#1A1A1A]/75 mt-1 truncate">{log.ai_summary || log.notes}</div>
                              )}
                            </div>
                            <div className="text-xs text-[#1A1A1A]/65 tabular-nums shrink-0 pr-3">{log.phone_number}</div>
                          </button>
                          <div className="flex flex-col justify-center gap-1 pr-3">
                            {callsView === "active" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Move this call to Recently deleted?")) softDeleteCall.mutate(log.id);
                                }}
                                className="text-[11px] px-2 py-1 rounded border "
                                disabled={softDeleteCall.isPending}
                              >
                                Delete
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); restoreCall.mutate(log.id); }}
                                  className="text-[11px] px-2 py-1 rounded border "
                                  disabled={restoreCall.isPending}
                                >
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Permanently delete this call? This cannot be undone.")) hardDeleteCall.mutate(log.id);
                                  }}
                                  className="text-[11px] px-2 py-1 rounded border border-[#B89555]/40 text-[#1A1A1A]/80 hover:bg-[#EFE6D6]"
                                  disabled={hardDeleteCall.isPending}
                                >
                                  Delete forever
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                    );
                  })}
              </ul>
            </>
          )}
        </PremiumCard>
      )}


      {tab === "insights" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PremiumCard>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#1A1A1A]/70" />
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Smart insights</h2>
            </div>
            <ul className="text-sm text-[#1A1A1A]/80 space-y-2 leading-relaxed">
              <li>• {totalLeads} leads in your scope, {wonStage} won ({conversion}% conversion).</li>
              <li>• {followUps} follow-ups still pending — clear these first to lift your conversion.</li>
              <li>• {dbs.data?.length ?? 0} databases shared with you — request more from your manager when needed.</li>
            </ul>
            <Link
              to="/broker/ai"
              className="jj-cta-primary jj-cta-champagne mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-md text-xs font-semibold"
              data-surface="emerald"
              data-cta="primary"
            >
              <Sparkles className="h-3.5 w-3.5" /> Open AI sales assistant
            </Link>
          </PremiumCard>
          <PremiumCard>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-[#1A1A1A]/70" />
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Pipeline snapshot</h2>
            </div>
            <div className="space-y-2">
              {stageCounts.map((s) => {
                const pct = totalLeads > 0 ? Math.round((s.count / totalLeads) * 100) : 0;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between text-xs text-[#1A1A1A]/75 mb-1">
                      <span>{s.label}</span>
                      <span className="tabular-nums">{s.count} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[color:var(--emerald-soft-bg)] overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, background: "var(--gradient-emerald)" }} />
                    </div>

                  </div>
                );
              })}
            </div>
          </PremiumCard>
        </div>
      )}

      {tab === "activity" && (
        <PremiumCard>
          <h2 className="text-sm font-semibold text-[#1A1A1A] mb-3">Recent activity</h2>
          {leadsData.length === 0 ? (
            <Empty msg="Activity stream will appear here as you work on leads." />
          ) : (
            <ul className="divide-y divide-[#B89555]/15">
              {leadsData.slice(0, 12).map((l: any) => (
                <li key={l.id} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/25 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                    {(l.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1A1A1A] truncate">
                      {l.full_name || "Unnamed lead"}
                      <span className="text-[#1A1A1A]/55"> · {l.pipeline_stage || "new"}</span>
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/55 truncate">Updated {formatDisplayDate(l.updated_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>
      )}

      {tab === "calendar" && (
        <Suspense fallback={<Loading />}>
          <BrokerCalendarTab />
        </Suspense>
      )}
      {tab === "tasks" && (
        <Suspense fallback={<Loading />}>
          <BrokerTasksTab />
        </Suspense>
      )}
      {tab === "notes" && (
        <Suspense fallback={<Loading />}>
          <BrokerNotesTab />
        </Suspense>
      )}
      {tab === "inbox" && (
        <Suspense fallback={<Loading />}>
          <BrokerInboxTab />
        </Suspense>
      )}

      <LogCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        leads={leadsData}
        userId={user?.id}
        submitting={createCallLog.isPending}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] })}
        onSubmit={async (input) => {
          const row = await createCallLog.mutateAsync(input);
          return { callLogId: (row as any)?.id };
        }}
      />
      <RequestDatabaseDialog open={requestOpen} onOpenChange={setRequestOpen} />
      <UploadDatabaseDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["broker-scoped-databases"] });
          queryClient.invalidateQueries({ queryKey: ["broker-scoped-leads"] });
          setTab("databases");
        }}
      />
      <CallDetailSheet
        callId={openCallId}
        leadName={(() => {
          const log = (callLogs.data ?? []).find((l: any) => l.id === openCallId);
          const lead = log ? leadsData.find((x: any) => x.id === log.lead_id) : null;
          return lead?.full_name ?? null;
        })()}
        open={!!openCallId}
        onOpenChange={(o) => { if (!o) setOpenCallId(null); }}
      />
      <MarkJunkDialog
        open={!!junkLead}
        leadId={junkLead?.id ?? null}
        leadName={junkLead?.name ?? null}
        onOpenChange={(o) => { if (!o) setJunkLead(null); }}
      />
      <LeadHubSheet
        lead={hubLead}
        open={!!hubLead}
        onOpenChange={(o) => { if (!o) setHubLead(null); }}
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="p-10 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="p-10 text-center text-sm text-[#1A1A1A]/60">{msg}</div>
  );
}
