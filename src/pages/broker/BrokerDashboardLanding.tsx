import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Database, Calendar, ListTodo, Handshake, BadgeDollarSign,
  ArrowRight, Plus, Phone, Brain, Sparkles, Activity, ChevronRight, Briefcase,
} from "lucide-react";
import { IconTile, type IconTileTone } from "@/components/ui/icon-tile";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { useBrokerPersonalTasks } from "@/hooks/useBrokerPersonalTasks";
import { useBrokerPersonalCalendar } from "@/hooks/useBrokerPersonalCalendar";
import BrokerEmptyState from "@/components/broker-portal/BrokerEmptyState";
import LogCallDialog from "@/components/broker-crm/LogCallDialog";
import { formatDisplayDate } from "@/utils/formatDate";
import { supabase } from "@/integrations/supabase/client";

function PremiumCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 shadow-sm shadow-[#B89555]/5 p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  to,
  loading,
  tone = "gold",
}: {
  icon: any;
  label: string;
  value: number | string;
  to?: string;
  loading?: boolean;
  tone?: IconTileTone;
}) {
  const body = (
    <div className="group relative rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 px-4 py-5 hover:border-[#B89555]/70 hover:shadow-md hover:shadow-[#B89555]/10 transition-all h-full">
      <div className="flex items-center justify-between">
        <IconTile icon={Icon} tone={tone} size="md" />
        {to && <ArrowRight className="h-4 w-4 text-[#1A1A1A]/30 group-hover:text-[#B89555] group-hover:translate-x-0.5 transition-all" />}
      </div>
      <div className="mt-4 text-3xl md:text-4xl font-display font-semibold tabular-nums tracking-tight text-[#1A1A1A] leading-none">
        {loading ? <span className="inline-block h-8 w-12 bg-[#EFE6D6] rounded animate-pulse" /> : value}
      </div>
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 mt-2 font-medium">
        {label}
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function isToday(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function daysAgo(iso?: string | null) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export default function BrokerDashboardLanding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const { profile, loading: profileLoading } = useBrokerProfile();
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();
  const tasks = useBrokerPersonalTasks();
  const cal = useBrokerPersonalCalendar({ from: new Date().toISOString() });

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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-call-logs"] });
      toast.success("Call logged successfully");
    },
    onError: (e: any) => toast.error(e?.message || "Could not log call"),
  });

  const firstName =
    profile?.display_name?.split(" ")[0] ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "there";

  const leadsData: any[] = (leads.data as any[]) ?? [];
  const totalLeads = leadsData.length;
  const meetingsToday = (cal.data ?? []).filter((e) => isToday(e.starts_at)).length;
  const newAssignments = leadsData.filter((l: any) => daysAgo(l.created_at) <= 7).length;
  const followUps = (tasks.data ?? []).filter((t) => t.status !== "done").length;
  const activeDeals = leadsData.filter((l: any) =>
    ["negotiation", "qualified", "viewing_scheduled", "offer", "contract"].includes(
      ((l.pipeline_stage ?? l.status) ?? "").toString().toLowerCase(),
    ),
  ).length;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome strip — refined editorial header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#B89555]/30 bg-gradient-to-br from-[#F7F2EA] via-[#F7F2EA] to-[#EFE6D6] shadow-sm shadow-[#B89555]/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" />
        <div className="relative p-5 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-8 justify-between">
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-[#FDFBF7] border border-[#B89555]/40 grid place-items-center overflow-hidden shadow-sm shadow-[#B89555]/15 shrink-0">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-display font-semibold text-[#1A1A1A]">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55 font-medium">
                Welcome back
              </div>
              <h1 className="font-display text-[26px] md:text-4xl font-semibold text-[#1A1A1A] truncate leading-tight tracking-tight mt-0.5">
                {profileLoading ? "…" : firstName}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {profile?.title && (
                  <span className="text-xs text-[#1A1A1A]/70">{profile.title}</span>
                )}
                {profile?.current_tier && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-md bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] font-medium">
                    {profile.current_tier}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/broker/leads"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#102540] text-white text-sm font-medium hover:bg-[#1a3d63] transition-colors shadow-sm"
              data-allow-dark-cta
            >
              <Plus className="h-4 w-4" /> Add lead
            </Link>
            <button
              type="button"
              onClick={() => setCallDialogOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#FDFBF7] border border-[#B89555]/45 text-[#1A1A1A] text-sm font-medium hover:bg-[#EFE6D6] transition-colors"
            >
              <Phone className="h-4 w-4" /> Log a call
            </button>
          </div>
        </div>
      </div>

      {/* KPI tiles — semantic icon tones for visual hierarchy */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <Kpi icon={Users}           tone="blue"    label="Total leads"          value={totalLeads}     to="/broker/leads"        loading={leads.isLoading} />
        <Kpi icon={Handshake}       tone="emerald" label="Active deals"         value={activeDeals}    to="/broker/deals"        loading={leads.isLoading} />
        <Kpi icon={Calendar}        tone="amber"   label="Meetings today"       value={meetingsToday}  to="/broker/calendar"     loading={cal.isLoading} />
        <Kpi icon={Sparkles}        tone="purple"  label="New assignments"      value={newAssignments} to="/broker/leads"        loading={leads.isLoading} />
        <Kpi icon={BadgeDollarSign} tone="gold"    label="Commission pipeline"  value="—"              to="/broker/commissions"  />
        <Kpi icon={ListTodo}        tone="rose"    label="Pending follow-ups"   value={followUps}      to="/broker/tasks"        loading={tasks.isLoading} />
      </div>


      {/* Activity + Smart actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <PremiumCard className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1A1A1A]/70" />
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Live activity</h2>
            </div>
            <Link to="/broker/notifications" className="text-xs text-[#1A1A1A]/65 hover:text-[#1A1A1A] inline-flex items-center gap-1">
              All updates <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {leads.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
              ))}
            </div>
          ) : (leads.data?.length ?? 0) === 0 ? (
            <BrokerEmptyState
              icon={<Users className="h-4 w-4" />}
              title="No activity yet"
              description="New leads, owner comments and reminders will surface here as soon as you're assigned data."
            />
          ) : (
            <ul className="divide-y divide-[#B89555]/15">
              {leadsData.slice(0, 6).map((l: any) => (
                <li key={l.id} className="py-2.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/25 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                    {(l.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#1A1A1A] truncate">
                      {l.full_name || "Unnamed lead"}
                      <span className="text-[#1A1A1A]/55"> · {l.pipeline_stage || "new"}</span>
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/55 truncate">
                      Updated {formatDisplayDate(l.updated_at)}
                      {l.source ? ` · source: ${l.source}` : ""}
                    </div>
                  </div>
                  <Link
                    to="/broker/crm"
                    className="text-[11px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-0.5"
                  >
                    Open <ChevronRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PremiumCard>

        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <PremiumCard>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-[#1A1A1A]/70" />
              <h2 className="text-sm font-semibold text-[#1A1A1A]">Smart next action</h2>
            </div>
            <p className="text-xs text-[#1A1A1A]/70 leading-relaxed">
              Your AI sales assistant suggests the highest-priority follow-up
              based on lead freshness, last contact, and pipeline stage.
            </p>
            <Link
              to="/broker/ai"
              className="mt-4 inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#102540] text-white text-xs font-medium hover:bg-[#1a3d63] transition-colors"
              data-allow-dark-cta
            >
              <Sparkles className="h-3.5 w-3.5" /> Open AI assistant
            </Link>
          </PremiumCard>

          <PremiumCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1A1A1A]/70" />
                <h2 className="text-sm font-semibold text-[#1A1A1A]">Today</h2>
              </div>
              <Link to="/broker/calendar" className="text-xs text-[#1A1A1A]/65 hover:text-[#1A1A1A]">
                Calendar
              </Link>
            </div>
            {cal.isLoading ? (
              <div className="space-y-2">
                <div className="h-10 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
                <div className="h-10 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
              </div>
            ) : meetingsToday === 0 ? (
              <div className="rounded-lg border border-dashed border-[#B89555]/40 bg-[#FDFBF7] px-4 py-5 text-center">
                <Calendar className="h-5 w-5 text-[#1A1A1A]/55 mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1A1A1A]">No meetings today</p>
                <p className="text-[11px] text-[#1A1A1A]/65 mt-1">
                  Your calendar is clear. New bookings will appear here automatically.
                </p>
                <Link
                  to="/broker/calendar"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#1A1A1A] hover:text-[#B89555]"
                >
                  Open calendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {(cal.data ?? []).filter((e) => isToday(e.starts_at)).slice(0, 4).map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-xs rounded-md bg-[#FDFBF7] border border-[#B89555]/20 px-3 py-2">
                    <span className="truncate text-[#1A1A1A] font-medium">{e.title}</span>
                    <span className="text-[#1A1A1A]/65 tabular-nums ml-3">
                      {new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PremiumCard>

        </div>
      </div>

      {/* My Databases */}
      <PremiumCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#1A1A1A]/70" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">My databases</h2>
          </div>
          <Link to="/broker/databases" className="text-xs text-[#1A1A1A]/65 hover:text-[#1A1A1A] inline-flex items-center gap-1">
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {dbs.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#EFE6D6]/60 animate-pulse" />
            ))}
          </div>
        ) : (dbs.data?.length ?? 0) === 0 ? (
          <BrokerEmptyState
            icon={<Database className="h-4 w-4" />}
            title="No databases shared with you yet"
            description="When your manager grants you access to a CRM database, it will appear here with the assigned date and permission level."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dbs.data!.slice(0, 6).map((d: any) => (
              <Link
                key={d.grant_id}
                to={`/broker/crm/database/${d.database_id}`}
                className="block p-4 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1A1A1A] truncate">{d.database_name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60 mt-1">
                      {d.permission_level === "edit" ? "Edit access" : "View access"} · granted{" "}
                      {formatDisplayDate(d.granted_at)}
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/55 shrink-0">
                    {d.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* My leads preview */}
      <PremiumCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#1A1A1A]/70" />
            <h2 className="text-sm font-semibold text-[#1A1A1A]">Recent leads</h2>
          </div>
          <Link to="/broker/crm" className="text-xs text-[#1A1A1A]/65 hover:text-[#1A1A1A] inline-flex items-center gap-1">
            Open full CRM <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {leads.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
            ))}
          </div>
        ) : (leads.data?.length ?? 0) === 0 ? (
          <BrokerEmptyState
            icon={<Users className="h-4 w-4" />}
            title="No leads in your scope yet"
            description="Leads assigned to you, or leads inside databases shared with you, will show up here."
          />
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/55 border-b border-[#B89555]/20">
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {leadsData.slice(0, 5).map((l: any) => (
                  <tr key={l.id} className="border-b border-[#B89555]/10 last:border-0">
                    <td className="py-2.5 pr-3 text-[#1A1A1A] truncate max-w-[18ch]">
                      {l.full_name || "Unnamed"}
                    </td>
                    <td className="py-2.5 pr-3 text-[#1A1A1A]/75">{l.status || "—"}</td>
                    <td className="py-2.5 pr-3 text-[#1A1A1A]/75">{l.source || "—"}</td>
                    <td className="py-2.5 pr-3 text-[#1A1A1A]/55 tabular-nums">
                      {formatDisplayDate(l.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PremiumCard>

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
    </div>
  );
}
