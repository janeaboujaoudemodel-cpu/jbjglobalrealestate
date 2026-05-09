/**
 * UnifiedCRM — single owner-only CRM hub.
 * Replaces the previously scattered /owner/crm/* sub-routes with one shell
 * driven by a horizontal subheader. Each section renders the underlying
 * existing page/component inline (no removals, no data loss).
 *
 * Sections:
 *   - All Leads · Flagged · VIP · Lead Mgmt
 *   - Relationships  → Investors · Developers · Sales Reps · Brokers · Agencies
 *   - Employees · Campaigns · Tasks · Calendar
 *
 * Section state is kept in URL `?section=...&sub=...` so deep links + the
 * legacy redirects still work.
 */
import { lazy, Suspense, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Flag, Crown, Briefcase, Network, UserCog,
  Megaphone, ListTodo, Calendar as CalendarIcon,
} from "lucide-react";

// --- Lazy section content (existing pages reused as-is) -------------------
const CRMPage              = lazy(() => import("@/pages/CRM"));                       // All / Flagged / VIP / Mgmt (already has internal tabs)
const CRMRelationships     = lazy(() => import("@/pages/CRMRelationships"));          // Investors view
const CRMNetworkPage       = lazy(() => import("@/pages/owner/crm/CRMNetwork"));      // Developers + Agencies
const BrokersRegistryPage  = lazy(() => import("@/pages/owner/crm/BrokersRegistry")); // Brokers
const CRMEmployees         = lazy(() => import("@/pages/CRMEmployees"));
const CampaignsPage        = lazy(() => import("@/pages/owner/crm/CampaignsPage"));
const CRMTasks             = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar          = lazy(() => import("@/pages/CRMCalendar"));

type SectionId =
  | "leads" | "flagged" | "vip" | "management"
  | "relationships" | "employees" | "campaigns" | "tasks" | "calendar";

type RelSubId = "investors" | "developers" | "sales-reps" | "brokers" | "agencies";

interface NavItem { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; }

const PRIMARY: NavItem[] = [
  { id: "leads",         label: "All Leads",      icon: Users },
  { id: "flagged",       label: "Flagged",        icon: Flag },
  { id: "vip",           label: "VIP",            icon: Crown },
  { id: "management",    label: "Lead Mgmt",      icon: Briefcase },
  { id: "relationships", label: "Relationships",  icon: Network },
  { id: "employees",     label: "Employees",      icon: UserCog },
  { id: "campaigns",     label: "Campaigns",      icon: Megaphone },
  { id: "tasks",         label: "Tasks",          icon: ListTodo },
  { id: "calendar",      label: "Calendar",       icon: CalendarIcon },
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

export default function UnifiedCRM() {
  const [params, setParams] = useSearchParams();
  const section: SectionId = (params.get("section") as SectionId) || "leads";
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
    if (section === "leads")       return <CRMPage />;
    if (section === "flagged")     return <CRMPage />;
    if (section === "vip")         return <CRMPage />;
    if (section === "management")  return <CRMPage />;
    if (section === "employees")   return <CRMEmployees />;
    if (section === "campaigns")   return <CampaignsPage />;
    if (section === "tasks")       return <CRMTasks />;
    if (section === "calendar")    return <CRMCalendar />;
    // relationships
    if (sub === "investors")            return <CRMRelationships />;
    if (sub === "developers")           return <CRMNetworkPage />;
    if (sub === "agencies")             return <CRMNetworkPage />;
    if (sub === "sales-reps")           return <CRMNetworkPage />;
    if (sub === "brokers")              return <BrokersRegistryPage />;
    return <CRMRelationships />;
  }, [section, sub]);

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* In-page header */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#B89555]/30">
        <div className="px-6 pt-5 pb-3 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">JBJ CRM</h1>
            <p className="text-xs text-[#1A1A1A]/70">
              Unified relationship hub — leads, partners, employees, campaigns. Owner-only.
            </p>
          </div>
        </div>

        {/* Primary subheader */}
        <nav
          role="tablist"
          aria-label="CRM sections"
          className="px-4 flex flex-wrap gap-1 border-t border-[#B89555]/15"
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
                  "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium",
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

      {/* Body — existing pages render inline */}
      <div className="relative">
        <Suspense fallback={<Fallback />}>{Body}</Suspense>
      </div>
    </div>
  );
}
