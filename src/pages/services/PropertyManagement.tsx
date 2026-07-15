import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
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
const EMERALD = "#064E3B";
const EMERALD_DARK = "#042C1C";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const CHAMPAGNE = "#F7F2EA";
const CHAMPAGNE_RAISED = "#FFFDF8";
const EMERALD_GRADIENT = `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DARK} 58%, ${BLACK} 100%)`;
const HERO_GRADIENT = `radial-gradient(95% 72% at 50% 0%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 58%), linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_DARK} 50%, ${BLACK} 100%)`;

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
  {
    title: "Residential Management",
    icon: Home,
    points: ["Tenant sourcing and screening", "Lease renewals and Ejari coordination", "Move-in and move-out inspections", "Rent collection and owner updates"],
  },
  {
    title: "Commercial Management",
    icon: BriefcaseBusiness,
    points: ["Commercial leasing strategy", "Occupier retention planning", "Contract coordination", "Performance and occupancy reporting"],
  },
  {
    title: "Leasing & Placement",
    icon: KeyRound,
    points: ["Market rent assessment", "Listing preparation", "Qualified tenant shortlisting", "Handover documentation"],
  },
  {
    title: "Tenant Care",
    icon: UsersRound,
    points: ["Dedicated communication workflow", "Complaint resolution tracking", "Inspection coordination", "Renewal reminders"],
  },
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
  { icon: ShieldCheck, title: "Compliance First", text: "Dubai property procedures, tenancy documents, and owner approvals are handled through a documented workflow." },
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

function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-28 py-8 md:py-11 ${className}`}>
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="mb-7">
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: EMERALD }}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold leading-tight md:text-4xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
        {title}
      </h2>
      {text ? <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: "rgba(26,26,26,0.74)" }}>{text}</p> : null}
    </div>
  );
}

function ChampagneCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-surface="champagne"
      data-allow-ink
      className={`rounded-2xl border p-6 shadow-[0_18px_46px_-34px_rgba(6,78,59,0.42)] md:p-8 ${className}`}
      style={{ background: CHAMPAGNE_RAISED, borderColor: "rgba(184,149,85,0.38)", color: INK }}
    >
      {children}
    </div>
  );
}

function EmeraldIcon({ icon: Icon, large = false }: { icon: LucideIcon; large?: boolean }) {
  return (
    <span
      className={`${large ? "h-14 w-14" : "h-11 w-11"} inline-flex shrink-0 items-center justify-center rounded-full`}
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      <Icon className={large ? "h-7 w-7" : "h-5 w-5"} style={{ color: WHITE, stroke: WHITE }} strokeWidth={2.3} />
    </span>
  );
}

function NumberBadge({ value }: { value: number | string }) {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ background: EMERALD_GRADIENT, color: WHITE, WebkitTextFillColor: WHITE }}
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
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: EMERALD_GRADIENT }}>
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: WHITE, stroke: WHITE }} />
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
      data-no-contrast-guard
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 sm:w-auto"
      style={{
        background: variant === "solid" ? EMERALD_GRADIENT : "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.48)",
        color: WHITE,
        WebkitTextFillColor: WHITE,
      }}
    >
      <span style={{ color: WHITE, WebkitTextFillColor: WHITE }}>{children}</span>
      <ArrowRight className="h-4 w-4" style={{ color: WHITE, stroke: WHITE }} />
    </Link>
  );
}

export default function PropertyManagement() {
  return (
    <div data-brand-emerald-page data-service-page="property-management" data-pm-page style={{ background: CHAMPAGNE }}>
      <SEOHead
        title="Property Management Dubai | JBJ Global Real Estate"
        description="Premium property management in Dubai and the UAE with tenant care, maintenance, financial reporting, compliance, and asset stewardship."
        canonicalPath="/services/property-management"
      />

      <style>{`
        [data-pm-page], [data-pm-page] * { box-sizing: border-box; }
        [data-pm-page] [data-surface="champagne"],
        [data-pm-page] [data-surface="champagne"] *:not(svg):not(path),
        [data-pm-page] [data-allow-ink],
        [data-pm-page] [data-allow-ink] *:not(svg):not(path) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-emerald-surface],
        [data-pm-page] [data-emerald-surface] *:not(input):not(textarea),
        [data-pm-page] [data-pm-toc-button],
        [data-pm-page] [data-pm-toc-button] * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-emerald-surface] svg,
        [data-pm-page] [data-emerald-surface] path,
        [data-pm-page] [data-pm-toc-button] svg,
        [data-pm-page] [data-pm-toc-button] path {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] {
          background: ${EMERALD_GRADIENT} !important;
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] *,
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] svg,
        [data-pm-page] [data-pm-faq-trigger][data-state="open"] path {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        [data-pm-page] [data-jbj-consultation-form],
        [data-pm-page] [data-jbj-consultation-form] *:not(svg):not(path) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-jbj-consultation-form] .jj-emerald-action,
        [data-pm-page] [data-jbj-consultation-form] .jj-emerald-action * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-jbj-consultation-form] .jj-emerald-action svg,
        [data-pm-page] [data-jbj-consultation-form] .jj-emerald-action path {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
      `}</style>

      <section
        data-brand-hero
        data-emerald-surface
        className="relative left-1/2 grid w-screen -translate-x-1/2 place-items-center overflow-hidden px-4 text-center sm:px-6 lg:px-8"
        style={{
          minHeight: "100svh",
          background: HERO_GRADIENT,
          color: WHITE,
          borderRadius: 0,
        }}
      >
        <div aria-hidden className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.10) 1px, transparent 1px)", backgroundSize: "76px 76px" }} />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center py-28 md:py-32">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: "rgba(255,255,255,0.34)", background: "rgba(255,255,255,0.08)" }}>
            <Building2 className="h-4 w-4" />
            Property Management
          </div>

          <h1 className="max-w-[13ch] text-5xl font-light leading-[0.98] sm:text-6xl md:text-7xl lg:text-8xl" style={{ fontFamily: '"Cormorant Garamond", serif', color: WHITE, WebkitTextFillColor: WHITE }}>
            Property Management & Asset Stewardship
          </h1>
          <div aria-hidden className="my-8 h-px w-24" style={{ background: "rgba(255,255,255,0.5)" }} />
          <p className="max-w-2xl text-lg leading-relaxed sm:text-xl md:text-2xl" style={{ color: "rgba(255,255,255,0.9)", WebkitTextFillColor: "rgba(255,255,255,0.9)" }}>
            Structured ownership support for leasing, tenant care, maintenance, finance, compliance, and reporting.
          </p>
          <div className="mt-9 flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
            <HeroButton to="#proposal">Request Management Proposal</HeroButton>
            <HeroButton to="/contact?service=property-management" variant="outline">Speak With a Manager</HeroButton>
          </div>
        </div>
      </section>

      <main data-service-body style={{ background: CHAMPAGNE }}>
        <section className="py-12 md:py-16">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <ChampagneCard className="p-5 md:p-7">
              <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
                Table of Contents
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tocSections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      data-pm-toc-button
                      onClick={() => scrollToId(section.id)}
                      className="grid min-h-[74px] grid-cols-[34px_1fr_20px] items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold shadow-[0_12px_26px_-20px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5"
                      style={{ background: EMERALD_GRADIENT, border: "1px solid rgba(255,255,255,0.18)", color: WHITE }}
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.16)" }}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-tight">{section.label}</span>
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </ChampagneCard>
          </div>
        </section>

        <Section id="overview">
          <ChampagneCard>
            <SectionHeading
              eyebrow="Overview"
              title="Management Overview"
              text="A single accountable operating model for owners who want their asset protected, leased correctly, maintained properly, and reported with clarity."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { title: "Clients We Serve", points: ["Individual investors", "Portfolio owners", "Family offices", "Overseas owners", "Corporate landlords"] },
                { title: "Designed to Protect", points: ["Rental yield", "Tenant quality", "Maintenance standards", "Compliance records", "Asset condition"] },
              ].map((item) => (
                <div key={item.title} className="h-full rounded-xl border p-5" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <BulletList items={item.points} />
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="metrics">
          <ChampagneCard>
            <SectionHeading eyebrow="Performance" title="Performance Metrics" text="Operational indicators are tracked to keep ownership decisions clear and measurable." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex min-h-[166px] flex-col items-center justify-center rounded-xl border p-5 text-center" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <EmeraldIcon icon={metric.icon} large />
                  <p className="mt-4 text-3xl font-bold" style={{ color: EMERALD, WebkitTextFillColor: EMERALD }}>{metric.value}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>{metric.label}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="services">
          <ChampagneCard>
            <SectionHeading eyebrow="Scope" title="Service Scope" text="Residential, commercial, leasing, and tenant-care workstreams are handled in one owner-first system." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {serviceScope.map((service) => (
                <div key={service.title} className="min-h-[250px] rounded-xl border p-5" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <EmeraldIcon icon={service.icon} />
                  <h3 className="mt-4 text-lg font-semibold" style={{ color: INK }}>{service.title}</h3>
                  <div className="mt-4"><BulletList items={service.points} /></div>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="leasing">
          <ChampagneCard>
            <SectionHeading eyebrow="Placement" title="Leasing & Tenant Placement" text="Every leasing action is structured around market positioning, tenant quality, compliant paperwork, and clean handover records." />
            <div className="space-y-3">
              {["Market rent assessment", "Pricing and listing preparation", "Tenant screening", "Contract and Ejari coordination", "Handover and condition report"].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-xl border p-4" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <NumberBadge value={index + 1} />
                  <p className="font-semibold" style={{ color: INK }}>{step}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="finance">
          <ChampagneCard>
            <SectionHeading eyebrow="Finance" title="Financial Management" text="Owners receive disciplined collection tracking, expense visibility, and monthly reporting." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {financeItems.map((item) => (
                <div key={item.title} className="min-h-[160px] rounded-xl border p-5" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <EmeraldIcon icon={item.icon} />
                  <h3 className="mt-4 font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.74)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="operations">
          <ChampagneCard>
            <SectionHeading eyebrow="Operations" title="Maintenance & Operations" text="Every action has an approval path, visible owner updates, and clean maintenance records." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {operationsItems.map((item) => (
                <div key={item.title} className="min-h-[150px] rounded-xl border p-5" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <h3 className="font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.74)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="workflow">
          <ChampagneCard>
            <SectionHeading eyebrow="Workflow" title="Management Workflow" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              {workflow.map((step, index) => (
                <div key={step.label} className="flex min-h-[148px] flex-col items-center justify-center rounded-xl border p-4 text-center" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <NumberBadge value={index + 1} />
                  <EmeraldIcon icon={step.icon} />
                  <p className="mt-3 text-sm font-semibold leading-tight" style={{ color: INK }}>{step.label}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="reporting">
          <ChampagneCard>
            <SectionHeading eyebrow="Transparency" title="Reporting & Transparency" text="The reporting structure keeps owners informed without chasing fragmented updates." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {reporting.map((item, index) => (
                <div key={item} className="flex min-h-[72px] items-center gap-4 rounded-xl border p-4" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <NumberBadge value={index + 1} />
                  <p className="font-semibold" style={{ color: INK }}>{item}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="trust">
          <ChampagneCard>
            <SectionHeading eyebrow="Governance" title="Trust & Governance" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {trustSignals.map((item) => (
                <div key={item.title} className="min-h-[210px] rounded-xl border p-5 text-center" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <EmeraldIcon icon={item.icon} large />
                  <h3 className="mt-4 font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.74)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="fees">
          <ChampagneCard>
            <SectionHeading eyebrow="Fees" title="Service Fees & Structure" text="Fees are tailored after asset review, property type, portfolio size, occupancy position, and required service scope are confirmed." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {["Performance-aware structure", "Transparent terms", "Portfolio-scaled packages"].map((item, index) => (
                <div key={item} className="min-h-[140px] rounded-xl border p-5 text-center" style={{ background: "#FDFBF7", borderColor: "rgba(184,149,85,0.35)" }}>
                  <NumberBadge value={index + 1} />
                  <p className="mt-4 text-sm font-semibold" style={{ color: INK }}>{item}</p>
                </div>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <section className="py-10 md:py-14">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl shadow-[0_16px_42px_-26px_rgba(6,78,59,0.46)]">
              <CombinedContactNewsletter
                title="Ready to Get Started With Property Management?"
                subtitle="Tell us about your asset and our property management team will prepare the right operating scope and proposal path."
              />
            </div>
          </div>
        </section>

        <Section id="proposal">
          <ConsultationRequestForm
            title="Request a Property Management Proposal"
            subtitle="Use the approved consultation form and our team will route your request to the property management desk."
            serviceOptions={managementServices}
            defaultServiceNeeded="Full Property Management"
            messagePlaceholder="Tell us the property type, area, occupancy status, and what you need managed."
            formSource="property-management-proposal"
            className="max-w-4xl"
          />
        </Section>

        <Section id="faq" className="pb-16 md:pb-20">
          <ChampagneCard className="overflow-hidden p-0">
            <div className="px-6 py-7 md:px-8">
              <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
            </div>
            <Accordion type="single" collapsible className="space-y-3 px-4 pb-5 md:px-6 md:pb-7">
              {faqData.map((faq, index) => (
                <AccordionItem key={faq.q} value={`faq-${index}`} className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(184,149,85,0.38)", background: "#FDFBF7" }}>
                  <AccordionTrigger
                    data-pm-faq-trigger
                    className="min-h-[64px] px-5 py-4 text-left font-semibold hover:no-underline"
                    style={{ color: INK, WebkitTextFillColor: INK }}
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5 pt-0">
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.76)", WebkitTextFillColor: "rgba(26,26,26,0.76)" }}>{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ChampagneCard>
        </Section>
      </main>
    </div>
  );
}