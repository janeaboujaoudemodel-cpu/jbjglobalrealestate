import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";
import { SEOHead } from "@/components/SEOHead";
import { scrollToId } from "@/lib/scroll";
import {
  ArrowRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileText,
  Headphones,
  Home,
  KeyRound,
  Percent,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Sparkle,
  Timer,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";

const INK = "#1A1A1A";
const INK_SOFT = "rgba(26,26,26,0.74)";
const EMERALD = "#064E3B";
const EMERALD_DARK = "#042C1C";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const CHAMPAGNE = "#F7F2EA";
const CHAMPAGNE_DEEP = "#EFE3CF";
const GOLD = "#B89555";
const EMERALD_GRADIENT = `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DARK} 58%, ${BLACK} 100%)`;
const HERO_GRADIENT = `radial-gradient(95% 72% at 50% 0%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 58%), linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_DARK} 50%, ${BLACK} 100%)`;
const PANEL_GRADIENT = "linear-gradient(160deg, #FFFDF8 0%, #F7F2EA 48%, #EFE3CF 100%)";

const tocSections = [
  { id: "overview", label: "Management Overview", icon: Home },
  { id: "metrics", label: "Performance Metrics", icon: BarChart3 },
  { id: "services", label: "Service Scope", icon: ClipboardCheck },
  { id: "leasing", label: "Leasing & Tenant Placement", icon: KeyRound },
  { id: "finance", label: "Financial Management", icon: ReceiptText },
  { id: "operations", label: "Maintenance & Operations", icon: Wrench },
  { id: "workflow", label: "Workflow", icon: RefreshCcw },
  { id: "reporting", label: "Reporting", icon: FileText },
  { id: "trust", label: "Trust & Governance", icon: ShieldCheck },
  { id: "fees", label: "Fees", icon: Percent },
  { id: "proposal", label: "Proposal Request", icon: CalendarClock },
  { id: "faq", label: "Questions", icon: Headphones },
];

const metrics = [
  { value: "98%", label: "Rent collection discipline", icon: DollarSign },
  { value: "<24h", label: "Urgent response target", icon: Timer },
  { value: "95%", label: "Tenant retention focus", icon: UsersRound },
  { value: "100%", label: "Documented compliance flow", icon: ShieldCheck },
  { value: "500+", label: "Managed-unit experience", icon: Building2 },
  { value: "4.9/5", label: "Owner service standard", icon: Award },
];

const serviceScope = [
  { title: "Residential Management", icon: Home, points: ["Tenant sourcing and screening", "Lease renewals and Ejari coordination", "Move-in and move-out inspections", "Rent collection and owner updates"] },
  { title: "Commercial Management", icon: BriefcaseBusiness, points: ["Commercial leasing strategy", "Occupier retention planning", "Contract coordination", "Performance and occupancy reporting"] },
  { title: "Leasing & Placement", icon: KeyRound, points: ["Market rent assessment", "Listing preparation", "Qualified tenant shortlisting", "Handover documentation"] },
  { title: "Tenant Care", icon: UsersRound, points: ["Dedicated communication workflow", "Complaint resolution tracking", "Inspection coordination", "Renewal reminders"] },
];

const financeItems = [
  { icon: DollarSign, title: "Rent Collection", text: "Collection tracking, reminders, escalation, and owner confirmation." },
  { icon: ReceiptText, title: "Expense Control", text: "Approved spending thresholds with invoices and vendor records." },
  { icon: BarChart3, title: "Monthly Statements", text: "Income, expenses, net position, and maintenance summaries." },
  { icon: Percent, title: "Service Charge Review", text: "Community service charges monitored against asset performance." },
];

const operationsItems = [
  { title: "Preventive Maintenance", text: "Scheduled checks for HVAC, plumbing, electrical, fixtures, and common-area responsibilities." },
  { title: "Emergency Coordination", text: "Urgent vendor dispatch, owner notification, and incident documentation." },
  { title: "Vendor Governance", text: "Vetted suppliers, transparent quotes, approval thresholds, and completion records." },
  { title: "Condition Control", text: "Inspection photos, handover reports, and wear-and-tear tracking." },
];

const workflow = [
  { label: "Asset Review", icon: Home },
  { label: "Inspection", icon: ClipboardCheck },
  { label: "Agreement", icon: FileText },
  { label: "Activation", icon: Sparkle },
  { label: "Reporting", icon: BarChart3 },
];

const reporting = [
  "Monthly financial statement",
  "Maintenance log and vendor status",
  "Tenant communication summary",
  "Renewal and expiry alerts",
  "Occupancy and vacancy position",
  "Portfolio review recommendations",
];

const trustSignals = [
  { icon: ShieldCheck, title: "Compliance First", text: "Tenancy documents, approvals, and property procedures are handled through a documented workflow." },
  { icon: Award, title: "Licensed Standards", text: "Service delivery follows UAE real estate operating standards with clear accountability." },
  { icon: Headphones, title: "Dedicated Manager", text: "Owners receive one accountable contact for tenant, maintenance, reporting, and renewal updates." },
];

const faqData = [
  { q: "Do you collect rent on my behalf?", a: "Yes. Rent collection, follow-up, deposit coordination, and owner reporting are part of the financial management workflow." },
  { q: "Do I lose control of property decisions?", a: "No. You set approval thresholds. Costs above the threshold require owner authorization before work proceeds." },
  { q: "Can you manage a vacant unit?", a: "Yes. We coordinate readiness, presentation, listing distribution, tenant qualification, and handover." },
  { q: "Do you handle maintenance directly?", a: "We coordinate licensed and vetted vendors, track completion, and provide transparent cost documentation." },
  { q: "Will I receive reports?", a: "Yes. Owners receive structured monthly updates covering finance, tenant status, maintenance, and occupancy." },
  { q: "Is this the same as brokerage?", a: "No. Brokerage is transactional. Property management is ongoing operational stewardship after acquisition or leasing." },
];

const managementServices = [
  "Full Property Management",
  "Residential Property Management",
  "Commercial Property Management",
  "Leasing & Tenant Placement",
  "Maintenance Coordination",
  "Owner Reporting Setup",
  "Portfolio Management",
];

function Section({
  id,
  eyebrow,
  title,
  text,
  children,
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 py-6 md:py-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          data-pm-panel
          className="rounded-3xl border p-6 md:p-9"
          style={{
            background: PANEL_GRADIENT,
            borderColor: "rgba(184,149,85,0.42)",
            boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34), inset 0 1px 0 rgba(255,255,255,0.78)",
          }}
        >
          {(eyebrow || title || text) && (
            <div className="mb-7">
              {eyebrow ? (
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: EMERALD }}>
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2 className="text-3xl font-semibold leading-tight md:text-4xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
                  {title}
                </h2>
              ) : null}
              {text ? <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: INK_SOFT }}>{text}</p> : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

function EmeraldTile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-pm-emerald
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: EMERALD_GRADIENT,
        borderColor: "rgba(255,255,255,0.22)",
        boxShadow: "0 18px 38px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.13)",
        color: WHITE,
      }}
    >
      {children}
    </div>
  );
}

function EmeraldIcon({ icon: Icon, large = false }: { icon: LucideIcon; large?: boolean }) {
  return (
    <span
      data-pm-emerald
      className={`${large ? "h-14 w-14" : "h-11 w-11"} inline-flex shrink-0 items-center justify-center rounded-full`}
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.2} />
    </span>
  );
}

function NumberBadge({ value }: { value: number | string }) {
  return (
    <span
      data-pm-emerald
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      {value}
    </span>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: INK }}>
          <span data-pm-emerald className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: EMERALD_GRADIENT }}>
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HeroButton({ to, children, variant = "solid" }: { to: string; children: ReactNode; variant?: "solid" | "outline" }) {
  return (
    <Link
      to={to}
      data-pm-emerald
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:w-auto"
      style={{
        background: variant === "solid" ? EMERALD_GRADIENT : "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.48)",
        color: WHITE,
      }}
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export default function PropertyManagement() {
  return (
    <div data-service-page="property-management" data-pm-page style={{ background: CHAMPAGNE }}>
      <SEOHead
        title="Property Management Dubai | JBJ Global Real Estate"
        description="Premium property management in Dubai and the UAE with tenant care, maintenance, financial reporting, compliance, and asset stewardship."
        canonicalPath="/services/property-management"
      />

      <style>{`
        [data-pm-page], [data-pm-page] * { box-sizing: border-box; }
        [data-pm-page] { background: ${CHAMPAGNE} !important; }
        [data-pm-page] main[data-service-body] {
          background: ${CHAMPAGNE} !important;
          background-image: linear-gradient(180deg, ${CHAMPAGNE} 0%, ${CHAMPAGNE_DEEP} 100%) !important;
        }
        [data-service-page="property-management"] [data-pm-panel],
        [data-service-page="property-management"] [data-pm-panel] *:not(svg):not(path):not(line):not(polyline):not(circle):not(rect):not([data-pm-emerald]):not([data-pm-emerald] *):not([data-pm-toc-button]):not([data-pm-toc-button] *) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald],
        [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald] *:not(input):not(textarea),
        [data-service-page="property-management"] [data-pm-panel] [data-pm-toc-button],
        [data-service-page="property-management"] [data-pm-panel] [data-pm-toc-button] *,
        [data-service-page="property-management"] [data-pm-emerald],
        [data-service-page="property-management"] [data-pm-emerald] *:not(input):not(textarea),
        [data-service-page="property-management"] [data-pm-toc-button],
        [data-service-page="property-management"] [data-pm-toc-button] * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-service-page="property-management"] [data-pm-emerald] svg,
        [data-service-page="property-management"] [data-pm-emerald] path,
        [data-service-page="property-management"] [data-pm-emerald] line,
        [data-service-page="property-management"] [data-pm-emerald] polyline,
        [data-service-page="property-management"] [data-pm-toc-button] svg,
        [data-service-page="property-management"] [data-pm-toc-button] path {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-faq-trigger],
        [data-pm-page] [data-pm-faq-trigger] *:not(svg):not(path) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-pm-faq-trigger][data-state="open"],
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] {
          background: ${EMERALD_GRADIENT} !important;
        }
        html body #root [data-service-page="property-management"] [data-pm-toc-button],
        html body #root [data-service-page="property-management"] [data-pm-toc-button] *,
        html body #root [data-service-page="property-management"] [data-pm-emerald],
        html body #root [data-service-page="property-management"] [data-pm-emerald] *:not(input):not(textarea),
        html body #root [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald],
        html body #root [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald] *:not(input):not(textarea) {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        html body #root [data-service-page="property-management"] [data-pm-toc-button] svg,
        html body #root [data-service-page="property-management"] [data-pm-toc-button] svg *,
        html body #root [data-service-page="property-management"] [data-pm-emerald] svg,
        html body #root [data-service-page="property-management"] [data-pm-emerald] svg *,
        html body #root [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald] svg,
        html body #root [data-service-page="property-management"] [data-pm-panel] [data-pm-emerald] svg * {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        [data-pm-page] [data-jbj-consultation-form] {
          box-shadow: none !important;
          border-radius: 24px !important;
        }
      `}</style>

      <section
        data-brand-hero
        data-pm-emerald
        className="relative grid place-items-center overflow-hidden px-4 text-center sm:px-6 lg:px-8"
        style={{ minHeight: "calc(100svh - 0px)", background: HERO_GRADIENT, color: WHITE, borderRadius: 0 }}
      >
        <div aria-hidden className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.10) 1px, transparent 1px)", backgroundSize: "76px 76px" }} />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center py-28 md:py-32">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: "rgba(255,255,255,0.34)", background: "rgba(255,255,255,0.08)" }}>
            <Building2 className="h-4 w-4" />
            Property Management
          </div>
          <h1 className="max-w-[13ch] text-5xl font-light leading-[0.98] sm:text-6xl md:text-7xl lg:text-8xl" style={{ fontFamily: '"Cormorant Garamond", serif', color: WHITE }}>
            Property Management & Asset Stewardship
          </h1>
          <div aria-hidden className="my-8 h-px w-24" style={{ background: "rgba(255,255,255,0.5)" }} />
          <p className="max-w-2xl text-lg leading-relaxed sm:text-xl md:text-2xl" style={{ color: "rgba(255,255,255,0.9)" }}>
            Structured ownership support for leasing, tenant care, maintenance, finance, compliance, and reporting.
          </p>
          <div className="mt-9 flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
            <HeroButton to="#proposal">Request Management Proposal</HeroButton>
            <HeroButton to="/contact?service=property-management" variant="outline">Speak With a Manager</HeroButton>
          </div>
        </div>
      </section>

      <main data-service-body>
        <div aria-hidden className="h-4 w-full" style={{ background: `linear-gradient(90deg, ${GOLD}, #F4E7C8, ${GOLD})` }} />

        <section className="pt-14 md:pt-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div data-pm-panel className="rounded-3xl border p-6 md:p-9" style={{ background: PANEL_GRADIENT, borderColor: "rgba(184,149,85,0.42)", boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34)" }}>
              <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>Table of Contents</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tocSections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      data-pm-toc-button
                      onClick={() => scrollToId(section.id)}
                      className="grid min-h-[74px] grid-cols-[38px_1fr_20px] items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-transform hover:-translate-y-0.5"
                      style={{ background: EMERALD_GRADIENT, border: "1px solid rgba(255,255,255,0.18)", color: WHITE }}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.18)" }}>{String(index + 1).padStart(2, "0")}</span>
                      <span className="leading-tight">{section.label}</span>
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <Section id="overview" eyebrow="Overview" title="Management Overview" text="A single accountable operating model for owners who want their asset protected, leased correctly, maintained properly, and reported with clarity.">
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
            <EmeraldTile>
              <h3 className="mb-4 text-xl font-semibold">Clients We Serve</h3>
              <ul className="space-y-3 text-sm font-semibold leading-relaxed">
                {['Individual investors', 'Portfolio owners', 'Family offices', 'Overseas owners', 'Corporate landlords'].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0" />{item}</li>)}
              </ul>
            </EmeraldTile>
            <EmeraldTile>
              <h3 className="mb-4 text-xl font-semibold">Designed to Protect</h3>
              <ul className="space-y-3 text-sm font-semibold leading-relaxed">
                {['Rental yield', 'Tenant quality', 'Maintenance standards', 'Compliance records', 'Asset condition'].map((item) => <li key={item} className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0" />{item}</li>)}
              </ul>
            </EmeraldTile>
          </div>
        </Section>

        <Section id="metrics" eyebrow="Performance" title="Performance Metrics" text="Operational indicators are tracked to keep ownership decisions clear and measurable.">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.6fr]">
            <EmeraldTile className="flex min-h-[240px] flex-col justify-between">
              <BarChart3 className="h-10 w-10" />
              <div>
                <p className="text-4xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Owner Clarity</p>
                <p className="mt-3 text-sm leading-relaxed">Each metric is tied to rent, maintenance, compliance, or reporting accountability.</p>
              </div>
            </EmeraldTile>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <EmeraldTile key={metric.label} className="min-h-[136px]">
                    <Icon className="h-5 w-5" />
                    <p className="mt-4 text-3xl font-bold">{metric.value}</p>
                    <p className="mt-1 text-sm font-semibold leading-tight">{metric.label}</p>
                  </EmeraldTile>
                );
              })}
            </div>
          </div>
        </Section>

        <Section id="services" eyebrow="Scope" title="Service Scope" text="Residential, commercial, leasing, and tenant-care workstreams are handled in one owner-first system.">
          <div className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2">
            {serviceScope.map((service) => (
              <div key={service.title} className="grid grid-cols-[48px_1fr] gap-4">
                <EmeraldIcon icon={service.icon} />
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: INK }}>{service.title}</h3>
                  <div className="mt-4"><BulletList items={service.points} /></div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="leasing" eyebrow="Placement" title="Leasing & Tenant Placement" text="Every leasing action is structured around market positioning, tenant quality, compliant paperwork, and clean handover records.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {["Market rent assessment", "Pricing and listing preparation", "Tenant screening", "Contract and Ejari coordination", "Handover and condition report"].map((step, index) => (
              <div key={step} className="flex items-start gap-3 md:block md:text-center">
                <NumberBadge value={index + 1} />
                <p className="mt-0 font-semibold leading-tight md:mt-4" style={{ color: INK }}>{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="finance" eyebrow="Finance" title="Financial Management" text="Owners receive disciplined collection tracking, expense visibility, and monthly reporting.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {financeItems.map((item) => (
              <EmeraldTile key={item.title}>
                <item.icon className="h-6 w-6" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{item.text}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="operations" eyebrow="Operations" title="Maintenance & Operations" text="Every action has an approval path, visible owner updates, and clean maintenance records.">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {operationsItems.map((item) => (
              <div key={item.title}>
                <h3 className="font-semibold" style={{ color: INK }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: INK_SOFT }}>{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="workflow" eyebrow="Workflow" title="Management Workflow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            {workflow.map((step, index) => (
              <EmeraldTile key={step.label} className="flex items-center gap-4 sm:flex-col sm:text-center">
                <NumberBadge value={index + 1} />
                <step.icon className="h-6 w-6" />
                <p className="text-sm font-semibold leading-tight">{step.label}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="reporting" eyebrow="Transparency" title="Reporting & Transparency" text="The reporting structure keeps owners informed without chasing fragmented updates.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reporting.map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                <NumberBadge value={index + 1} />
                <p className="font-semibold" style={{ color: INK }}>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="trust" eyebrow="Governance" title="Trust & Governance">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {trustSignals.map((item) => (
              <EmeraldTile key={item.title} className="text-center">
                <div className="inline-flex"><item.icon className="h-7 w-7" /></div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed">{item.text}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="fees" eyebrow="Fees" title="Service Fees & Structure" text="Fees are tailored after asset review, property type, portfolio size, occupancy position, and required service scope are confirmed.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["Performance-aware structure", "Transparent terms", "Portfolio-scaled packages"].map((item, index) => (
              <EmeraldTile key={item} className="text-center">
                <NumberBadge value={index + 1} />
                <p className="mt-4 text-sm font-semibold">{item}</p>
              </EmeraldTile>
            ))}
          </div>
        </Section>

        <Section id="proposal" eyebrow="Proposal" title="Request a Property Management Proposal" text="This form is for property owners who already have an asset and need management, leasing, reporting, tenant care, or maintenance support.">
          <ConsultationRequestForm
            title="Property Management Proposal"
            subtitle=""
            serviceOptions={managementServices}
            defaultServiceNeeded="Full Property Management"
            messagePlaceholder="Tell us the property type, location, current occupancy, tenant status, maintenance needs, reporting expectations, and preferred start date."
            formSource="property-management-proposal"
            variant="property-management"
            showHeader={false}
            className="max-w-none"
          />
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Frequently Asked Questions">
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`} className="overflow-hidden rounded-2xl border" style={{ borderColor: "rgba(184,149,85,0.38)", background: "rgba(255,253,248,0.72)" }}>
                <AccordionTrigger data-pm-faq-trigger className="min-h-[64px] px-5 py-4 text-left font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0"><p className="text-sm leading-relaxed" style={{ color: INK_SOFT }}>{faq.a}</p></AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <section id="ready-to-get-started" className="scroll-mt-28 pb-16 pt-6 md:pb-24 md:pt-8">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div data-pm-emerald className="rounded-3xl border p-7 text-center md:p-10" style={{ background: EMERALD_GRADIENT, borderColor: "rgba(255,255,255,0.22)", color: WHITE }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Ready to Get Started</p>
              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold md:text-5xl" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Ready to Structure Your Property Management?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed md:text-base">Share your asset details and our management desk will confirm the correct service path, reporting structure, and next step.</p>
              <div className="mt-7 flex justify-center">
                <HeroButton to="#proposal">Request Management Proposal</HeroButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}