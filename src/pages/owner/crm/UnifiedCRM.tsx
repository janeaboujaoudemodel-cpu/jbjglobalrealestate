/**
 * UnifiedCRM — single owner-only CRM hub.
 *
 * Premium two-tier navigation:
 *   Title row     : "JBJ CRM" + collapsible Insights drawer (default closed)
 *   Entity bar    : Leads · Investors · Developers · Sales Reps · Brokers · Agencies · Employees
 *   Context bar   : per-entity views (e.g. Leads → Overview/All/Flagged/VIP/Mgmt/...)
 *
 * URL state: ?entity=<...>&view=<...>
 * Legacy params (?section, ?sub) are migrated on mount.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Crown, Building2, UserCog, Network, Briefcase, BadgeCheck,
  ChevronDown, BarChart3, Bell,
} from "lucide-react";

// --- Lazy section content -------------------------------------------------
const CRMLeadsTableV2     = lazy(() => import("@/components/crm/CRMLeadsTableV2"));
const FlaggedLeadsView    = lazy(() => import("@/components/crm/FlaggedLeadsView"));
const RecentlyDeletedLeads= lazy(() => import("@/components/crm/RecentlyDeletedLeads"));
const CRMRelationships    = lazy(() => import("@/pages/CRMRelationships"));
const BrokersRegistryPage = lazy(() => import("@/pages/owner/crm/BrokersRegistry"));
const DevelopersDirectory       = lazy(() => import("@/components/crm/entity/DevelopersDirectory"));
const BrokerageAgenciesDirectory= lazy(() => import("@/components/crm/entity/BrokerageAgenciesDirectory"));
const DevSalesRepsDirectory     = lazy(() => import("@/components/crm/entity/DevSalesRepsDirectory"));
const EmployeesHub        = lazy(() => import("@/components/crm/EmployeesHub"));
const CampaignsPage       = lazy(() => import("@/pages/owner/crm/CampaignsPage"));
const CRMTasks            = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar         = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes            = lazy(() => import("@/pages/CRMNotes"));
const OwnerInbox          = lazy(() => import("@/pages/OwnerInbox"));
const ContractVault       = lazy(() => import("@/pages/owner/contracts/ContractVault"));
const AutomationRules     = lazy(() => import("@/components/crm/AutomationRules"));
const CRMEnhancedDashboard= lazy(() => import("@/components/crm/CRMEnhancedDashboard"));
const InvestorsDirectory  = lazy(() => import("@/components/crm/InvestorsDirectory"));
const BrokersImported     = lazy(() => import("@/components/crm/BrokersImported"));

type Entity =
  | "leads" | "investors" | "developers" | "sales-reps"
  | "brokers" | "agencies" | "employees";

const ENTITIES: { id: Entity; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "leads",       label: "Leads",              icon: Users },
  { id: "investors",   label: "Investors",          icon: Crown },
  { id: "developers",  label: "Developers",         icon: Building2 },
  { id: "sales-reps",  label: "Dev Sales Reps",     icon: BadgeCheck },
  { id: "brokers",     label: "Brokers",            icon: UserCog },
  { id: "agencies",    label: "Brokerage Agencies", icon: Network },
  { id: "employees",   label: "Employees",          icon: Briefcase },
];

type ViewItem = { id: string; label: string; group?: string };

const VIEWS: Record<Entity, ViewItem[]> = {
  leads: [
    { id: "all",           label: "All Leads",     group: "People" },
    { id: "overview",      label: "Overview",      group: "People" },
    { id: "flagged",       label: "Flagged",       group: "People" },
    { id: "vip",           label: "VIP",           group: "People" },
    { id: "management",    label: "Lead Mgmt",     group: "People" },
    { id: "tasks",         label: "Tasks",         group: "Workspace" },
    { id: "calendar",      label: "Calendar",      group: "Workspace" },
    { id: "notes",         label: "Notes",         group: "Workspace" },
    { id: "inbox",         label: "Inbox",         group: "Workspace" },
    { id: "notifications", label: "Notifications", group: "Workspace" },
    { id: "contracts",     label: "Contracts",     group: "Pipeline" },
    { id: "campaigns",     label: "Campaigns",     group: "Pipeline" },
    { id: "automation",    label: "Automation",    group: "Pipeline" },
  ],
  investors:  [{ id: "directory", label: "Directory" }, { id: "vip", label: "VIP" }],
  developers: [{ id: "registry",  label: "Registry"  }],
  "sales-reps": [{ id: "directory", label: "Directory" }],
  brokers:    [{ id: "directory", label: "Directory" }, { id: "imported", label: "Imported" }],
  agencies:   [{ id: "directory", label: "Directory" }],
  employees:  [{ id: "roster",    label: "Roster" }],
};

// Migrate legacy ?section=&sub= → ?entity=&view=
function migrateLegacy(p: URLSearchParams): { entity: Entity; view: string } | null {
  const section = p.get("section");
  const sub = p.get("sub");
  if (!section) return null;
  if (section === "leads")            return { entity: "leads", view: "all" };
  if (section === "flagged")          return { entity: "leads", view: "flagged" };
  if (section === "vip")              return { entity: "leads", view: "vip" };
  if (section === "management")       return { entity: "leads", view: "management" };
  if (section === "overview")         return { entity: "leads", view: "overview" };
  if (section === "tasks")            return { entity: "leads", view: "tasks" };
  if (section === "calendar")         return { entity: "leads", view: "calendar" };
  if (section === "notes")            return { entity: "leads", view: "notes" };
  if (section === "inbox")            return { entity: "leads", view: "inbox" };
  if (section === "notifications")    return { entity: "leads", view: "notifications" };
  if (section === "contracts")        return { entity: "leads", view: "contracts" };
  if (section === "campaigns")        return { entity: "leads", view: "campaigns" };
  if (section === "automation")       return { entity: "leads", view: "automation" };
  if (section === "employees")        return { entity: "employees", view: "roster" };
  if (section === "relationships") {
    if (sub === "developers")  return { entity: "developers",  view: "registry" };
    if (sub === "agencies")    return { entity: "agencies",    view: "directory" };
    if (sub === "sales-reps")  return { entity: "sales-reps",  view: "directory" };
    if (sub === "brokers")     return { entity: "brokers",     view: "directory" };
    return { entity: "investors", view: "directory" };
  }
  return null;
}

const Fallback = () => (
  <div className="space-y-3 p-6">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const Embed = ({ children }: { children: React.ReactNode }) => (
  <div className="crm-embed">{children}</div>
);

function NotificationsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("crm_activities")
          .select("id, activity_type, description, created_at, lead_id")
          .order("created_at", { ascending: false })
          .limit(60);
        setItems(data || []);
      } finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <Fallback />;
  if (items.length === 0) {
    return <div className="p-8 text-center text-[#1A1A1A]/60">No recent notifications.</div>;
  }
  return (
    <div className="divide-y divide-[#B89555]/15 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7]">
      {items.map((a) => (
        <div key={a.id} className="px-4 py-3 flex items-start gap-3">
          <Bell className="h-4 w-4 mt-0.5 text-[#1A1A1A]/60" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[#1A1A1A] truncate">
              {a.description || a.activity_type?.replace(/_/g, " ")}
            </div>
            <div className="text-[11px] text-[#1A1A1A]/60">
              {new Date(a.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UnifiedCRM() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const ownerEmail = (user?.email || "").toLowerCase();
  const [params, setParams] = useSearchParams();

  // Legacy migration on mount
  useEffect(() => {
    if (params.get("entity")) return;
    const migrated = migrateLegacy(params);
    if (migrated) {
      const next = new URLSearchParams();
      next.set("entity", migrated.entity);
      next.set("view", migrated.view);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entity: Entity = (params.get("entity") as Entity) || "leads";
  const validViews = VIEWS[entity] || [];
  const defaultView = validViews[0]?.id || "overview";
  const viewParam = params.get("view") || defaultView;
  const view = validViews.find(v => v.id === viewParam)?.id || defaultView;

  const setEntity = (id: Entity) => {
    const next = new URLSearchParams(params);
    next.set("entity", id);
    next.set("view", VIEWS[id][0]?.id || "overview");
    setParams(next, { replace: true });
  };
  const setView = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("entity", entity);
    next.set("view", id);
    setParams(next, { replace: true });
  };

  // Insights drawer (collapsed by default, persisted)
  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("jbj.crm.insights.open") === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("jbj.crm.insights.open", insightsOpen ? "1" : "0"); }
    catch { /* noop */ }
  }, [insightsOpen]);

  const Body = useMemo(() => {
    if (entity === "leads") {
      switch (view) {
        case "overview":      return <CRMEnhancedDashboard userId={userId} hasOwnerAccess />;
        case "all":           return <CRMLeadsTableV2 userId={userId} filterType="all" onRefresh={() => {}} isOwner />;
        case "flagged":       return <FlaggedLeadsView userId={userId} onRefresh={() => {}} />;
        case "vip":           return <CRMLeadsTableV2 userId={userId} filterType="vip" onRefresh={() => {}} isOwner />;
        case "management":    return <RecentlyDeletedLeads userId={userId} onRefresh={() => {}} isOwner />;
        case "tasks":         return <Embed><CRMTasks /></Embed>;
        case "calendar":      return <Embed><CRMCalendar /></Embed>;
        case "notes":         return <Embed><CRMNotes /></Embed>;
        case "inbox":         return <Embed><OwnerInbox /></Embed>;
        case "notifications": return <NotificationsPanel />;
        case "contracts":     return <Embed><ContractVault /></Embed>;
        case "campaigns":     return <Embed><CampaignsPage /></Embed>;
        case "automation":    return <AutomationRules userId={userId} isOwner />;
      }
    }
    if (entity === "investors") {
      return <InvestorsDirectory ownerEmail={ownerEmail} vipOnly={view === "vip"} />;
    }
    if (entity === "developers") {
      return <DevelopersDirectory />;
    }
    if (entity === "sales-reps") {
      return <DevSalesRepsDirectory />;
    }
    if (entity === "brokers") {
      if (view === "imported") return <BrokersImported />;
      return <Embed><BrokersRegistryPage /></Embed>;
    }
    if (entity === "agencies") {
      return <BrokerageAgenciesDirectory />;
    }
    if (entity === "employees") {
      return <EmployeesHub userId={userId} />;
    }
    return <Embed><CRMRelationships /></Embed>;
  }, [entity, view, userId, ownerEmail]);

  const currentViews = VIEWS[entity] || [];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Title row + Insights toggle */}
      <div className="bg-[#FDFBF7] border-b border-[#B89555]/30">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">JBJ CRM</h1>
            <p className="text-xs text-[#1A1A1A]/70">
              Unified relationship hub — leads, partners, employees, campaigns, calendar, contracts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInsightsOpen(o => !o)}
            aria-expanded={insightsOpen}
            className={[
              "shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              insightsOpen
                ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                : "bg-transparent text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6]/60",
            ].join(" ")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Insights
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${insightsOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Insights drawer (above entity bar) */}
        {insightsOpen && (
          <div className="px-3 md:px-6 pb-4 border-t border-[#B89555]/15 bg-[#F7F2EA]/60">
            <div className="pt-4">
              <Suspense fallback={<Fallback />}>
                <CRMEnhancedDashboard userId={userId} hasOwnerAccess />
              </Suspense>
            </div>
          </div>
        )}

        {/* Entity bar (primary) */}
        <nav
          role="tablist"
          aria-label="CRM entities"
          className="px-2 flex gap-1 border-t border-[#B89555]/15 overflow-x-auto whitespace-nowrap jj-scrollbar-gold"
        >
          {ENTITIES.map((it) => {
            const active = it.id === entity;
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                role="tab"
                aria-selected={active}
                onClick={() => setEntity(it.id)}
                className={[
                  "shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium",
                  "border-b-2 -mb-px transition-colors",
                  active
                    ? "border-[#B89555] text-[#1A1A1A] bg-[#EFE6D6]/60"
                    : "border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#F7F2EA]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </button>
            );
          })}
        </nav>

        {/* Context bar (secondary) */}
        {currentViews.length > 1 && (
          <nav
            role="tablist"
            aria-label="CRM views"
            className="px-4 py-2 flex flex-wrap gap-2 border-t border-[#B89555]/15 bg-[#F7F2EA]"
          >
            {currentViews.map((t) => {
              const active = t.id === view;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(t.id)}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    active
                      ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                      : "bg-transparent text-[#1A1A1A]/70 border-[#B89555]/30 hover:bg-[#EFE6D6]/60 hover:text-[#1A1A1A]",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Body — boxed champagne panel */}
      <div className="px-3 md:px-6 py-5">
        <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] shadow-sm overflow-hidden">
          <div className="p-3 md:p-5 overflow-x-auto">
            <Suspense fallback={<Fallback />}>{Body}</Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
