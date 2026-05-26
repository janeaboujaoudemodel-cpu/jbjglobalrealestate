import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, FileText, Users, Award,
  GraduationCap, Wallet, AlertTriangle, MessagesSquare, Bot, ShieldCheck,
  Loader2, ClipboardCheck, TrendingUp, Linkedin, Building2, Crosshair,
} from "lucide-react";

import PositionManager from "@/components/careers-portal/PositionManager";
import CareersPortalOverview from "@/components/careers-portal/CareersPortalOverview";
import CareersEmptyState from "@/components/careers-portal/EmptyState";

// Lazy-load the heavy modules so the portal stays snappy. Each tab lazy-loads
// exactly ONE canonical component — no duplicates mounted simultaneously.
const EmployeeManagementHub      = lazy(() => import("@/pages/EmployeeManagementHub"));
const HRAgentChat                = lazy(() => import("@/components/hr/HRAgentChat"));
const EmployeeChatHub            = lazy(() => import("@/components/employee-chat/EmployeeChatHub"));
const AdminOnboarding            = lazy(() => import("@/pages/AdminOnboarding"));
const JobOfferManager            = lazy(() => import("@/components/hr/JobOfferManager"));
const CVCenter                   = lazy(() => import("@/components/crm/CVCenter"));
const HuntingDashboard           = lazy(() => import("@/components/hr/hunting/HuntingDashboard").then(m => ({ default: m.HuntingDashboard })));
const ApprovalWorkflowPanel      = lazy(() => import("@/components/hr/ApprovalWorkflowPanel").then(m => ({ default: m.ApprovalWorkflowPanel })));
const HRInboxTab                 = lazy(() => import("@/components/hr/HRInboxTab").then(m => ({ default: m.HRInboxTab })));
const WarningsPanel              = lazy(() => import("@/components/hr/WarningsPanel").then(m => ({ default: m.WarningsPanel })));
const EmployeePerformanceDashboard = lazy(() => import("@/components/hr/EmployeePerformanceDashboard").then(m => ({ default: m.EmployeePerformanceDashboard })));
const EmployeeSalaryCommissionPanel = lazy(() => import("@/components/employee-hub/EmployeeSalaryCommissionPanel").then(m => ({ default: m.EmployeeSalaryCommissionPanel })));
const LinkedInInsightsPanel      = lazy(() => import("@/components/hr/LinkedInInsightsPanel").then(m => ({ default: m.LinkedInInsightsPanel })));
const CompetitorTrackingPanel    = lazy(() => import("@/components/hr/CompetitorTrackingPanel").then(m => ({ default: m.CompetitorTrackingPanel })));
const EmployeeActivityAudit      = lazy(() => import("@/components/employee-management/EmployeeActivityAudit"));

export type SectionKey =
  | "overview"
  | "recruitment"
  | "cv-center"
  | "positions"
  | "employees"
  | "performance"
  | "payroll"
  | "approvals"
  | "warnings"
  | "onboarding"
  | "contracts"
  | "comms"
  | "ai-recruiting"
  | "linkedin"
  | "competitors"
  | "audit";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: typeof Briefcase;
  description: string;
}

// 16 canonical tabs — order per Phase 0 audit §7 (approved).
const SECTIONS: SectionDef[] = [
  { key: "overview",      label: "Overview",                 icon: LayoutDashboard, description: "Live counts pulled from real tables — never invented." },
  { key: "recruitment",   label: "Recruitment",              icon: Crosshair,       description: "Hunt engine: prospects, campaigns, outreach." },
  { key: "cv-center",     label: "CV Center",                icon: FileText,        description: "Inbound applications and full applicant profile drawer." },
  { key: "positions",     label: "Open Positions",           icon: Briefcase,       description: "Create, edit, archive job postings." },
  { key: "employees",     label: "Employees",                icon: Users,           description: "Roster, journey, IT provisioning, activity." },
  { key: "performance",   label: "Performance",              icon: TrendingUp,      description: "Reviews, KPIs and employee performance summary." },
  { key: "payroll",       label: "Payroll & Commissions",    icon: Wallet,          description: "Salaries, commissions, payment history." },
  { key: "approvals",     label: "Approvals",                icon: ClipboardCheck,  description: "Three-stage approvals + HR inbox." },
  { key: "warnings",      label: "Warnings & Compliance",    icon: AlertTriangle,   description: "Disciplinary records and compliance flags." },
  { key: "onboarding",    label: "Onboarding",               icon: GraduationCap,   description: "New-joiner journey and onboarding tasks." },
  { key: "contracts",     label: "Contracts & Templates",    icon: Award,           description: "Job offers, templates, signed contracts." },
  { key: "comms",         label: "Internal Communications",  icon: MessagesSquare,  description: "Internal employee chat and emails." },
  { key: "ai-recruiting", label: "AI Recruiting",            icon: Bot,             description: "AI hiring assistant (Jessica) — owner view." },
  { key: "linkedin",      label: "LinkedIn Recruiting",      icon: Linkedin,        description: "Manual import + AI enrichment (Phase 3a)." },
  { key: "competitors",   label: "Competitor Intelligence",  icon: Building2,       description: "Market intel — empty until a real feed is wired." },
  { key: "audit",         label: "Audit & Access Logs",      icon: ShieldCheck,     description: "HR access logs and employee activity audit." },
];

function Loading() {
  return (
    <div className="flex items-center gap-2 text-[#1A1A1A]/70 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading section…
    </div>
  );
}

export default function CareersPortal() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const active = ((params.get("section") as SectionKey) || "overview") as SectionKey;

  const setSection = (k: SectionKey) => {
    const next = new URLSearchParams(params);
    next.set("section", k);
    setParams(next, { replace: true });
  };

  const activeDef = useMemo(
    () => SECTIONS.find((s) => s.key === active) ?? SECTIONS[0],
    [active],
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px]">
      {/* Sub-header — sticky under the 88px global header */}
      <div
        className="sticky top-[88px] z-30 bg-[#F7F2EA]/95 backdrop-blur"
        style={{ borderBottom: "1px solid rgba(184,149,85,0.35)" }}
      >
        <div className="container mx-auto px-4 pt-4 pb-2">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#1A1A1A]/60">
                JBJ GLOBAL REAL ESTATE
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Careers Portal</h1>
              <p className="text-sm text-[#1A1A1A]/70">
                Single canonical HR system. The public Careers page reads from here.
              </p>
            </div>
            <Link
              to="/careers"
              className="text-xs underline text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            >
              View public Careers page →
            </Link>
          </div>

          <nav className="mt-3 -mx-1 overflow-x-auto">
            <ul className="flex gap-1.5 min-w-max pb-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === active;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setSection(s.key)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap border",
                        isActive
                          ? // Strong active state: navy fill + gold hairline + white text.
                            "bg-[#102540] text-white border-[#B89555] shadow-sm"
                          : // Idle: champagne-on-champagne with gold hairline; hover deepens.
                            "bg-white/40 text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#EFE6D6] hover:border-[#B89555]",
                      )}
                      data-allow-dark-cta={isActive ? "" : undefined}
                      data-no-contrast-guard={isActive ? "" : undefined}
                    >
                      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-[#1A1A1A]")} />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">{activeDef.label}</p>
          <p className="text-sm text-[#1A1A1A]/70">{activeDef.description}</p>
        </div>

        <Suspense fallback={<Loading />}>
          {active === "overview"      && <CareersPortalOverview onJump={setSection} />}
          {active === "recruitment"   && <HuntingDashboard />}
          {active === "cv-center"     && <CVCenter userId={user?.id || ""} />}
          {active === "positions"     && <PositionManager />}
          {active === "employees"     && <EmployeeManagementHub />}
          {active === "performance"   && <EmployeePerformanceDashboard />}
          {active === "payroll"       && <EmployeeSalaryCommissionPanel />}
          {active === "approvals"     && (
            <div className="space-y-6">
              <ApprovalWorkflowPanel />
              <HRInboxTab />
            </div>
          )}
          {active === "warnings"      && <WarningsPanel />}
          {active === "onboarding"    && <AdminOnboarding />}
          {active === "contracts"     && <JobOfferManager />}
          {active === "comms"         && <EmployeeChatHub />}
          {active === "ai-recruiting" && <HRAgentChat />}
          {active === "linkedin"      && <LinkedInInsightsPanel />}
          {active === "competitors"   && <CompetitorTrackingPanel />}
          {active === "audit"         && (
            <div className="space-y-6">
              <EmployeeActivityAudit searchQuery="" />
              <CareersEmptyState
                icon={ShieldCheck}
                title="HR access & salary-access audit"
                body="Salary-access audit and HR access logs are surfaced inside the Employees and Payroll sections respectively. A consolidated cross-table view will land in Phase 2."
                badge="JBJ GLOBAL REAL ESTATE"
              />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
