/**
 * UnifiedCRM — single owner-only CRM hub.
 * Single horizontal subheader. Each section renders inside the same shell
 * (no nested page headers, no overlapping sticky bars).
 */
import { lazy, Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Flag, Crown, Briefcase, Network, UserCog,
  Megaphone, ListTodo, Calendar as CalendarIcon,
  StickyNote, Inbox, Bell, FileSignature, Zap, LayoutDashboard,
} from "lucide-react";

// --- Lazy section content -------------------------------------------------
const CRMLeadsTableV2     = lazy(() => import("@/components/crm/CRMLeadsTableV2"));
const FlaggedLeadsView    = lazy(() => import("@/components/crm/FlaggedLeadsView"));
const RecentlyDeletedLeads= lazy(() => import("@/components/crm/RecentlyDeletedLeads"));
const CRMRelationships    = lazy(() => import("@/pages/CRMRelationships"));
const CRMNetworkPage      = lazy(() => import("@/pages/owner/crm/CRMNetwork"));
const BrokersRegistryPage = lazy(() => import("@/pages/owner/crm/BrokersRegistry"));
const EmployeesHub        = lazy(() => import("@/components/crm/EmployeesHub"));
const CampaignsPage       = lazy(() => import("@/pages/owner/crm/CampaignsPage"));
const CRMTasks            = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar         = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes            = lazy(() => import("@/pages/CRMNotes"));
const OwnerInbox          = lazy(() => import("@/pages/OwnerInbox"));
const ContractVault       = lazy(() => import("@/pages/owner/contracts/ContractVault"));
const AutomationRules     = lazy(() => import("@/components/crm/AutomationRules"));
const CRMEnhancedDashboard= lazy(() => import("@/components/crm/CRMEnhancedDashboard"));

type SectionId =
  | "overview" | "leads" | "flagged" | "vip" | "management"
  | "relationships" | "employees" | "campaigns"
  | "tasks" | "calendar" | "notes" | "inbox"
  | "notifications" | "contracts" | "automation";

type RelSubId = "investors" | "developers" | "sales-reps" | "brokers" | "agencies";

interface NavItem { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; }

const PRIMARY: NavItem[] = [
  { id: "overview",      label: "Overview",       icon: LayoutDashboard },
  { id: "leads",         label: "All Leads",      icon: Users },
  { id: "flagged",       label: "Flagged",        icon: Flag },
  { id: "vip",           label: "VIP",            icon: Crown },
  { id: "management",    label: "Lead Mgmt",      icon: Briefcase },
  { id: "relationships", label: "Relationships",  icon: Network },
  { id: "employees",     label: "Employees",      icon: UserCog },
  { id: "campaigns",     label: "Campaigns",      icon: Megaphone },
  { id: "tasks",         label: "Tasks",          icon: ListTodo },
  { id: "calendar",      label: "Calendar",       icon: CalendarIcon },
  { id: "notes",         label: "Notes",          icon: StickyNote },
  { id: "inbox",         label: "Inbox",          icon: Inbox },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "contracts",     label: "Contracts",      icon: FileSignature },
  { id: "automation",    label: "Automation",     icon: Zap },
];

const REL_TABS: { id: RelSubId; label: string }[] = [
  { id: "investors",   label: "Investors" },
  { id: "developers",  label: "Developers" },
  { id: "sales-reps",  label: "Dev Sales Reps" },
  { id: "brokers",     label: "Brokers" },
  { id: "agencies",    label: "Brokerage Agencies" },
];

const Fallback = () => (
  <div className="space-y-3 p-6">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
);

// Strip page-level chrome from re-used legacy pages so we don't get
// double headers / sticky bars / extra top-padding inside the unified shell.
const Embed = ({ children }: { children: React.ReactNode }) => (
  <div className="crm-embed [&_header]:hidden [&_.sticky]:!static [&_.min-h-screen]:!min-h-0 [&_[class*='pt-[88px]']]:!pt-0 [&_[class*='pt-[104px]']]:!pt-0">
    {children}
  </div>
);

function NotificationsPanel({ userId }: { userId: string }) {
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
  }, [userId]);
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
  const [params, setParams] = useSearchParams();
  const section: SectionId = (params.get("section") as SectionId) || "overview";
  const sub: RelSubId      = (params.get("sub") as RelSubId)      || "investors";

  const setSection = (id: SectionId) => {
    const next = new URLSearchParams(params);
    next.set("section", id);
    if (id !== "relationships") next.delete("sub");
    setParams(next, { replace: true });
  };
  const setSub = (id: RelSubId) => {
    const next = new URLSearchParams(params);
    next.set("section", "relationships");
    next.set("sub", id);
    setParams(next, { replace: true });
  };

  const Body = useMemo(() => {
    switch (section) {
      case "overview":
        return <CRMEnhancedDashboard userId={userId} hasOwnerAccess />;
      case "leads":
        return <CRMLeadsTableV2 userId={userId} filterType="all" onRefresh={() => {}} isOwner />;
      case "flagged":
        return <FlaggedLeadsView userId={userId} onRefresh={() => {}} />;
      case "vip":
        return <CRMLeadsTableV2 userId={userId} filterType="vip" onRefresh={() => {}} isOwner />;
      case "management":
        return <RecentlyDeletedLeads userId={userId} onRefresh={() => {}} isOwner />;
      case "employees":
        return <EmployeesHub userId={userId} />;
      case "campaigns":
        return <Embed><CampaignsPage /></Embed>;
      case "tasks":
        return <Embed><CRMTasks /></Embed>;
      case "calendar":
        return <Embed><CRMCalendar /></Embed>;
      case "notes":
        return <Embed><CRMNotes /></Embed>;
      case "inbox":
        return <Embed><OwnerInbox /></Embed>;
      case "notifications":
        return <NotificationsPanel userId={userId} />;
      case "contracts":
        return <Embed><ContractVault /></Embed>;
      case "automation":
        return <AutomationRules userId={userId} isOwner />;
      case "relationships":
      default:
        if (sub === "investors")  return <Embed><CRMRelationships /></Embed>;
        if (sub === "developers") return <Embed><CRMNetworkPage initialRole="developers" /></Embed>;
        if (sub === "agencies")   return <Embed><CRMNetworkPage initialRole="agencies" /></Embed>;
        if (sub === "sales-reps") return <Embed><CRMNetworkPage initialRole="partners" /></Embed>;
        if (sub === "brokers")    return <Embed><BrokersRegistryPage /></Embed>;
        return <Embed><CRMRelationships /></Embed>;
    }
  }, [section, sub, userId]);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* In-page CRM header */}
      <div className="bg-[#FDFBF7] border-b border-[#B89555]/30">
        <div className="px-6 pt-5 pb-3 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">JBJ CRM</h1>
            <p className="text-xs text-[#1A1A1A]/70">
              Unified relationship hub — leads, partners, employees, campaigns, calendar, contracts. Owner-only.
            </p>
          </div>
        </div>

        {/* Primary subheader */}
        <nav
          role="tablist"
          aria-label="CRM sections"
          className="px-2 flex gap-1 border-t border-[#B89555]/15 overflow-x-auto whitespace-nowrap jj-scrollbar-gold"
        >
          {PRIMARY.map((it) => {
            const active = it.id === section;
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSection(it.id)}
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

        {/* Secondary bar (Relationships only) */}
        {section === "relationships" && (
          <nav
            role="tablist"
            aria-label="Relationship type"
            className="px-4 py-2 flex flex-wrap gap-2 border-t border-[#B89555]/15 bg-[#F7F2EA]"
          >
            {REL_TABS.map((t) => {
              const active = t.id === sub;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSub(t.id)}
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

      {/* Body — boxed champagne panel so embedded sections never overlap the CRM header/tabs */}
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
