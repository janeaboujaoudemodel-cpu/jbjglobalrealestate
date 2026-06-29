import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Database, Calendar, ListTodo, Handshake, BadgeDollarSign,
  ArrowRight, Plus, Phone, Brain, Sparkles, Activity, ChevronRight, Briefcase,
  ChevronDown, User as UserIcon, Settings as SettingsIcon, LogOut,
} from "lucide-react";
import ConciergeGreeting from "@/components/broker-portal/ConciergeGreeting";
import NextBestActionCard from "@/components/broker-portal/NextBestActionCard";
import { IconTile, type IconTileTone } from "@/components/ui/icon-tile";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

/** Build two-letter initials: first letter of first word + first letter of last word. */
function getInitials(name?: string | null, email?: string | null): string {
  const src = (name || "").trim() || (email || "").split("@")[0] || "";
  if (!src) return "JB";
  const parts = src.replace(/[._-]+/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "JB";
  if (parts.length === 1) {
    return (parts[0].slice(0, 2) || "JB").toUpperCase();
  }
  return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

/* ─────────────────────────────────────────────────────────────────────────
   PremiumCard — luxury surface used for every section block on the broker
   homepage. Layered champagne gradient + gold hairline + soft inner light.
   ───────────────────────────────────────────────────────────────────────── */
function PremiumCard({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[1.25rem] border border-[#B89555]/35 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-18px_rgba(10,10,10,0.25)] overflow-hidden ${padded ? "p-5 md:p-7" : ""} ${className}`}
    >
      {/* Top gold hairline + inner radial glow */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,85,0.08),transparent_60%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ─── Section eyebrow (icon + small label + accent rule) ─────────────── */
function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  action,
}: {
  icon: any;
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div data-section-header="" className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        <div
          data-section-label=""
          className="jj-section-eyebrow inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/45 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EFE6D6] border border-[#B89555]/45">
            <Icon className="h-3 w-3 text-[#1A1A1A]" strokeWidth={2.2} />
          </span>
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#1A1A1A]">
            {eyebrow}
          </span>
        </div>
        <h2 className="mt-2.5 font-display text-lg md:text-xl font-semibold text-[#1A1A1A] tracking-tight leading-tight">
          {title}
        </h2>
        <div className="mt-2 flex items-center gap-2" aria-hidden="true">
          <span className="block h-px w-8 bg-gradient-to-r from-[color:var(--emerald-1)]/60 to-transparent" />
          <span className="block w-1 h-1 rotate-45 bg-[color:var(--emerald-1)]/70" />
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── KPI tile — editorial column with semantic icon tone ────────────── */
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
    <div className="group relative h-full rounded-[1.1rem] border border-[#B89555]/30 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] px-4 py-5 hover:border-[#B89555]/65 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(10,10,10,0.35)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] transition-all duration-300 overflow-hidden">
      {/* gold hairline along top */}
      <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />
      <div className="flex items-center justify-between">
        <IconTile icon={Icon} tone={tone} size="md" />
        {to && (
          <ArrowRight className="h-4 w-4 text-[#1A1A1A]/35 group-hover:text-[#1A1A1A] group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
      <div className="mt-5 text-[2rem] md:text-[2.4rem] font-display font-semibold tabular-nums tracking-tight text-[#1A1A1A] leading-none">
        {loading && (value === undefined || value === null || value === "") ? (
          <span className="inline-block h-8 w-12 bg-[#EFE6D6] rounded animate-pulse" />
        ) : (
          value
        )}
      </div>

      <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/65 mt-2.5 font-semibold">
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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

  const fullName =
    profile?.display_name?.trim() ||
    [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = fullName.split(" ")[0];
  const initials = getInitials(fullName, user?.email);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };


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
    <div className="space-y-7 md:space-y-9">
      {/* ════════════════════════════════════════════════════════════════
          WELCOME — editorial hero strip with navy backing frame
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* navy backing frame */}
        <div
          aria-hidden="true"
          data-allow-dark-cta
          className="pointer-events-none absolute inset-x-0 inset-y-2 rounded-[1.6rem] bg-[#0A0A0A] border border-[#B89555]/55 shadow-[0_22px_60px_-30px_rgba(10,10,10,0.55)]"
        />
        <div className="relative m-1 rounded-[1.4rem] border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-6 md:p-9 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] overflow-hidden">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent" />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,85,0.12),transparent_60%)]" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-8 justify-between">
            {/* Identity block — wrapped in account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open account menu"
                  className="group flex items-center gap-4 md:gap-5 min-w-0 text-left rounded-2xl -m-1 p-1 transition-colors hover:bg-[#FDFBF7]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/60"
                >
                  <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[#FDFBF7] border border-[#B89555]/55 grid place-items-center overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_22px_-12px_rgba(184,149,85,0.5)] shrink-0">
                    {profile?.photo_url ? (
                      <img src={profile.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-xl md:text-2xl font-semibold tracking-[0.04em] text-[#1A1A1A] tabular-nums">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {/* eyebrow plaque */}
                    <div
                      data-section-label=""
                      className="jj-section-eyebrow inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#FDFBF7] border border-[#B89555]/45 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
                    >
                      <span className="relative inline-flex items-center justify-center w-3.5 h-3.5">
                        <span className="absolute inset-0 rotate-45 rounded-[3px] border border-[color:var(--emerald-1)]/70" aria-hidden="true" />
                        <span className="w-0.5 h-0.5 rounded-full bg-[color:var(--emerald-1)]" aria-hidden="true" />
                      </span>
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-[#1A1A1A]">
                        Broker Workspace
                      </span>
                    </div>
                    <h1 className="font-display text-[28px] md:text-[40px] lg:text-[44px] font-semibold text-[#1A1A1A] truncate leading-[1.04] tracking-[-0.02em] mt-2.5 flex items-center gap-2">
                      <span className="truncate">Welcome, {profileLoading ? "…" : firstName}</span>
                      <ChevronDown className="h-5 w-5 md:h-6 md:w-6 text-[#1A1A1A]/45 group-hover:text-[#1A1A1A] transition-transform group-data-[state=open]:rotate-180 shrink-0" strokeWidth={2.2} />
                    </h1>
                    <div className="mt-2 flex items-center gap-3" aria-hidden="true">
                      <span className="block h-px w-10 bg-gradient-to-r from-[#B89555]/80 to-transparent" />
                      <span className="block w-1 h-1 rotate-45 bg-[#B89555]/70" />
                      <span className="block h-px w-3 bg-[#B89555]/40" />
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {profile?.title && (
                        <span className="text-[12.5px] text-[#1A1A1A]/75 font-medium">{profile.title}</span>
                      )}
                      {profile?.current_tier && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-md bg-[#FDFBF7] border border-[#B89555]/45 text-[#1A1A1A] font-semibold shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
                          {profile.current_tier}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]">
                <DropdownMenuLabel className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFE6D6] border border-[#B89555]/45 font-display text-sm font-semibold text-[#1A1A1A] tabular-nums">
                    {initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold truncate">{fullName}</span>
                    {user?.email && (
                      <span className="block text-[11px] text-[#1A1A1A]/65 truncate">{user.email}</span>
                    )}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#B89555]/25" />
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#EFE6D6] focus:text-[#1A1A1A]">
                  <Link to="/broker/account"><UserIcon className="mr-2 h-4 w-4 text-[#1A1A1A]" /> My account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-[#EFE6D6] focus:text-[#1A1A1A]">
                  <Link to="/broker/settings"><SettingsIcon className="mr-2 h-4 w-4 text-[#1A1A1A]" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#B89555]/25" />
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); handleSignOut(); }}
                  className="cursor-pointer text-red-700 focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


            {/* Primary actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/broker/leads"
                data-surface="emerald"
                data-emerald-ok="button"
                className="jj-surface-emerald inline-flex items-center gap-2 h-11 pl-5 pr-3 rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300"
              >
                <span>Add lead</span>
                <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setCallDialogOpen(true)}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[#FDFBF7] border border-[#B89555]/45 text-[#1A1A1A] text-sm font-semibold hover:bg-[#EFE6D6] hover:border-[#B89555]/75 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
              >
                <Phone className="h-4 w-4 text-[#1A1A1A]" strokeWidth={2.2} /> Log a call
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          KPI ROW
          ════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-4 flex items-center gap-2 pl-1">
          <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-[#1A1A1A]/70">
            Today's Pulse
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-[#B89555]/40 via-[#B89555]/15 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <Kpi icon={Users}           tone="emerald" label="Total leads"          value={totalLeads}     to="/broker/leads"        loading={leads.isLoading} />
          <Kpi icon={Handshake}       tone="emerald" label="Active deals"         value={activeDeals}    to="/broker/deals"        loading={leads.isLoading} />
          <Kpi icon={Calendar}        tone="emerald" label="Meetings today"       value={meetingsToday}  to="/broker/calendar"     loading={cal.isLoading} />
          <Kpi icon={Sparkles}        tone="emerald" label="New assignments"      value={newAssignments} to="/broker/leads"        loading={leads.isLoading} />
          <Kpi icon={BadgeDollarSign} tone="emerald" label="Commission pipeline"  value="—"              to="/broker/deals"        />
          <Kpi icon={ListTodo}        tone="emerald" label="Pending follow-ups"   value={followUps}      to="/broker/tasks"        loading={tasks.isLoading} />

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ACTIVITY + SMART ACTIONS
          ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <PremiumCard className="lg:col-span-3">
          <SectionHeader
            icon={Activity}
            eyebrow="Live Activity"
            title="What's moving in your pipeline"
            action={
              <Link
                to="/broker/notifications"
                className="text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1 transition-colors"
              >
                All updates <ChevronRight className="h-3 w-3" />
              </Link>
            }
          />
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
                <li key={l.id} className="py-3 flex items-center gap-3 group/row">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-b from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/40 grid place-items-center text-[11px] font-semibold text-[#1A1A1A] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
                    {(l.full_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                      {l.full_name || "Unnamed lead"}
                      <span className="text-[#1A1A1A]/55 font-normal"> · {l.pipeline_stage || "new"}</span>
                    </div>
                    <div className="text-[11.5px] text-[#1A1A1A]/60 truncate">
                      Updated {formatDisplayDate(l.updated_at)}
                      {l.source ? ` · source: ${l.source}` : ""}
                    </div>
                  </div>
                  <Link
                    to="/broker/crm"
                    className="text-[11px] font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-[#FDFBF7] transition-colors"
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
            <SectionHeader icon={Brain} eyebrow="JBJ Intelligence" title="Smart next action" />
            <p className="text-[13px] text-[#1A1A1A]/75 leading-[1.7]">
              Your assistant suggests the highest-priority follow-up
              based on lead freshness, last contact, and pipeline stage.
            </p>
            <Link
              to="/broker/ai"
              data-surface="emerald"
              data-emerald-ok="button"
              className="jj-surface-emerald mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all duration-300"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span>Open assistant</span>
            </Link>
          </PremiumCard>

          <PremiumCard>
            <SectionHeader
              icon={Calendar}
              eyebrow="Schedule"
              title="Today's meetings"
              action={
                <Link
                  to="/broker/calendar"
                  className="text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1 transition-colors"
                >
                  Calendar <ChevronRight className="h-3 w-3" />
                </Link>
              }
            />
            {cal.isLoading ? (
              <div className="space-y-2">
                <div className="h-10 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
                <div className="h-10 rounded-lg bg-[#EFE6D6]/60 animate-pulse" />
              </div>
            ) : meetingsToday === 0 ? (
              <div className="rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] px-4 py-6 text-center shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]">
                <div className="mx-auto w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/45 grid place-items-center mb-3">
                  <Calendar className="h-4 w-4 text-[#1A1A1A]" strokeWidth={2} />
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A]">No meetings today</p>
                <p className="text-[11.5px] text-[#1A1A1A]/65 mt-1 leading-relaxed">
                  Your calendar is clear. New bookings will appear here automatically.
                </p>
                <Link
                  to="/broker/calendar"
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1A1A1A] hover:text-[#1A1A1A] underline decoration-[#B89555]/60 underline-offset-4 hover:decoration-[#B89555] transition-colors"
                >
                  Open calendar <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {(cal.data ?? []).filter((e) => isToday(e.starts_at)).slice(0, 4).map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between text-xs rounded-lg bg-[#FDFBF7] border border-[#B89555]/30 px-3.5 py-2.5 hover:border-[#B89555]/55 transition-colors shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
                  >
                    <span className="truncate text-[#1A1A1A] font-semibold">{e.title}</span>
                    <span className="text-[#1A1A1A]/70 tabular-nums ml-3 text-[11.5px] font-medium">
                      {new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PremiumCard>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MY DATABASES
          ════════════════════════════════════════════════════════════════ */}
      <PremiumCard>
        <SectionHeader
          icon={Database}
          eyebrow="Data Access"
          title="My databases"
          action={
            <Link
              to="/broker/databases"
              className="text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
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
                className="group relative block p-4 rounded-xl bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/30 hover:border-[#B89555]/65 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(10,10,10,0.3)] transition-all duration-300 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">{d.database_name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/65 mt-1.5">
                      {d.permission_level === "edit" ? "Edit access" : "View access"} · granted{" "}
                      {formatDisplayDate(d.granted_at)}
                    </div>
                  </div>
                  <span className="text-[9.5px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70 shrink-0 px-2 py-0.5 rounded-md bg-[#FDFBF7] border border-[#B89555]/35">
                    {d.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PremiumCard>

      {/* ════════════════════════════════════════════════════════════════
          RECENT LEADS
          ════════════════════════════════════════════════════════════════ */}
      <PremiumCard>
        <SectionHeader
          icon={Briefcase}
          eyebrow="Pipeline"
          title="Recent leads"
          action={
            <Link
              to="/broker/crm"
              className="text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1 transition-colors"
            >
              Open full CRM <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
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
          <div className="overflow-x-auto -mx-2 px-2 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7]/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-[0.2em] text-[#1A1A1A]/65 font-semibold border-b border-[#B89555]/25">
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {leadsData.slice(0, 5).map((l: any) => (
                  <tr
                    key={l.id}
                    className="border-b border-[#B89555]/12 last:border-0 hover:bg-[#F7F2EA]/60 transition-colors"
                  >
                    <td className="py-3 px-3 text-[#1A1A1A] font-medium truncate max-w-[18ch]">
                      {l.full_name || "Unnamed"}
                    </td>
                    <td className="py-3 px-3 text-[#1A1A1A]/80">{l.status || "—"}</td>
                    <td className="py-3 px-3 text-[#1A1A1A]/80">{l.source || "—"}</td>
                    <td className="py-3 px-3 text-[#1A1A1A]/60 tabular-nums">
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
