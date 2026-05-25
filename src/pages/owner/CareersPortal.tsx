import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, FileText, Users, UserCheck, Award,
  GraduationCap, Wallet, AlertTriangle, MessagesSquare, Bot, ShieldCheck,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import PositionManager from "@/components/careers-portal/PositionManager";
import CareersPortalOverview from "@/components/careers-portal/CareersPortalOverview";

// Lazy-load the heavy embedded modules so the portal stays snappy.
const EmbeddedHRDashboard      = lazy(() => import("@/components/admin/EmbeddedHRDashboard").then(m => ({ default: m.EmbeddedHRDashboard })));
const EmbeddedEmployeeHub      = lazy(() => import("@/components/admin/EmbeddedEmployeeHub").then(m => ({ default: m.EmbeddedEmployeeHub })));
const EmployeeManagementHub    = lazy(() => import("@/pages/EmployeeManagementHub"));
const HRAgentChat              = lazy(() => import("@/components/hr/HRAgentChat"));
const EmployeeChatHub          = lazy(() => import("@/components/employee-chat/EmployeeChatHub"));
const AdminOnboarding          = lazy(() => import("@/pages/AdminOnboarding"));
const JobOfferTemplate         = lazy(() => import("@/pages/JobOfferTemplate"));
const CVCenter                 = lazy(() => import("@/components/crm/CVCenter"));

type SectionKey =
  | "overview"
  | "positions"
  | "applications"
  | "candidates"
  | "offers"
  | "employees"
  | "onboarding"
  | "payroll"
  | "performance"
  | "comms"
  | "hr-agent"
  | "audit";

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: typeof Briefcase;
  description: string;
}

const SECTIONS: SectionDef[] = [
  { key: "overview",     label: "Overview",            icon: LayoutDashboard, description: "Headline metrics across the careers operation." },
  { key: "positions",    label: "Open Positions",      icon: Briefcase,       description: "Create, edit, archive job postings — with AI." },
  { key: "applications", label: "Applications & CVs",  icon: FileText,        description: "Inbound applications and CV submissions." },
  { key: "candidates",   label: "Candidates",          icon: UserCheck,       description: "Talent pipeline, interviews, assessments." },
  { key: "offers",       label: "Hiring & Offers",     icon: Award,           description: "Job offer templates and signed packages." },
  { key: "employees",    label: "Employees",           icon: Users,           description: "Roster, journey, activity audit." },
  { key: "onboarding",   label: "Onboarding",          icon: GraduationCap,   description: "New-joiner onboarding and modules." },
  { key: "payroll",      label: "Payroll & Salaries",  icon: Wallet,          description: "Salaries, commissions, payment history." },
  { key: "performance",  label: "Performance & Warnings", icon: AlertTriangle, description: "Reviews, KPIs, disciplinary records." },
  { key: "comms",        label: "Employee Comms",      icon: MessagesSquare,  description: "Internal chat, emails, notifications." },
  { key: "hr-agent",     label: "HR Agent (AI)",       icon: Bot,             description: "AI HR assistant." },
  { key: "audit",        label: "Audit & Access",      icon: ShieldCheck,     description: "Access logs and salary-access audit." },
];

function Loading() {
  return (
    <div className="flex items-center gap-2 text-[#1A1A1A]/70 py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading section…
    </div>
  );
}

function Placeholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <Card><CardContent className="py-10 text-center">
      <h3 className="font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      <p className="text-sm text-[#1A1A1A]/70 max-w-xl mx-auto">{blurb}</p>
    </CardContent></Card>
  );
}

export default function CareersPortal() {
  const [params, setParams] = useSearchParams();
  const active = (params.get("section") as SectionKey) || "overview";

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
      {/* Sub-header (sticky, sits below the 88px global header) */}
      <div
        className="sticky top-[88px] z-30 bg-[#F7F2EA]/95 backdrop-blur"
        style={{ borderBottom: "1px solid rgba(184,149,85,0.35)" }}
      >
        <div className="container mx-auto px-4 pt-4 pb-2">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A]">Careers Portal</h1>
              <p className="text-sm text-[#1A1A1A]/70">
                Single hub for hiring, employees, payroll, HR and AI. The public Careers page reads from here.
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
            <ul className="flex gap-1 min-w-max pb-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === active;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setSection(s.key)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap border",
                        isActive
                          ? "bg-[#102540] text-white border-[#B89555]"
                          : "bg-transparent text-[#1A1A1A] border-[#B89555]/40 hover:border-[#B89555] hover:bg-[#EFE6D6]/60",
                      )}
                      data-allow-dark-cta={isActive ? "" : undefined}
                      data-no-contrast-guard={isActive ? "" : undefined}
                    >
                      <Icon className="w-3.5 h-3.5" />
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
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wider text-[#1A1A1A]/60">{activeDef.label}</p>
          <p className="text-sm text-[#1A1A1A]/70">{activeDef.description}</p>
        </div>

        <Suspense fallback={<Loading />}>
          {active === "overview"     && <CareersPortalOverview onJump={setSection} />}
          {active === "positions"    && <PositionManager />}
          {active === "applications" && <CVCenter />}
          {active === "candidates"   && <EmbeddedHRDashboard />}
          {active === "offers"       && <JobOfferTemplate />}
          {active === "employees"    && <EmployeeManagementHub />}
          {active === "onboarding"   && <AdminOnboarding />}
          {active === "payroll"      && <EmbeddedHRDashboard />}
          {active === "performance"  && <EmbeddedHRDashboard />}
          {active === "comms"        && <EmployeeChatHub />}
          {active === "hr-agent"     && <HRAgentChat />}
          {active === "audit"        && (
            <Placeholder
              title="Audit & access"
              blurb="HR access logs, salary-access audit and admin edit history are surfaced under each respective section. A consolidated view is coming next."
            />
          )}
        </Suspense>
      </main>
    </div>
  );
}
