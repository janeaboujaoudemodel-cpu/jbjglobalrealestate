import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
import { SEOHead } from "@/components/SEOHead";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Eye,
  FileText,
  Globe,
  Headphones,
  Key,
  Percent,
  RefreshCw,
  Scale,
  Settings,
  Shield,
  Star,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { scrollToId } from "@/lib/scroll";

const scrollTo = (id: string) => scrollToId(id);

const INK = "#1A1A1A";
const EMERALD = "#064E3B";
const EMERALD_DARK = "#042c1c";
const BLACK = "#000000";
const CHAMPAGNE = "#F7F2EA";
const CHAMPAGNE_RAISED = "#FFFDF8";
const WHITE = "#FFFFFF";
const EMERALD_GRADIENT = `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DARK} 58%, ${BLACK} 100%)`;

const tocSections = [
  { id: "overview", label: "Management Overview" },
  { id: "stats", label: "Performance Metrics" },
  { id: "residential", label: "Residential Management" },
  { id: "commercial", label: "Commercial Management" },
  { id: "leasing", label: "Leasing & Tenant Placement" },
  { id: "financial", label: "Financial Management" },
  { id: "maintenance", label: "Maintenance & Operations" },
  { id: "tenant-mgmt", label: "Tenant Management" },
  { id: "renewals", label: "Renewals & Retention" },
  { id: "compliance", label: "Compliance & Governance" },
  { id: "workflow", label: "Management Workflow" },
  { id: "reporting", label: "Reporting & Transparency" },
  { id: "onboarding", label: "Onboarding Process" },
  { id: "trust", label: "Trust & Credentials" },
  { id: "fees", label: "Service Fees" },
  { id: "faq", label: "Questions" },
];

const performanceStats = [
  { value: "98%", label: "Rent Collection Rate", icon: DollarSign },
  { value: "<24h", label: "Emergency Response", icon: Timer },
  { value: "95%", label: "Tenant Retention", icon: Users },
  { value: "100%", label: "Regulatory Compliance", icon: Shield },
  { value: "4.9/5", label: "Owner Satisfaction", icon: Star },
  { value: "500+", label: "Units Managed", icon: Building2 },
];

const serviceModules = [
  {
    icon: Key,
    title: "Leasing & Placement",
    items: ["Market-rate pricing analysis", "Multi-channel tenant sourcing", "Background & credit screening", "Ejari registration & contract execution"],
  },
  {
    icon: Wrench,
    title: "Maintenance & Operations",
    items: ["24/7 emergency coordination", "Preventive maintenance scheduling", "Vetted vendor management", "Cost-approved repair protocols"],
  },
  {
    icon: DollarSign,
    title: "Financial Reporting",
    items: ["Monthly income/expense statements", "Rent collection & follow-up", "Service charge monitoring", "Annual tax-ready summaries"],
  },
  {
    icon: Users,
    title: "Tenant Management",
    items: ["Move-in/move-out inspections", "Tenant communication management", "Complaint resolution protocols", "Satisfaction surveys & retention"],
  },
  {
    icon: RefreshCw,
    title: "Renewals & Retention",
    items: ["Lease expiry tracking & alerts", "Market-rate renewal negotiations", "Retention incentive strategies", "Seamless contract transitions"],
  },
  {
    icon: Scale,
    title: "Compliance & Governance",
    items: ["RERA regulatory alignment", "DLD reporting requirements", "Insurance & liability management", "Legal coordination with licensed firms"],
  },
];

const leasingSteps = [
  { title: "Market Assessment", desc: "Area benchmarking and competitive analysis" },
  { title: "Pricing Strategy", desc: "Data-driven rental rate optimization" },
  { title: "Professional Photography & Listing", desc: "Multi-platform exposure across portals" },
  { title: "Tenant Screening", desc: "Background, credit, and reference verification" },
  { title: "Contract Drafting", desc: "RERA-compliant tenancy agreements" },
  { title: "Ejari Registration", desc: "Official tenancy contract registration" },
  { title: "Handover Documentation", desc: "Condition reports and key handover protocol" },
];

const onboardingSteps = [
  { step: 1, title: "Asset Review & Valuation", icon: Eye, desc: "Portfolio review, condition check, market position and management scope." },
  { step: 2, title: "Property Inspection", icon: ClipboardList, desc: "On-site assessment with photo documentation and maintenance priorities." },
  { step: 3, title: "Management Agreement", icon: FileText, desc: "Clear service levels, approval thresholds, fee structure and reporting cadence." },
  { step: 4, title: "Documentation Collection", icon: BookOpen, desc: "Title deeds, contracts, service charge records and compliance documents." },
  { step: 5, title: "Market Strategy Activation", icon: BarChart3, desc: "Pricing, presentation, listing distribution and tenant sourcing plan." },
  { step: 6, title: "Tenant Placement or Transition", icon: UserCheck, desc: "Screening, contract execution, handover and tenant communication setup." },
  { step: 7, title: "Reporting Initiation", icon: Calendar, desc: "Monthly activity, finance, maintenance and occupancy reporting begins." },
];

const financeItems = [
  { icon: DollarSign, label: "Rent collection & follow-up", desc: "Automated tracking with escalation protocols." },
  { icon: Shield, label: "Escrow tracking", desc: "Where applicable per regulatory requirements." },
  { icon: ClipboardList, label: "Expense management", desc: "Categorized and approved expenditures." },
  { icon: BarChart3, label: "Service charge monitoring", desc: "Benchmarked against community averages." },
  { icon: Briefcase, label: "Vendor payments", desc: "Timely processing with full documentation." },
  { icon: Calendar, label: "Annual income summary", desc: "Tax-ready consolidated reports." },
];

const reportingItems = [
  { icon: BarChart3, title: "Monthly Financial Summary", desc: "Income, expenses, net position and variance analysis." },
  { icon: Wrench, title: "Maintenance Log", desc: "Issue types, vendor status, cost breakdowns and dates." },
  { icon: UserCheck, title: "Tenant Updates", desc: "Occupancy, communication, compliance and satisfaction status." },
  { icon: RefreshCw, title: "Renewal Alerts", desc: "Key dates, renewal recommendations and market comparisons." },
  { icon: Eye, title: "Occupancy Performance", desc: "Vacancy duration, positioning and utilization rate." },
  { icon: TrendingUp, title: "Portfolio Review", desc: "Year-over-year performance and strategic outlook." },
];

const trustSignals = [
  { icon: Award, title: "RERA Licensed", desc: "Licensed property management operations under Dubai real estate standards." },
  { icon: Shield, title: "Insured Operations", desc: "Professional coverage and documented vendor procedures." },
  { icon: Globe, title: "UAE Coverage", desc: "Management support across Dubai, Abu Dhabi and key emirates." },
  { icon: Headphones, title: "Dedicated Manager", desc: "A single point of contact for every property portfolio." },
];

const faqData = [
  { q: "Do you collect rent on my behalf?", a: "Yes. Rent collection, follow-up, deposit coordination and structured owner reporting are included in the financial management workflow." },
  { q: "Do I lose control of my property decisions?", a: "No. You define approval thresholds. Expenses above your threshold require explicit authorization before work proceeds." },
  { q: "Can you manage vacant units?", a: "Yes. We coordinate readiness, repairs, professional presentation and multi-channel exposure for vacant units." },
  { q: "Do you handle maintenance directly?", a: "We coordinate with qualified, vetted vendors. Work is performed by licensed professionals with transparent cost approvals." },
  { q: "How are urgent issues handled?", a: "Urgent matters trigger a 24/7 escalation protocol with immediate vendor coordination and owner notification." },
  { q: "Can I see monthly activity reports?", a: "Yes. Owners receive monthly financial, maintenance, occupancy and tenant-status summaries." },
  { q: "Can I terminate the service?", a: "Offboarding terms are defined in the management agreement with clear exit procedures." },
  { q: "Is this the same as brokerage?", a: "No. Property management is ongoing operational stewardship, separate from a sales or leasing transaction." },
];

function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-28 py-10 md:py-14 ${className}`}>
      <div data-service-track className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

function SectionHeading({ children, centered = false, eyebrow }: { children: ReactNode; centered?: boolean; eyebrow?: string }) {
  return (
    <div className={`mb-7 ${centered ? "text-center" : ""}`}>
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: EMERALD }}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-semibold leading-tight" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
        {children}
      </h2>
    </div>
  );
}

function ChampagneCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      data-surface="champagne"
      className={`rounded-2xl border p-6 md:p-7 shadow-[0_14px_38px_-28px_rgba(6,78,59,0.42)] ${className}`}
      style={{ background: CHAMPAGNE_RAISED, borderColor: "rgba(6,78,59,0.18)", color: INK }}
    >
      {children}
    </div>
  );
}

function EmeraldIcon({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-full`} style={{ background: EMERALD_GRADIENT, color: WHITE }}>
      <Icon className={iconSize} strokeWidth={2.2} style={{ color: WHITE, stroke: WHITE }} />
    </span>
  );
}

function NumberBadge({ value }: { value: string | number }) {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ background: EMERALD_GRADIENT, color: WHITE, WebkitTextFillColor: WHITE }}
    >
      {value}
    </span>
  );
}

function BulletList({ items, icon: Icon = CheckCircle2 }: { items: string[]; icon?: LucideIcon }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: INK }}>
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: EMERALD }}>
            <Icon className="h-3.5 w-3.5" style={{ color: WHITE, stroke: WHITE }} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CTAButton({ to, children, variant = "solid" }: { to: string; children: ReactNode; variant?: "solid" | "outline" }) {
  return (
    <Link
      to={to}
      data-no-contrast-guard
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
      style={{
        background: variant === "solid" ? EMERALD_GRADIENT : "rgba(255,255,255,0.08)",
        borderColor: variant === "solid" ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.48)",
        color: WHITE,
        WebkitTextFillColor: WHITE,
      }}
    >
      <span style={{ color: WHITE, WebkitTextFillColor: WHITE }}>{children}</span>
      <ArrowRight className="h-4 w-4" style={{ color: WHITE, stroke: WHITE }} />
    </Link>
  );
}

const PropertyManagement = () => {
  return (
    <div data-brand-emerald-page data-service-page="property-management" data-marketing-page style={{ background: CHAMPAGNE }}>
      <SEOHead
        title="Property Management Dubai | JBJ Global Real Estate"
        description="Premium property management in Dubai and the UAE with tenant care, maintenance, financial reporting, compliance, and asset stewardship."
        canonicalPath="/services/property-management"
      />

      <section
        data-brand-hero
        data-surface="emerald"
        data-no-contrast-guard
        className="jj-fullbleed-band relative flex h-[100svh] min-h-[100svh] w-full items-center justify-center overflow-hidden px-0"
        style={{
          background:
            "radial-gradient(110% 72% at 50% 0%, rgba(6,95,70,0.62) 0%, rgba(6,95,70,0) 62%), linear-gradient(180deg, #064E3B 0%, #042c1c 48%, #000000 100%)",
          borderRadius: 0,
          color: WHITE,
          height: "100svh",
          minHeight: "100svh",
        }}
      >
        <div aria-hidden className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "74px 74px" }} />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-5 py-28 text-center sm:px-8 lg:px-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.24)", color: WHITE }}>
            <Building2 className="h-3.5 w-3.5" style={{ color: WHITE, stroke: WHITE }} />
            <span style={{ color: WHITE, WebkitTextFillColor: WHITE }}>Property Management</span>
          </div>

          <h1 className="max-w-[14ch] text-5xl font-light leading-[1.02] sm:text-6xl md:text-7xl lg:text-8xl" style={{ color: WHITE, WebkitTextFillColor: WHITE, fontFamily: '"Cormorant Garamond", serif' }}>
            Property Management & Asset Stewardship
          </h1>

          <div aria-hidden className="my-8 h-px w-24" style={{ background: "rgba(255,255,255,0.42)" }} />

          <p className="text-lg font-light leading-relaxed sm:text-xl md:text-2xl" style={{ color: WHITE, WebkitTextFillColor: WHITE }}>
            Structured. Transparent. Performance-Driven.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: "rgba(255,255,255,0.86)", WebkitTextFillColor: "rgba(255,255,255,0.86)" }}>
            Comprehensive management solutions designed to protect, optimize, and enhance the value of real estate assets across the UAE.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
            <CTAButton to="/contact?service=property-management">Request Management Proposal</CTAButton>
            <CTAButton to="/contact" variant="outline">Schedule Consultation</CTAButton>
          </div>
        </div>
      </section>

      <main data-service-body className="relative" style={{ background: CHAMPAGNE }}>
        <section className="py-12 md:py-16">
          <div data-service-track className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <ChampagneCard className="p-5 md:p-7">
              <h2 className="mb-6 text-center text-2xl font-semibold md:text-3xl" style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}>
                Table of Contents
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tocSections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    data-service-emerald-control
                    onClick={() => scrollTo(section.id)}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold shadow-[0_10px_24px_-18px_rgba(0,0,0,0.42)] transition-transform hover:-translate-y-0.5"
                    style={{ background: EMERALD_GRADIENT, color: WHITE, WebkitTextFillColor: WHITE, border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "rgba(255,255,255,0.16)", color: WHITE, WebkitTextFillColor: WHITE }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-snug" style={{ color: WHITE, WebkitTextFillColor: WHITE }}>{section.label}</span>
                  </button>
                ))}
              </div>
            </ChampagneCard>
          </div>
        </section>

        <Section id="overview">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Management Overview</SectionHeading>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed" style={{ color: INK }}>
              We provide full-spectrum property management for individual investors, portfolio owners, family offices, overseas investors, and corporate property owners.
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ChampagneCard className="h-full bg-white/70">
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Clients We Serve</h3>
                <BulletList icon={Users} items={["Individual & portfolio investors", "Family offices & trusts", "Overseas & diaspora investors", "Corporate property owners", "Institutional asset holders"]} />
              </ChampagneCard>
              <ChampagneCard className="h-full bg-white/70">
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Designed to Ensure</h3>
                <BulletList items={["Revenue optimization & yield protection", "Tenant quality control & retention", "Maintenance efficiency & cost control", "Full legal & regulatory compliance", "Risk mitigation & asset preservation"]} />
              </ChampagneCard>
            </div>
          </ChampagneCard>
        </Section>

        <Section id="stats">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading centered>Performance Metrics</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {performanceStats.map((stat) => (
                <ChampagneCard key={stat.label} className="flex h-full min-h-[168px] flex-col items-center justify-center p-5 text-center">
                  <EmeraldIcon icon={stat.icon} size="lg" />
                  <p className="mt-4 text-3xl font-bold tracking-tight" style={{ color: EMERALD }}>{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>{stat.label}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="residential">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Residential Management</SectionHeading>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Services Include</h3>
                <BulletList items={["Tenant marketing & screening", "Lease preparation & renewals", "Move-in / move-out inspections", "Rent collection & follow-up", "Maintenance coordination", "Service charge monitoring"]} />
              </ChampagneCard>
              <ChampagneCard>
                <div className="flex items-start gap-4">
                  <EmeraldIcon icon={Shield} />
                  <p className="text-base leading-relaxed" style={{ color: INK }}>
                    RERA-compliant procedures, transparent approvals, and documented owner reporting keep residential assets protected without operational guesswork.
                  </p>
                </div>
              </ChampagneCard>
            </div>
          </ChampagneCard>
        </Section>

        <Section id="commercial">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Commercial Management</SectionHeading>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Services Include</h3>
                <BulletList items={["Commercial leasing strategy", "Tenant retention planning", "Contract negotiation support", "Property performance analysis", "Maintenance oversight", "Compliance monitoring"]} />
              </ChampagneCard>
              <ChampagneCard>
                <div className="flex items-start gap-4">
                  <EmeraldIcon icon={Briefcase} />
                  <p className="text-base leading-relaxed" style={{ color: INK }}>
                    Financial reporting is aligned with commercial tenancy requirements, operational transparency, and measurable asset performance.
                  </p>
                </div>
              </ChampagneCard>
            </div>
          </ChampagneCard>
        </Section>

        <Section id="leasing">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Leasing & Tenant Placement</SectionHeading>
            <div className="space-y-4">
              {leasingSteps.map((step, index) => (
                <ChampagneCard key={step.title} className="flex items-start gap-4 p-5">
                  <NumberBadge value={index + 1} />
                  <div>
                    <h3 className="font-semibold" style={{ color: INK }}>{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: INK }}>{step.desc}</p>
                  </div>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="financial">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Financial Management</SectionHeading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {financeItems.map((item) => (
                <ChampagneCard key={item.label} className="min-h-[178px] p-5">
                  <EmeraldIcon icon={item.icon} />
                  <h3 className="mt-4 text-base font-semibold" style={{ color: INK }}>{item.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>{item.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="maintenance">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Maintenance & Operations</SectionHeading>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Preventive Maintenance</h3>
                <BulletList items={["Scheduled HVAC, plumbing and electrical inspections", "Annual property condition assessments", "Common area and amenity coordination", "Warranty tracking and claims management"]} />
              </ChampagneCard>
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Reactive & Emergency</h3>
                <BulletList items={["24/7 emergency response coordination", "Vetted vendor dispatch within SLA targets", "Cost-approved repair protocols", "Incident documentation and follow-up reporting"]} />
              </ChampagneCard>
            </div>
          </ChampagneCard>
        </Section>

        <Section id="tenant-mgmt">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Tenant Management</SectionHeading>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Communication & Relations</h3>
                <BulletList items={["Dedicated tenant communication workflow", "Complaint resolution with SLA tracking", "Move-in orientation and guidelines", "Regular satisfaction surveys"]} />
              </ChampagneCard>
              <ChampagneCard>
                <h3 className="mb-4 text-lg font-semibold" style={{ color: INK }}>Inspections & Compliance</h3>
                <BulletList items={["Scheduled mid-tenancy inspections", "Move-out condition assessments", "Security deposit reconciliation", "Damage documentation and recovery"]} />
              </ChampagneCard>
            </div>
          </ChampagneCard>
        </Section>

        <Section id="renewals">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Renewals & Retention Strategy</SectionHeading>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[{ icon: Calendar, title: "Proactive Tracking", desc: "Lease expiry alerts with market-rate comparisons." }, { icon: TrendingUp, title: "Market Negotiation", desc: "Renewal terms based on current market conditions." }, { icon: UserCheck, title: "Retention Programs", desc: "Retention incentives for high-quality tenants." }].map((item) => (
                <ChampagneCard key={item.title} className="min-h-[190px]">
                  <EmeraldIcon icon={item.icon} />
                  <h3 className="mt-4 font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>{item.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="compliance">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Compliance & Governance</SectionHeading>
            <ChampagneCard>
              <BulletList icon={Scale} items={["Dubai Land Department requirements", "RERA regulations and licensing standards", "Tenancy Law alignment", "UAE Civil Code lease provisions", "Legal coordination through licensed firms when required"]} />
            </ChampagneCard>
          </ChampagneCard>
        </Section>

        <Section id="workflow">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading centered>Management Workflow</SectionHeading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {[{ icon: Eye, label: "Asset Assessment" }, { icon: FileText, label: "Agreement Execution" }, { icon: Key, label: "Tenant Placement" }, { icon: Settings, label: "Ongoing Management" }, { icon: BarChart3, label: "Reporting & Review" }].map((step) => (
                <ChampagneCard key={step.label} className="flex min-h-[150px] flex-col items-center justify-center p-4 text-center">
                  <EmeraldIcon icon={step.icon} />
                  <p className="mt-3 text-sm font-semibold leading-snug" style={{ color: INK }}>{step.label}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="reporting">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Reporting & Transparency</SectionHeading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportingItems.map((item) => (
                <ChampagneCard key={item.title} className="min-h-[178px] p-5">
                  <EmeraldIcon icon={item.icon} />
                  <h3 className="mt-4 text-base font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>{item.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="onboarding">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Management Onboarding Process</SectionHeading>
            <div className="space-y-4">
              {onboardingSteps.map((step) => (
                <ChampagneCard key={step.step} className="flex items-start gap-4 p-5">
                  <NumberBadge value={step.step} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <EmeraldIcon icon={step.icon} size="sm" />
                      <h3 className="font-semibold" style={{ color: INK }}>{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>{step.desc}</p>
                  </div>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="trust">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading centered>Trust & Credentials</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustSignals.map((item) => (
                <ChampagneCard key={item.title} className="min-h-[210px] p-5 text-center">
                  <EmeraldIcon icon={item.icon} size="lg" />
                  <h3 className="mt-4 font-semibold" style={{ color: INK }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: INK }}>{item.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="fees">
          <ChampagneCard className="p-7 md:p-10">
            <SectionHeading>Service Fees & Structure</SectionHeading>
            <p className="mb-6 text-lg leading-relaxed" style={{ color: INK }}>
              Management fees are structured based on property type, asset size, and scope of service. A tailored proposal is issued following asset evaluation.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[{ icon: Percent, title: "Performance-Based", desc: "Fees aligned to occupancy and collection performance." }, { icon: FileText, title: "Transparent Terms", desc: "No hidden charges or undisclosed markups." }, { icon: Settings, title: "Custom Packages", desc: "Scaled to your portfolio requirements." }].map((item) => (
                <ChampagneCard key={item.title} className="min-h-[170px] p-5 text-center">
                  <EmeraldIcon icon={item.icon} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: INK }}>{item.title}</p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: INK }}>{item.desc}</p>
                </ChampagneCard>
              ))}
            </div>
          </ChampagneCard>
        </Section>

        <Section id="faq">
          <ChampagneCard className="overflow-hidden p-0">
            <div className="px-6 py-7 md:px-10 md:py-9">
              <SectionHeading>Frequently Asked Questions</SectionHeading>
            </div>
            <Accordion type="single" collapsible className="divide-y" style={{ borderColor: "rgba(6,78,59,0.16)" }}>
              {faqData.map((faq, index) => (
                <AccordionItem key={faq.q} value={`faq-${index}`} className="border-0 px-0">
                  <AccordionTrigger
                    className="min-h-[64px] px-6 py-4 text-left font-semibold hover:no-underline md:px-10"
                    style={{ color: INK, WebkitTextFillColor: INK }}
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 md:px-10">
                    <p className="text-sm leading-relaxed" style={{ color: INK }}>{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ChampagneCard>
        </Section>

        <section id="consultation" className="scroll-mt-28 py-12 md:py-16">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl shadow-[0_16px_42px_-26px_rgba(6,78,59,0.46)]">
              <CombinedContactNewsletter
                title="Ready to Put Your Asset Under Structured Management?"
                subtitle="Speak with our property management team for a tailored proposal, service scope, and owner reporting plan."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PropertyManagement;