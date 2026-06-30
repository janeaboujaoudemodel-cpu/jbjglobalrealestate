import {
  Building2, Users, Wrench, FileText, CheckCircle2, ArrowRight,
  Phone, Clock, ClipboardList, Home, Key, Shield, Calendar,
  BarChart3, MessageSquare, RefreshCw, Settings, Briefcase,
  Scale, Eye, DollarSign, UserCheck, Hammer, BookOpen,
  ChevronRight, Sparkles, MapPin, Send, TrendingUp,
  Award, Star, Globe, Percent, Timer, Headphones,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/ui/section-divider";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { scrollToId } from "@/lib/scroll";

const scrollTo = (id: string) => scrollToId(id);

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
  { id: "consultation", label: "Request Consultation" },
];

const onboardingSteps = [
  { step: 1, title: "Asset Review & Valuation", icon: Eye, desc: "Comprehensive review of your property portfolio and market positioning" },
  { step: 2, title: "Property Inspection", icon: ClipboardList, desc: "On-site condition assessment with detailed photographic documentation" },
  { step: 3, title: "Management Agreement", icon: FileText, desc: "Clear terms, fee structures, and authorization thresholds" },
  { step: 4, title: "Documentation Collection", icon: BookOpen, desc: "Title deeds, existing contracts, and compliance records" },
  { step: 5, title: "Market Strategy Activation", icon: BarChart3, desc: "Competitive pricing analysis and marketing channel activation" },
  { step: 6, title: "Tenant Placement or Transition", icon: UserCheck, desc: "Tenant screening, contract execution, and seamless handover" },
  { step: 7, title: "Reporting Initiation", icon: Send, desc: "Monthly reporting cycle begins with your dedicated manager" },
];

const leasingSteps = [
  { title: "Market Assessment", desc: "Area benchmarking and competitive analysis" },
  { title: "Pricing Strategy", desc: "Data-driven rental rate optimization" },
  { title: "Professional Photography & Listing", desc: "Multi-platform exposure across portals" },
  { title: "Tenant Screening", desc: "Background, credit, and reference verification" },
  { title: "Contract Drafting", desc: "RERA-compliant tenancy agreements" },
  { title: "Ejari Registration (Dubai)", desc: "Official tenancy contract registration" },
  { title: "Handover Documentation", desc: "Condition reports and key handover protocol" },
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
    icon: Key, title: "Leasing & Placement",
    items: ["Market-rate pricing analysis", "Multi-channel tenant sourcing", "Background & credit screening", "Ejari registration & contract execution"],
  },
  {
    icon: Wrench, title: "Maintenance & Operations",
    items: ["24/7 emergency coordination", "Preventive maintenance scheduling", "Vetted vendor management", "Cost-approved repair protocols"],
  },
  {
    icon: DollarSign, title: "Financial Reporting",
    items: ["Monthly income/expense statements", "Rent collection & follow-up", "Service charge monitoring", "Annual tax-ready summaries"],
  },
  {
    icon: Users, title: "Tenant Management",
    items: ["Move-in/move-out inspections", "Tenant communication management", "Complaint resolution protocols", "Satisfaction surveys & retention"],
  },
  {
    icon: RefreshCw, title: "Renewals & Retention",
    items: ["Lease expiry tracking & alerts", "Market-rate renewal negotiations", "Retention incentive strategies", "Seamless contract transitions"],
  },
  {
    icon: Scale, title: "Compliance & Governance",
    items: ["RERA regulatory alignment", "DLD reporting requirements", "Insurance & liability management", "Legal coordination with licensed firms"],
  },
];

const faqData = [
  { q: "Do you collect rent on my behalf?", a: "Yes. Rent collection, follow-up, and deposit management are included as part of our financial management services, with structured reporting provided to owners." },
  { q: "Do I lose control of my property decisions?", a: "No. You define the approval thresholds. All expenditures above your set limit require explicit authorization before proceeding." },
  { q: "Can you manage vacant units?", a: "Yes. We coordinate property readiness, repairs, professional photography, and multi-channel marketing for vacant units." },
  { q: "Do you handle maintenance directly?", a: "We coordinate with qualified, vetted vendors. All work is performed by licensed professionals with transparent cost approvals." },
  { q: "How are urgent issues handled?", a: "Urgent matters trigger our 24/7 emergency protocol with immediate escalation and clear options presented for your approval." },
  { q: "Can I see monthly activity reports?", a: "Yes. Owners receive structured monthly financial summaries, maintenance logs, occupancy reports, and tenant status updates." },
  { q: "Can I terminate the service?", a: "Offboarding terms are clearly defined in the management agreement with transparent exit procedures." },
  { q: "Is this the same as brokerage?", a: "No. Property management is an ongoing operational service, separate from sales or leasing brokerage transactions." },
];

const trustSignals = [
  { icon: Award, title: "RERA Licensed", desc: "Fully licensed property management under Dubai Real Estate Regulatory Agency" },
  { icon: Shield, title: "Insured Operations", desc: "Professional indemnity and liability coverage for all managed assets" },
  { icon: Globe, title: "Multi-Emirate Coverage", desc: "Operational presence across Dubai, Abu Dhabi, and Northern Emirates" },
  { icon: Headphones, title: "Dedicated Manager", desc: "Single point of contact assigned to every property portfolio" },
];

/* ─── Section wrapper ─── */
const Section = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`scroll-mt-24 py-14 md:py-20 ${className}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

/* ─── Monochrome card ─── */
const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>{children}</div>
);

/* ─── Section heading — solid foreground, optional eyebrow ─── */
const SectionHeading = ({ children, centered = false, eyebrow }: { children: React.ReactNode; centered?: boolean; eyebrow?: string }) => (
  <div className={`mb-8 ${centered ? "text-center" : ""}`}>
    {eyebrow && (
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">{eyebrow}</div>
    )}
    <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-foreground">
      {children}
    </h2>
  </div>
);

const BulletList = ({ items, icon: Icon = CheckCircle2 }: { items: string[]; icon?: any }) => (
  <ul className="space-y-3">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-foreground/85 leading-relaxed">
        <Icon className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/* ═══════════════════════════════════════════ */

const PropertyManagement = () => {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", propertyType: "", location: "", notes: "",
  });

  return (
    <div data-marketing-page>
      <SEOHead
        title="Property Management & Asset Stewardship | JBJ Global Real Estate"
        description="Comprehensive property management for residential, commercial and investment properties in the UAE. Structured oversight, financial accountability, and regulatory compliance."
        canonicalPath="/services/property-management"
      />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
                        <SectionEyebrow icon={Building2} className="mb-6">Property Management</SectionEyebrow>

            <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-5 tracking-[-0.025em]">
              Property Management &<br className="hidden sm:block" /> Asset Stewardship
            </h1>

            <p className="text-foreground text-base sm:text-lg md:text-xl font-semibold mb-3 max-w-2xl mx-auto tracking-tight">
              Structured. Transparent. Performance-Driven.
            </p>

            <p className="text-muted-foreground text-[0.95rem] sm:text-base md:text-lg font-normal max-w-2xl mx-auto leading-relaxed sm:leading-[1.65] mb-8">
              Comprehensive management solutions designed to protect, optimize, and enhance the value of your real estate assets across the UAE.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/contact?service=property-management">Request Management Proposal</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Schedule Asset Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BODY ═══ */}
      <div className="bg-background">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* ═══ 2. TABLE OF CONTENTS ═══ */}
        <section className="py-12 md:py-16 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Table of Contents
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tocSections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted hover:border-foreground/30 transition-all text-sm text-foreground flex items-center gap-2 group"
                >
                  <span className="text-muted-foreground font-semibold text-xs">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. MANAGEMENT OVERVIEW ═══ */}
        <Section id="overview">
          <SectionHeading>Management Overview</SectionHeading>
          <div>
            <p className="text-foreground/85 leading-relaxed mb-8 text-lg">
              We provide full-spectrum property management for individual investors, portfolio owners, family offices, overseas investors, and corporate property owners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CCard>
                <h3 className="font-semibold text-foreground mb-4 text-lg">Clients We Serve</h3>
                <BulletList icon={Users} items={[
                  "Individual & portfolio investors",
                  "Family offices & trusts",
                  "Overseas & diaspora investors",
                  "Corporate property owners",
                  "Institutional asset holders",
                ]} />
              </CCard>
              <CCard>
                <h3 className="font-semibold text-foreground mb-4 text-lg">Designed to Ensure</h3>
                <BulletList items={[
                  "Revenue optimization & yield protection",
                  "Tenant quality control & retention",
                  "Maintenance efficiency & cost control",
                  "Full legal & regulatory compliance",
                  "Risk mitigation & asset preservation",
                ]} />
              </CCard>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ 4. PERFORMANCE STATS ═══ */}
        <Section id="stats">
          <SectionHeading centered>Performance Metrics</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {performanceStats.map((stat, i) => (
              <div key={i}
                className="text-center p-5 rounded-xl bg-card border border-border hover:border-foreground/30 transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-foreground" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ 5. SERVICE MODULES GRID ═══ */}
        <Section id="residential">
          <SectionHeading>Core Service Modules</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceModules.map((mod, i) => (
              <CCard key={i} className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                    <mod.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{mod.title}</h3>
                </div>
                <ul className="space-y-2">
                  {mod.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground/85">
                      <CheckCircle2 className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CCard>
            ))}
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ RESIDENTIAL + COMMERCIAL DETAIL ═══ */}
        <Section id="commercial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <SectionHeading>Residential Management</SectionHeading>
              <CCard>
                <h3 className="font-semibold text-foreground mb-4 text-lg">Services Include</h3>
                <BulletList items={[
                  "Tenant marketing & screening",
                  "Lease preparation & renewals",
                  "Move-in / move-out inspections",
                  "Rent collection & follow-up",
                  "Maintenance coordination",
                  "Service charge monitoring",
                  "Condition reporting",
                ]} />
              </CCard>
              <div className="flex items-start gap-3 p-4 mt-4 rounded-xl bg-muted border border-border">
                <Shield className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  We follow RERA-compliant procedures in Dubai and applicable regulations across the UAE.
                </p>
              </div>
            </div>
            <div>
              <SectionHeading>Commercial Management</SectionHeading>
              <CCard>
                <h3 className="font-semibold text-foreground mb-4 text-lg">Services Include</h3>
                <BulletList items={[
                  "Commercial leasing strategy",
                  "Tenant retention planning",
                  "Contract negotiation support",
                  "Property performance analysis",
                  "Maintenance oversight",
                  "Compliance monitoring",
                ]} />
              </CCard>
              <p className="text-muted-foreground text-sm leading-relaxed mt-4">
                Financial reporting aligned with commercial tenancy laws. Structured approach ensures operational transparency and performance accountability.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ LEASING WORKFLOW ═══ */}
        <Section id="leasing">
          <SectionHeading>Leasing & Tenant Placement</SectionHeading>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-5">
              {leasingSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-5 pl-1">
                  <div className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10">
                    <span className="text-foreground font-bold text-sm">{i + 1}</span>
                  </div>
                  <CCard className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CCard>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-muted border border-border max-w-3xl mx-auto">
            <Scale className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              All tenancy registrations are processed in accordance with relevant local authority regulations.
            </p>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ FINANCIAL ═══ */}
        <Section id="financial">
          <SectionHeading>Financial Management</SectionHeading>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { icon: DollarSign, label: "Rent collection & follow-up", desc: "Automated tracking with escalation protocols" },
                { icon: Shield, label: "Escrow tracking", desc: "Where applicable per regulatory requirements" },
                { icon: ClipboardList, label: "Expense management", desc: "Categorized and approved expenditures" },
                { icon: BarChart3, label: "Service charge monitoring", desc: "Benchmarked against community averages" },
                { icon: Briefcase, label: "Vendor payments", desc: "Timely processing with full documentation" },
                { icon: Calendar, label: "Annual income summary", desc: "Tax-ready consolidated reports" },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-card border border-border hover:border-foreground/30 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">{item.label}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground pl-12">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border border-border">
              <Eye className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Financial transparency is maintained through structured reporting and owner-accessible documentation.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ MAINTENANCE ═══ */}
        <Section id="maintenance">
          <SectionHeading>Maintenance & Operations</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CCard>
              <h3 className="font-semibold text-foreground mb-4">Preventive Maintenance</h3>
              <BulletList items={[
                "Scheduled HVAC, plumbing, and electrical inspections",
                "Annual property condition assessments",
                "Common area and amenity upkeep coordination",
                "Warranty tracking and claims management",
              ]} />
            </CCard>
            <CCard>
              <h3 className="font-semibold text-foreground mb-4">Reactive & Emergency</h3>
              <BulletList items={[
                "24/7 emergency response coordination",
                "Vetted vendor dispatch within SLA targets",
                "Cost-approved repair protocols with owner thresholds",
                "Incident documentation and follow-up reporting",
              ]} />
            </CCard>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ TENANT MANAGEMENT ═══ */}
        <Section id="tenant-mgmt">
          <SectionHeading>Tenant Management</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CCard>
              <h3 className="font-semibold text-foreground mb-4">Communication & Relations</h3>
              <BulletList items={[
                "Dedicated tenant communication portal",
                "Complaint resolution protocols with SLA tracking",
                "Move-in orientation and property guidelines",
                "Regular satisfaction surveys",
              ]} />
            </CCard>
            <CCard>
              <h3 className="font-semibold text-foreground mb-4">Inspections & Compliance</h3>
              <BulletList items={[
                "Scheduled mid-tenancy inspections",
                "Move-out condition assessments",
                "Security deposit reconciliation",
                "Damage documentation and recovery",
              ]} />
            </CCard>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ RENEWALS ═══ */}
        <Section id="renewals">
          <SectionHeading>Renewals & Retention Strategy</SectionHeading>
          <CCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Proactive Tracking</h4>
                <p className="text-sm text-muted-foreground">Automated lease expiry alerts 90 days before renewal date with market rate comparisons.</p>
              </div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Market-Rate Negotiation</h4>
                <p className="text-sm text-muted-foreground">Data-driven renewal terms based on current market conditions and RERA rental index.</p>
              </div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
                  <UserCheck className="w-5 h-5 text-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Retention Programs</h4>
                <p className="text-sm text-muted-foreground">Targeted retention incentives for high-quality tenants to minimize vacancy periods.</p>
              </div>
            </div>
          </CCard>
        </Section>

        <SectionDivider />

        {/* ═══ COMPLIANCE ═══ */}
        <Section id="compliance">
          <SectionHeading>Compliance & Governance</SectionHeading>
          <div>
            <p className="text-foreground/85 mb-6 leading-relaxed">We operate in alignment with:</p>
            <CCard className="mb-6">
              <BulletList icon={Scale} items={[
                "Dubai Land Department (DLD) requirements",
                "RERA regulations and licensing standards",
                "Tenancy Law (Dubai Law No. 26 of 2007 and amendments)",
                "UAE Civil Code provisions governing lease agreements",
                "ADGM and DIFC regulatory frameworks (where applicable)",
              ]} />
            </CCard>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted border border-border">
              <Shield className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                We do not provide legal representation but coordinate with licensed legal professionals when required.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ WORKFLOW ═══ */}
        <Section id="workflow">
          <SectionHeading centered>Management Workflow</SectionHeading>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {[
                { icon: Eye, label: "Asset\nAssessment" },
                { icon: FileText, label: "Agreement\nExecution" },
                { icon: Key, label: "Tenant\nPlacement" },
                { icon: Settings, label: "Ongoing\nManagement" },
                { icon: BarChart3, label: "Reporting\n& Review" },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="flex items-center w-full">
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-card border-2 border-border flex items-center justify-center mb-3">
                        <step.icon className="w-7 h-7 text-foreground" />
                      </div>
                      <p className="text-xs font-semibold text-foreground text-center whitespace-pre-line">{step.label}</p>
                    </div>
                    {i < 4 && (
                      <ArrowRight className="w-5 h-5 text-muted-foreground hidden md:block shrink-0 -mt-6" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-muted border border-border text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Continuous cycle.</strong> Each phase feeds into the next with monthly performance reviews and strategy adjustments.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ REPORTING ═══ */}
        <Section id="reporting">
          <SectionHeading>Reporting & Transparency</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: "Monthly Financial Summary", desc: "Income, expenses, and net position with variance analysis." },
              { icon: Wrench, title: "Maintenance Log", desc: "Dates, issue types, status, vendor notes, and cost breakdowns." },
              { icon: UserCheck, title: "Tenant Status Updates", desc: "Occupancy, communications, compliance, and satisfaction scores." },
              { icon: RefreshCw, title: "Lease Renewal Alerts", desc: "Key dates, renewal recommendations, and market comparisons." },
              { icon: Eye, title: "Occupancy Performance", desc: "Utilization rates, vacancy duration, and market positioning." },
              { icon: TrendingUp, title: "Annual Portfolio Review", desc: "Year-over-year performance, ROI analysis, and strategic outlook." },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border hover:border-foreground/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ ONBOARDING ═══ */}
        <Section id="onboarding">
          <SectionHeading>Management Onboarding Process</SectionHeading>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-5">
              {onboardingSteps.map((s) => (
                <div key={s.step} className="flex items-start gap-5 pl-1">
                  <div className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10">
                    <span className="text-foreground font-bold text-sm">{s.step}</span>
                  </div>
                  <CCard className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <s.icon className="w-5 h-5 text-foreground shrink-0" />
                      <h4 className="font-semibold text-foreground">{s.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">{s.desc}</p>
                  </CCard>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ TRUST SIGNALS ═══ */}
        <Section id="trust">
          <SectionHeading centered>Trust & Credentials</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustSignals.map((item, i) => (
              <div key={i}
                className="text-center p-6 rounded-xl bg-card border border-border hover:border-foreground/30 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider />

        {/* ═══ FEES ═══ */}
        <Section id="fees">
          <SectionHeading>Service Fees & Structure</SectionHeading>
          <CCard className="p-8">
            <p className="text-foreground/85 leading-relaxed text-lg mb-4">
              Management fees are structured based on property type, asset size, and scope of service. A tailored proposal is issued following asset evaluation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <Percent className="w-5 h-5 text-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">Performance-Based</p>
                <p className="text-xs text-muted-foreground mt-1">Fees tied to occupancy and collection performance</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <FileText className="w-5 h-5 text-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">Transparent Terms</p>
                <p className="text-xs text-muted-foreground mt-1">No hidden charges or undisclosed markups</p>
              </div>
              <div className="p-4 rounded-lg bg-card border border-border text-center">
                <Settings className="w-5 h-5 text-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">Custom Packages</p>
                <p className="text-xs text-muted-foreground mt-1">Scaled to your portfolio requirements</p>
              </div>
            </div>
          </CCard>
        </Section>

        <SectionDivider />

        {/* ═══ FAQ ═══ */}
        <Section id="faq">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-foreground hover:no-underline font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <SectionDivider />

        {/* ═══ CTA / CONSULTATION ═══ */}
        <Section id="consultation">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-[-0.02em]">
              Entrust Your Asset to Structured Management
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Request a tailored management proposal or speak directly with a property manager.
            </p>
          </div>

          <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
                <Input placeholder="Your full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
                <Input placeholder="+971 ..." value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Property Type</label>
                <Input placeholder="Residential / Commercial" value={formData.propertyType} onChange={e => setFormData(p => ({ ...p, propertyType: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                <Input placeholder="Dubai, Abu Dhabi..." value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium text-foreground mb-1 block">Additional Notes</label>
              <textarea
                placeholder="Describe your property or management requirements..."
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-md px-3 py-2 text-sm bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring min-h-[100px] resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1">Request Proposal</Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/contact">Book Consultation</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/contact?service=property-management">Speak to Property Manager</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Submission does not constitute a service agreement. A dedicated property manager will contact you to discuss your requirements.
            </p>
          </div>
        </Section>

          </div>{/* close rounded card */}
        </div>{/* close max-w container */}
      </div>{/* close bg-background */}
    </div>
  );
};

export default PropertyManagement;
