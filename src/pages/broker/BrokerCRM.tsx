import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import RequestDatabaseDialog from "@/components/broker-portal/RequestDatabaseDialog";

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

export default function BrokerCRM() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [search, setSearch] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();
  const tasks = useBrokerPersonalTasks();

  const leadsData: any[] = (leads.data as any[]) ?? [];
  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leadsData;
    const q = search.toLowerCase();
    return leadsData.filter((l: any) =>
      (l.full_name || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.pipeline_stage || "").toLowerCase().includes(q),
    );
  }, [leadsData, search]);

  const totalLeads = leadsData.length;
  const callsLogged = (tasks.data ?? []).filter((t: any) => (t.type || "").toLowerCase().includes("call")).length;
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
              onClick={() => {
                toast.success("Call logged — open a lead to capture full notes.");
              }}
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
              <Button
                onClick={() => setRequestOpen(true)}
                className="mt-4 bg-[#102540] text-white hover:bg-[#1a3d63]"
                data-allow-dark-cta
              >
                <Upload className="w-4 h-4 mr-1.5" /> Request a database
              </Button>
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
              <Empty msg={search ? "No leads match your search." : "No leads visible to you yet."} />
            ) : (
              <div className="divide-y divide-[#B89555]/15">
                {filteredLeads.map((l: any) => (
                  <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/25 grid place-items-center text-[10px] font-semibold text-[#1A1A1A]">
                      {(l.full_name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1A1A1A] truncate">{l.full_name || "Unnamed lead"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/65 truncate">
                        {l.pipeline_stage || "new"} · {l.source || l.lead_source_type || "—"}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/60 tabular-nums">{formatDisplayDate(l.updated_at)}</div>
                  </div>
                ))}
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
              onClick={() => toast.success("Open a lead to log a detailed call.")}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" /> Log a call
            </Button>
          </div>
          {(tasks.data ?? []).filter((t: any) => (t.type || "").toLowerCase().includes("call")).length === 0 ? (
            <Empty msg="No calls logged yet. Calls captured on a lead will surface here." />
          ) : (
            <ul className="divide-y divide-[#B89555]/15">
              {(tasks.data ?? [])
                .filter((t: any) => (t.type || "").toLowerCase().includes("call"))
                .slice(0, 20)
                .map((t: any) => (
                  <li key={t.id} className="py-2.5 flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#1A1A1A]/60" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1A1A1A] truncate">{t.title || "Call"}</div>
                      <div className="text-[11px] text-[#1A1A1A]/55 truncate">{t.status} · {formatDisplayDate(t.updated_at || t.created_at)}</div>
                    </div>
                  </li>
                ))}
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
