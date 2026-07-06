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
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCRMSectionCounts, type CRMCounts } from "@/hooks/useCRMSectionCounts";
import { useCRMLiveSync } from "@/hooks/useCRMLiveSync";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useCallback } from "react";
import {
  Users, Crown, Building2, UserCog, Network, Briefcase, BadgeCheck,
  ChevronDown, BarChart3, Bell, ChevronLeft, ChevronRight, Database, Plus, UserPlus,
  GraduationCap,
} from "lucide-react";
import { AddBrokerSheet } from "@/pages/owner/crm/BrokersRegistry";
import CRMLeadModal from "@/components/crm/CRMLeadModal";
import { useQueryClient } from "@tanstack/react-query";

/**
 * ScrollStrip — horizontal scroller with left/right arrow controls.
 * Arrows fade in/out based on scroll position. Champagne-themed.
 */
function ScrollStrip({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.6), behavior: "auto" });
  };

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden border-t border-[#B89555]/15">
      {canL && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          data-surface="emerald"
          data-emerald-ok="button"
          className="jj-surface-emerald absolute left-1 top-1 bottom-1 z-10 w-9 rounded-xl flex items-center justify-center shadow-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canR && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          data-surface="emerald"
          data-emerald-ok="button"
          className="jj-surface-emerald absolute right-1 top-1 bottom-1 z-10 w-9 rounded-xl flex items-center justify-center shadow-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      <nav
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        data-crm-tabs-lock="true"
        className="px-3 py-2 pr-12 flex gap-2 overflow-x-auto whitespace-nowrap jj-scrollbar-gold max-w-full min-w-0"
      >
        {children}
      </nav>
    </div>
  );
}

// --- Lazy section content -------------------------------------------------
const CRMLeadsTableV2     = lazy(() => import("@/components/crm/CRMLeadsTableV2"));
const FlaggedLeadsView    = lazy(() => import("@/components/crm/FlaggedLeadsView"));
const RecentlyDeletedLeads= lazy(() => import("@/components/crm/RecentlyDeletedLeads"));
const CRMRelationships    = lazy(() => import("@/pages/CRMRelationships"));
const BrokersRegistryPage = lazy(() => import("@/pages/owner/crm/BrokersRegistry"));
// Developers / Brokerage Agencies / Brokers / Sales Reps all render through
// CRMRelationships so the UI, fields, filters and drawers are identical to
// /owner/crm/relationship-hub. The page reads ?tab= to jump to the right tab.
const DevSalesRepsDirectory     = lazy(() => import("@/components/crm/entity/DevSalesRepsDirectory"));
const EmployeesHub        = lazy(() => import("@/components/crm/EmployeesHub"));
const CampaignsPage       = lazy(() => import("@/pages/owner/crm/CampaignsPage"));
const CRMTasks            = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar         = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes            = lazy(() => import("@/pages/CRMNotes"));
const OwnerInbox          = lazy(() => import("@/pages/OwnerInbox"));
// EmailCenter retired — redirected into Unified Inbox (/owner/inbox).
const ContractVault       = lazy(() => import("@/pages/owner/contracts/ContractVault"));
const AutomationRules     = lazy(() => import("@/components/crm/AutomationRules"));
const CRMEnhancedDashboard= lazy(() => import("@/components/crm/CRMEnhancedDashboard"));
const InvestorsDirectory  = lazy(() => import("@/components/crm/InvestorsDirectory"));
const BrokersImported     = lazy(() => import("@/components/crm/BrokersImported"));
const DatabasesHub        = lazy(() => import("@/components/crm/DatabasesHub"));
const CRMGlobalExportButton = lazy(() => import("@/components/crm/CRMGlobalExportButton"));
const CRMSideRail = lazy(() => import("@/components/crm/CRMSideRail"));
const CRMFloatingInsightsWidget = lazy(() => import("@/components/crm/CRMFloatingInsightsWidget"));
const CRMAINextActions = lazy(() => import("@/components/crm/CRMAINextActions"));
// SharedWithBrokersView removed — replaced by per-lead Access dialog in the leads table.
const JunkReturnsQueue    = lazy(() => import("@/components/owner-crm/JunkReturnsQueue"));
const OwnerAcademyApprovals = lazy(() => import("@/pages/owner/OwnerAcademyApprovals"));

type Entity =
  | "leads" | "investors" | "developers" | "sales-reps"
  | "brokers" | "agencies" | "employees" | "databases" | "academy";

const ENTITIES: { id: Entity; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "leads",       label: "Leads",              icon: Users },
  { id: "databases",   label: "Databases",          icon: Database },
  { id: "investors",   label: "Investors",          icon: Crown },
  { id: "developers",  label: "Developers",         icon: Building2 },
  { id: "sales-reps",  label: "Dev Sales Reps",     icon: BadgeCheck },
  { id: "brokers",     label: "Brokers",            icon: UserCog },
  { id: "agencies",    label: "Brokerage Agencies", icon: Network },
  { id: "employees",   label: "Employees",          icon: Briefcase },
  { id: "academy",     label: "Academy",            icon: GraduationCap },
];

type ViewItem = { id: string; label: string; group?: string };

const VIEWS: Record<Entity, ViewItem[]> = {
  leads: [
    { id: "all",           label: "All Leads",     group: "People" },
    
    { id: "overview",      label: "Dashboard",     group: "People" },
    { id: "flagged",       label: "Flagged",       group: "People" },
    { id: "vip",           label: "VIP",           group: "People" },
    { id: "junk-returns",  label: "Junk Returns",  group: "People" },
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
  databases:  [{ id: "all", label: "All Databases" }],
  investors:  [{ id: "directory", label: "Directory" }, { id: "vip", label: "VIP" }],
  developers: [{ id: "registry",  label: "Registry"  }],
  "sales-reps": [{ id: "directory", label: "Directory" }],
  brokers:    [{ id: "directory", label: "Directory" }, { id: "imported", label: "Imported" }],
  agencies:   [{ id: "directory", label: "Directory" }],
  employees:  [{ id: "roster",    label: "Roster" }],
  academy:    [{ id: "approvals", label: "Certification Approvals" }],
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

class CRMBodyErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(err: Error) { console.error("[CRM body crashed]", err); }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-300 bg-red-50/40 p-6 text-sm text-[#1A1A1A]">
          <div className="font-semibold mb-1">This panel failed to load.</div>
          <div className="text-[#1A1A1A]/70 mb-3">{this.state.error.message}</div>
          <button
            type="button"
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="px-3 py-1.5 rounded-md bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555] text-xs font-semibold"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Phase 3 — live sync from broker edits / audit log
  useCRMLiveSync({ enabled: !!userId });

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

  // Quick-create dialogs
  const qc = useQueryClient();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addBrokerOpen, setAddBrokerOpen] = useState(false);
  const invalidateCRM = () => {
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
    qc.invalidateQueries({ queryKey: ["crm_brokers"] });
    qc.invalidateQueries({ queryKey: ["crm-section-counts"] });
  };

  const Body = useMemo(() => {
    if (entity === "leads") {
      switch (view) {
        case "overview":      return (
          <div className="space-y-4">
            <Suspense fallback={null}><CRMAINextActions userId={userId} /></Suspense>
            <CRMEnhancedDashboard userId={userId} hasOwnerAccess />
          </div>
        );
        case "all":           return <CRMLeadsTableV2 userId={userId} filterType="all" onRefresh={() => {}} isOwner />;
        // "shared" view removed — falls through to "all"
        case "flagged":       return <FlaggedLeadsView userId={userId} onRefresh={() => {}} />;
        case "vip":           return <CRMLeadsTableV2 userId={userId} filterType="vip" onRefresh={() => {}} isOwner />;
        case "junk-returns":  return <Suspense fallback={<Fallback />}><JunkReturnsQueue /></Suspense>;
        case "management":    return <RecentlyDeletedLeads userId={userId} onRefresh={() => {}} isOwner />;
        case "tasks":         return <Embed><CRMTasks /></Embed>;
        case "calendar":      return <Embed><CRMCalendar /></Embed>;
        case "notes":         return <Embed><CRMNotes /></Embed>;
        case "inbox":         return <Embed><OwnerInbox /></Embed>;
        case "email-center":  return <Embed><OwnerInbox /></Embed>;
        case "notifications": return <NotificationsPanel />;
        case "contracts":     return <Embed><ContractVault /></Embed>;
        case "campaigns":     return <Embed><CampaignsPage /></Embed>;
        case "automation":    return <AutomationRules userId={userId} isOwner />;
        default:              return <CRMLeadsTableV2 userId={userId} filterType="all" onRefresh={() => {}} isOwner />;
      }
    }
    if (entity === "investors") {
      return <InvestorsDirectory ownerEmail={ownerEmail} vipOnly={view === "vip"} />;
    }
    if (entity === "databases") {
      return <DatabasesHub />;
    }
    if (entity === "brokers") {
      // Dedicated lightweight Brokers Registry — no full CRMRelationships embed.
      return <BrokersRegistryPage />;
    }
    if (entity === "developers" || entity === "agencies") {
      // Don't embed the full Relationship Hub inside the CRM tab. Send the user
      // to the dedicated Relationship Hub page so it loads its own UI properly
      // and the CRM hub stays fast.
      const hubTab = entity === "developers" ? "developers" : "brokerages";
      return (
        <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-8 text-center space-y-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            {entity === "developers" ? "Developers Registry" : "Brokerage Agencies"}
          </h2>
          <p className="text-sm text-[#1A1A1A]/70 max-w-xl mx-auto">
            The full {entity === "developers" ? "Developers" : "Brokerage Agencies"} workspace lives in
            the Relationship Hub — open it for filters, bulk outreach, exports and the Excel grid.
          </p>
          <a
            href={`/owner/crm/relationship-hub?tab=${hubTab}`}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555] font-semibold hover:bg-[#E7DCC7]"
          >
            Open Relationship Hub →
          </a>
        </div>
      );
    }
    if (entity === "sales-reps") {
      return <DevSalesRepsDirectory />;
    }
    if (entity === "employees") {
      return <EmployeesHub userId={userId} />;
    }
    if (entity === "academy") {
      return <Suspense fallback={<Fallback />}><OwnerAcademyApprovals /></Suspense>;
    }
    return (
      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-8 text-center text-sm text-[#1A1A1A]/70">
        Pick a section from the bar above.
      </div>
    );
  }, [entity, view, userId, ownerEmail]);

  const currentViews = VIEWS[entity] || [];
  const { counts } = useCRMSectionCounts();

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
  const entityCount = (id: Entity): number | null => {
    switch (id) {
      case "leads": return counts.leads;
      case "investors": return counts.investors;
      case "developers": return counts.developers;
      case "sales-reps": return counts.salesReps;
      case "brokers": return counts.brokers;
      case "agencies": return counts.agencies;
      case "employees": return counts.employees;
      default: return null;
    }
  };
  const viewCount = (entity: Entity, viewId: string): number | null => {
    if (entity === "leads") {
      if (viewId === "all") return counts.leads;
      if (viewId === "flagged") return counts.flagged;
      if (viewId === "vip") return counts.vip;
      if (viewId === "management") return counts.leadMgmt;
      if (viewId === "tasks") return counts.tasks;
      if (viewId === "calendar") return counts.calendarUpcoming;
      if (viewId === "notes") return counts.notes;
      if (viewId === "inbox") return counts.inbox;
      if (viewId === "email-center") return counts.emailCenter;
      if (viewId === "notifications") return counts.notifications;
      if (viewId === "campaigns") return counts.campaigns;
      if (viewId === "automation") return counts.automation;
    }
    if (entity === "brokers" && viewId === "directory") return counts.brokers;
    if (entity === "investors" && viewId === "vip") return counts.vip;
    if (entity === "investors" && viewId === "directory") return counts.investors;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] min-w-0 max-w-full overflow-x-hidden" data-backend-portal="owner-crm">
      {/* Title row + Insights toggle */}
      <div className="bg-[#FDFBF7] border-b border-[#B89555]/30 relative min-w-0 overflow-hidden">
        <div className="px-4 md:px-6 pt-5 pb-3 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">JBJ CRM</h1>
            <p className="text-xs text-[#1A1A1A]/70">
              Unified relationship hub — leads, partners, employees, campaigns, calendar, contracts.
            </p>
          </div>
          <div className="flex items-center justify-start xl:justify-end gap-2 flex-wrap min-w-0 max-w-full">
            <button
              type="button"
              onClick={() => setAddLeadOpen(true)}
              data-surface="emerald"
              data-emerald-ok="button"
              className="jj-surface-emerald shrink-0 inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold shadow-[0_10px_24px_-14px_rgba(4,44,28,0.86)] transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lead</span>
            </button>
            <button
              type="button"
              onClick={() => setAddBrokerOpen(true)}
              data-surface="emerald"
              data-emerald-ok="button"
              className="jj-surface-emerald shrink-0 inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold shadow-[0_10px_24px_-14px_rgba(4,44,28,0.86)] transition-transform hover:-translate-y-0.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Broker
            </button>
            <Suspense fallback={null}>
              <CRMFloatingInsightsWidget
                flaggedCount={counts.flagged}
                onOpenFlagged={() => {
                  const next = new URLSearchParams(params);
                  next.set("entity", "leads");
                  next.set("view", "flagged");
                  setParams(next, { replace: true });
                }}
              />
            </Suspense>
            <Suspense fallback={null}>
              <CRMGlobalExportButton />
            </Suspense>
            <button
              type="button"
              onClick={() => setInsightsOpen(o => !o)}
              aria-expanded={insightsOpen}
              data-surface="emerald"
              data-emerald-ok="button"
              className="jj-surface-emerald allow-white shrink-0 inline-flex h-10 min-w-[118px] items-center justify-center gap-2 rounded-xl border-transparent px-3 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 [&_svg]:text-white"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Insights
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${insightsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Insights drawer (above entity bar) */}
        {insightsOpen && (
          <div className="px-3 md:px-6 pb-4 border-t border-[#B89555]/15 bg-[#F7F2EA]/60">
            <div className="pt-4">
              <CRMBodyErrorBoundary><Suspense fallback={<Fallback />}>
                <CRMEnhancedDashboard userId={userId} hasOwnerAccess />
              </Suspense></CRMBodyErrorBoundary>
            </div>
          </div>
        )}

        {/* Entity bar (primary) — horizontal scroller with arrows */}
        <ScrollStrip ariaLabel="CRM entities">
          {ENTITIES.map((it) => {
            const active = it.id === entity;
            const Icon = it.icon;
            const c = entityCount(it.id);
            return (
              <button
                key={it.id}
                role="tab"
                aria-selected={active}
                data-state={active ? "active" : "inactive"}
                onClick={() => setEntity(it.id)}
                className={[
                   "shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl",
                   "border transition-colors",
                  active
                     ? "jj-surface-emerald allow-white border-transparent shadow-[0_10px_24px_-16px_rgba(6,78,59,0.85)]"
                     : "border-[#B89555]/20 bg-[#FDFBF7] text-[#1A1A1A] hover:text-[#064E3B] hover:bg-[#EFE6D6]/65",
                ].join(" ")}
                data-surface={active ? "emerald" : undefined}
                data-emerald-ok={active ? "tab" : undefined}
              >
                <Icon className={active ? "allow-white h-4 w-4 text-white" : "h-4 w-4 text-[#1A1A1A]"} />
                {it.label}
                {c !== null && c > 0 && (
                  <span
                    className={[
                      "ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums",
                      active
                        ? "bg-white/20 text-white border border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "bg-[#EFE6D6] text-[#1A1A1A]/80 border border-[#B89555]/25",
                    ].join(" ")}
                  >
                    {fmt(c)}
                  </span>
                )}
              </button>
            );
          })}
        </ScrollStrip>

      </div>

      {/* Sub-section bar (horizontal, secondary) */}
      {currentViews.length > 1 && (
        <div className="bg-[#F7F2EA] border-b border-[#B89555]/20">
          <nav
            role="tablist"
            aria-label="CRM sub-sections"
            data-crm-tabs-lock="true"
            className="px-3 md:px-6 flex items-center gap-2 py-2.5 overflow-x-auto whitespace-nowrap jj-scrollbar-gold min-w-0 max-w-full"
          >
            {(() => {
              const out: React.ReactNode[] = [];
              let lastGroup: string | undefined;
              currentViews.forEach((t, i) => {
                if (t.group && t.group !== lastGroup && i > 0) {
                  out.push(
                    <span key={`sep-${i}`} aria-hidden className="mx-1 h-4 w-px bg-[#B89555]/30 shrink-0" />
                  );
                }
                lastGroup = t.group;
                const active = t.id === view;
                const c = viewCount(entity, t.id);
                out.push(
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    data-state={active ? "active" : "inactive"}
                    onClick={() => setView(t.id)}
                    className={[
                      "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold transition-colors border max-w-full",
                      active
                        ? "jj-surface-emerald allow-white border-transparent shadow-[0_8px_20px_-16px_rgba(6,78,59,0.80)]"
                        : "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/20 hover:bg-[#EFE6D6]/70 hover:text-[#064E3B]",
                    ].join(" ")}
                    data-surface={active ? "emerald" : undefined}
                    data-emerald-ok={active ? "tab" : undefined}
                  >
                    {t.label}
                    {c !== null && c > 0 && (
                      <span
                        className={[
                           "inline-flex items-center justify-center min-w-[1.125rem] h-[18px] px-1 rounded-md text-[10px] font-semibold tabular-nums",
                          active
                            ? "!bg-white/20 !text-white !border !border-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                            : "bg-[#EFE6D6] text-[#1A1A1A]/80 border border-[#B89555]/25",
                        ].join(" ")}
                      >
                        {fmt(c)}
                      </span>
                    )}
                  </button>
                );
              });
              return out;
            })()}
          </nav>
        </div>
      )}

      {/* Body */}
      <div className="px-3 md:px-6 py-5 min-w-0 overflow-x-hidden">
        <div className="rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7] shadow-sm overflow-hidden min-w-0 max-w-full">
          <div className="p-3 md:p-5 min-w-0 overflow-x-auto jj-scrollbar-gold">
            <CRMBodyErrorBoundary><Suspense fallback={<Fallback />}>{Body}</Suspense></CRMBodyErrorBoundary>
          </div>
        </div>
      </div>

      {/* Side rail — Calendar / Notes / Tasks dock */}
      <Suspense fallback={null}>
        <CRMSideRail />
      </Suspense>

      {/* Quick-create dialogs */}
      {addLeadOpen && (
        <CRMLeadModal
          open={addLeadOpen}
          onClose={() => setAddLeadOpen(false)}
          onSuccess={() => { invalidateCRM(); setAddLeadOpen(false); }}
          userId={userId}
        />
      )}
      <AddBrokerSheet
        open={addBrokerOpen}
        onOpenChange={setAddBrokerOpen}
        onAdded={() => invalidateCRM()}
      />
    </div>
  );
}
