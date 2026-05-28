import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { useBrokerPersonalTasks } from "@/hooks/useBrokerPersonalTasks";
import {
  Database, Users, Activity, ArrowRight, Loader2, Plus, Phone, Upload,
  TrendingUp, BarChart3, Inbox, ClipboardList, Sparkles, Search,
} from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RequestDatabaseDialog from "@/components/broker-portal/RequestDatabaseDialog";
import LogCallDialog from "@/components/broker-crm/LogCallDialog";

type Tab = "pipeline" | "databases" | "leads" | "calls" | "insights" | "activity";

function PremiumCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/30 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 grid place-items-center rounded-md bg-[#EFE6D6] border border-[#B89555]/35">
          <Icon className="h-4 w-4 text-[#1A1A1A]" />
        </div>
      </div>
      <div className="mt-3 text-2xl md:text-3xl font-semibold tabular-nums text-[#1A1A1A]">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-[#1A1A1A]/55 mt-1">{sub}</div>}
    </div>
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

function LogCallDialog({
  open,
  onOpenChange,
  leads,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: any[];
  submitting: boolean;
  onSubmit: (input: { leadId?: string | null; phoneNumber: string; callType: string; callStatus: string; durationSeconds: number; notes?: string | null }) => void;
}) {
  const [leadId, setLeadId] = useState("manual");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callType, setCallType] = useState("outbound");
  const [callStatus, setCallStatus] = useState("completed");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [notes, setNotes] = useState("");

  const selectedLead = leads.find((lead) => lead.id === leadId);

  const reset = () => {
    setLeadId("manual");
    setPhoneNumber("");
    setCallType("outbound");
    setCallStatus("completed");
    setDurationSeconds("0");
    setNotes("");
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleLeadChange = (value: string) => {
    setLeadId(value);
    const nextLead = leads.find((lead) => lead.id === value);
    if (nextLead) setPhoneNumber(getLeadPhone(nextLead));
  };

  const submit = (event: any) => {
    event.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      toast.error("Add a phone number before saving the call");
      return;
    }
    onSubmit({
      leadId: leadId === "manual" ? null : leadId,
      phoneNumber: cleanPhone,
      callType,
      callStatus,
      durationSeconds: Math.max(0, Number(durationSeconds) || 0),
      notes: notes.trim() || (selectedLead?.full_name ? `Call with ${selectedLead.full_name}` : null),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#1A1A1A]" /> Log a call
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Save call activity against an assigned lead, or log a manual broker call.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Lead</Label>
            <Select value={leadId} onValueChange={handleLeadChange}>
              <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                <SelectValue placeholder="Manual call" />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] border-[#B89555]/35">
                <SelectItem value="manual">Manual call / no lead</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name || "Unnamed lead"}{getLeadPhone(lead) ? ` · ${getLeadPhone(lead)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Phone number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+971 XX XXX XXXX"
                className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Duration seconds</Label>
              <Input
                type="number"
                min="0"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Call type</Label>
              <Select value={callType} onValueChange={setCallType}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] border-[#B89555]/35">
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Outcome</Label>
              <Select value={callStatus} onValueChange={setCallStatus}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] border-[#B89555]/35">
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_answer">No answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="wrong_number">Wrong number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call summary, next step, objection, or follow-up note…"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[110px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#102540] text-white hover:bg-[#1a3d63]" data-allow-dark-cta data-no-contrast-guard>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save call log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BrokerCRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();
  const tasks = useBrokerPersonalTasks();

  useEffect(() => {
    const nextTab = searchParams.get("tab") as Tab | null;
    const action = searchParams.get("action");
    if (nextTab && ["pipeline", "databases", "leads", "calls", "insights", "activity"].includes(nextTab)) {
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

  const callLogs = useQuery({
    queryKey: ["broker-call-logs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_call_logs")
        .select("id, lead_id, phone_number, call_type, call_status, duration_seconds, notes, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
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

      const today = new Date().toISOString().slice(0, 10);
      const { data: existingStats } = await supabase
        .from("broker_activity_stats")
        .select("id, calls_made, points_earned")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existingStats?.id) {
        await supabase
          .from("broker_activity_stats")
          .update({
            calls_made: (existingStats.calls_made ?? 0) + 1,
            points_earned: (existingStats.points_earned ?? 0) + 10,
          })
          .eq("id", existingStats.id);
      } else {
        await supabase.from("broker_activity_stats").insert({
          user_id: user.id,
          date: today,
          calls_made: 1,
          points_earned: 10,
        });
      }

      await supabase.from("points_transactions").insert({
        user_id: user.id,
        points: 10,
        transaction_type: "call_logged",
        description: "Logged a broker CRM call",
        reference_id: data.id,
        reference_type: "broker_call_log",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["broker-personal-tasks"] });
      toast.success("Call logged successfully — +10 points");
      setCallDialogOpen(false);
      setTab("calls");
    },
    onError: (e: any) => toast.error(e?.message || "Could not log call"),
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
    return STAGE_GROUPS.map((g) => ({
      ...g,
      count: leadsData.filter((l: any) =>
        g.match.includes(((l.pipeline_stage ?? l.status) ?? "").toString().toLowerCase()),
      ).length,
    }));
  }, [leadsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PremiumCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1">CRM Pipeline</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Your assigned databases, leads, calls, and pipeline insights — all in one premium workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setRequestOpen(true)}
              className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45 hover:bg-[#E6DAC2]"
            >
              <Upload className="w-4 h-4 mr-1.5" /> Request database
            </Button>
            <Link
              to="/broker/leads"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[#102540] text-white text-sm font-medium hover:bg-[#1a3d63] transition-colors"
              data-allow-dark-cta
            >
              <Plus className="h-4 w-4" /> Add lead
            </Link>
            <Button
              variant="outline"
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              onClick={() => setCallDialogOpen(true)}
            >
              <Phone className="w-4 h-4 mr-1.5" /> Log a call
            </Button>
          </div>
        </div>
      </PremiumCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Kpi icon={Users} label="Assigned leads" value={totalLeads} />
        <Kpi icon={Database} label="Databases" value={dbs.data?.length ?? 0} />
        <Kpi icon={Phone} label="Calls logged" value={callsLogged} />
        <Kpi icon={ClipboardList} label="Pending follow-ups" value={followUps} />
        <Kpi icon={TrendingUp} label="Conversion" value={`${conversion}%`} sub={`${wonStage} won`} />
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-[#B89555]/25">
        {([
          { id: "pipeline", label: "Pipeline", icon: BarChart3 },
          { id: "databases", label: "My Databases", icon: Database },
          { id: "leads", label: "My Leads", icon: Users },
          { id: "calls", label: "Calls", icon: Phone },
          { id: "insights", label: "Insights", icon: Sparkles },
          { id: "activity", label: "Activity", icon: Activity },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm flex items-center gap-2 border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[#B89555] text-[#1A1A1A] font-semibold bg-[#EFE6D6]/40"
                  : "border-transparent text-[#1A1A1A]/65 hover:text-[#1A1A1A]"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* Body */}
      {tab === "pipeline" && (
        <PremiumCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Pipeline by stage</h2>
            <span className="text-xs text-[#1A1A1A]/55">{totalLeads} total leads</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageCounts.map((s) => (
              <div key={s.key} className="rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">{s.label}</div>
                <div className="text-2xl font-semibold tabular-nums text-[#1A1A1A] mt-1">{s.count}</div>
              </div>
            ))}
          </div>
        </PremiumCard>
      )}

      {tab === "databases" && (
        <section className="space-y-3">
          {dbs.isLoading ? (
            <Loading />
          ) : (dbs.data?.length ?? 0) === 0 ? (
            <PremiumCard className="text-center py-10">
              <Inbox className="h-7 w-7 mx-auto text-[#1A1A1A]/60 mb-3" />
              <div className="text-sm font-semibold text-[#1A1A1A]">No databases shared with you yet</div>
              <p className="text-xs text-[#1A1A1A]/65 mt-1 max-w-md mx-auto">
                When your manager grants access to a CRM database, it will appear here. You can also request a new
                database be uploaded to your scope.
              </p>
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="mt-5 inline-flex items-center gap-2 h-10 px-5 rounded-md bg-[#102540] text-white text-sm font-semibold border border-[#B89555]/55 hover:bg-[#1a3d63] shadow-sm transition-colors"
                data-allow-dark-cta
                data-no-contrast-guard
              >
                <Upload className="w-4 h-4" /> Request a database
              </button>
            </PremiumCard>

          ) : (
            dbs.data!.map((d) => (
              <Link
                key={d.grant_id}
                to={`/broker/crm/database/${d.database_id}`}
                className="block p-4 rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 hover:border-[#B89555]/55 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center">
                    <Database className="h-4 w-4 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">{d.database_name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/65">
                      {d.permission_level === "edit" ? "Edit access" : "View access"} · granted {formatDisplayDate(d.granted_at)}
                      {d.date_window_mode !== "all" && ` · window: ${d.date_window_mode}`}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#1A1A1A]/50" />
                </div>
              </Link>
            ))
          )}
        </section>
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
                  <Users className="h-8 w-8 mx-auto text-[#1A1A1A]/55 mb-3" />
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
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-[#102540] text-white text-sm font-semibold border border-[#B89555]/55 hover:bg-[#1a3d63] shadow-sm transition-colors"
                        data-allow-dark-cta
                        data-no-contrast-guard
                      >
                        <Plus className="h-4 w-4" /> Add your first lead
                      </Link>
                      <button
                        type="button"
                        onClick={() => setRequestOpen(true)}
                        className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/55 hover:bg-[#E6DAC2] transition-colors"
                      >
                        <Upload className="h-4 w-4" /> Upload a database
                      </button>
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
              </div>
            )}
          </section>

        </div>
      )}

      {tab === "calls" && (
        <PremiumCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Calls made</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              onClick={() => setCallDialogOpen(true)}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" /> Log a call
            </Button>
          </div>
          {callLogs.isLoading ? (
            <Loading />
          ) : (callLogs.data ?? []).length === 0 ? (
            <Empty msg="No calls logged yet. Use Log a call to capture broker activity, duration, outcome, notes, and points." />
          ) : (
            <ul className="divide-y divide-[#B89555]/15">
              {(callLogs.data ?? [])
                .slice(0, 20)
                .map((log: any) => {
                  const lead = leadsData.find((item) => item.id === log.lead_id);
                  return (
                  <li key={log.id} className="py-2.5 flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#1A1A1A]/60" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1A1A1A] truncate">
                        {lead?.full_name ? `Call with ${lead.full_name}` : "Manual broker call"}
                      </div>
                      <div className="text-[11px] text-[#1A1A1A]/55 truncate">
                        {log.call_status || "completed"} · {log.call_type || "outbound"} · {formatDuration(log.duration_seconds)} · {formatDisplayDate(log.created_at)}
                      </div>
                      {log.notes && <div className="text-xs text-[#1A1A1A]/70 mt-1 truncate">{log.notes}</div>}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/65 tabular-nums">{log.phone_number}</div>
                  </li>
                  );
                })}
            </ul>
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
              className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#102540] text-white text-xs font-medium hover:bg-[#1a3d63]"
              data-allow-dark-cta
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
                    <div className="h-1.5 rounded-full bg-[#EFE6D6] overflow-hidden">
                      <div className="h-full bg-[#B89555]/70" style={{ width: `${pct}%` }} />
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

      <LogCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        leads={leadsData}
        submitting={createCallLog.isPending}
        onSubmit={(input) => createCallLog.mutate(input)}
      />
      <RequestDatabaseDialog open={requestOpen} onOpenChange={setRequestOpen} />
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
