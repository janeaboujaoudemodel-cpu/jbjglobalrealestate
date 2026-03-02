import {
  Building2, Users, Wrench, FileText, CheckCircle2, ArrowRight,
  Phone, Clock, ClipboardList, Home, Key, Shield, Calendar,
  BarChart3, MessageSquare, RefreshCw, Settings, Briefcase,
  Scale, Eye, DollarSign, UserCheck, Hammer, BookOpen,
  ChevronRight, Sparkles, MapPin, Send, TrendingUp,
  Award, Star, Globe, Percent, Timer, Headphones,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { SectionDivider } from "@/components/ui/section-divider";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
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

/* ─── Page-level champagne background ─── */
const pageBg = "bg-gradient-to-br from-[#FDFBF7] via-[#F8F3EA] to-[#F0E8D8]";

/* ─── Section wrapper ─── */
const Section = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`scroll-mt-24 py-14 md:py-20 ${className}`}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

/* ─── Champagne Card ─── */
const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

/* ─── Section heading — gold first word, dark rest ─── */
const SectionHeading = ({ children, centered = false }: { children: string; centered?: boolean }) => {
  const words = children.split(" ");
  const first = words[0];
  const rest = words.slice(1).join(" ");
  return (
    <h2
      className={`text-3xl md:text-4xl font-bold mb-8 ${centered ? "text-center" : ""}`}
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      <span className="text-[#C8A766]">{first}</span>
      {rest && <span className="text-[#1a1714] ml-2">{rest}</span>}
    </h2>
  );
};

const BulletList = ({ items, icon: Icon = CheckCircle2 }: { items: string[]; icon?: any }) => (
  <ul className="space-y-3">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-[#3d3529] leading-relaxed">
        <Icon className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
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
    <>
      <SEOHead
        title="Property Management & Asset Stewardship | JBJ Global Real Estate"
        description="Comprehensive property management for residential, commercial and investment properties in the UAE. Structured oversight, financial accountability, and regulatory compliance."
        canonicalPath="/services/property-management"
      />

      {/* ═══ 1. HERO ═══ */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1714] to-[#151210]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#C8A766]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-[#C8A766]/40 bg-black/30 backdrop-blur-md">
              <Building2 className="w-4 h-4 text-[#C8A766]" />
              <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Property Management</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]" style={{ fontFamily: "Playfair Display, serif" }}>
              Property Management &<br className="hidden sm:block" /> Asset Stewardship
            </h1>

            <p className="text-[#C8A766]/80 text-lg md:text-xl font-medium mb-4 max-w-2xl mx-auto" style={{ fontFamily: "Playfair Display, serif" }}>
              Structured. Transparent. Performance-Driven.
            </p>

            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Comprehensive management solutions designed to protect, optimize, and enhance the value of your real estate assets across the UAE.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=property-management">
                Request Management Proposal
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Schedule Asset Consultation
              </PremiumHeroButton>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[#C8A766]/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#C8A766]/60 to-transparent" />
        </div>
      </section>

      {/* ═══ CHAMPAGNE BODY ═══ */}
      <SectionDivider />

      <div className={pageBg}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="bg-white/70 backdrop-blur-sm border border-[#C8A766]/20 rounded-2xl shadow-[0_4px_30px_rgba(200,167,102,0.08)] overflow-hidden">

        {/* ═══ 2. TABLE OF CONTENTS ═══ */}
        <section className="py-12 md:py-16 border-b border-[#C8A766]/15">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#1a1714] mb-8 text-center" style={{ fontFamily: "Playfair Display, serif" }}>
              <span className="text-[#C8A766]">Table</span> of Contents
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tocSections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left px-4 py-3 rounded-xl border border-[#C8A766]/25 bg-white/60 hover:bg-white hover:border-[#C8A766]/50 hover:shadow-md transition-all text-sm text-[#3d3529] flex items-center gap-2 group"
                >
                  <span className="text-[#C8A766] font-semibold text-xs">{String(i + 1).padStart(2, "0")}</span>
                  <span className="group-hover:text-[#1a1714] transition-colors">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ 3. MANAGEMENT OVERVIEW ═══ */}
        <Section id="overview">
          <SectionHeading>Management Overview</SectionHeading>
          <div>
            <p className="text-[#3d3529] leading-relaxed mb-8 text-lg">
              We provide full-spectrum property management for individual investors, portfolio owners, family offices, overseas investors, and corporate property owners.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CCard>
                <h3 className="font-semibold text-[#1a1714] mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Clients We Serve</h3>
                <BulletList icon={Users} items={[
                  "Individual & portfolio investors",
                  "Family offices & trusts",
                  "Overseas & diaspora investors",
                  "Corporate property owners",
                  "Institutional asset holders",
                ]} />
              </CCard>
              <CCard>
                <h3 className="font-semibold text-[#1a1714] mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Designed to Ensure</h3>
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

        <SectionDivider variant="champagne" />

        {/* ═══ 4. PERFORMANCE STATS ═══ */}
        <Section id="stats">
          <SectionHeading centered>Performance Metrics</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {performanceStats.map((stat, i) => (
              <div key={i}
                className="text-center p-5 rounded-xl bg-white/70 border border-[#C8A766]/25 hover:border-[#C8A766]/50 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#C8A766]" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#1a1714]" style={{ fontFamily: "Playfair Display, serif" }}>{stat.value}</p>
                <p className="text-xs text-[#6b5d4d] mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ 5. SERVICE MODULES GRID ═══ */}
        <Section id="residential">
          <SectionHeading>Core Service Modules</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceModules.map((mod, i) => (
              <div key={i}>
                <CCard className="h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center shrink-0">
                      <mod.icon className="w-5 h-5 text-[#C8A766]" />
                    </div>
                    <h3 className="font-semibold text-[#1a1714] text-lg" style={{ fontFamily: "Playfair Display, serif" }}>{mod.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {mod.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-[#3d3529]">
                        <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CCard>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ RESIDENTIAL + COMMERCIAL DETAIL ═══ */}
        <Section id="commercial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <SectionHeading>Residential Management</SectionHeading>
              <div>
                <CCard>
                  <h3 className="font-semibold text-[#1a1714] mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Services Include</h3>
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
                <div className="flex items-start gap-3 p-4 mt-4 rounded-xl bg-[#C8A766]/5 border border-[#C8A766]/15">
                  <Shield className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#6b5d4d]">
                    We follow RERA-compliant procedures in Dubai and applicable regulations across the UAE.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <SectionHeading>Commercial Management</SectionHeading>
              <div>
                <CCard>
                  <h3 className="font-semibold text-[#1a1714] mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Services Include</h3>
                  <BulletList items={[
                    "Commercial leasing strategy",
                    "Tenant retention planning",
                    "Contract negotiation support",
                    "Property performance analysis",
                    "Maintenance oversight",
                    "Compliance monitoring",
                  ]} />
                </CCard>
                <p className="text-[#6b5d4d] text-sm leading-relaxed mt-4">
                  Financial reporting aligned with commercial tenancy laws. Structured approach ensures operational transparency and performance accountability.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ LEASING WORKFLOW ═══ */}
        <Section id="leasing">
          <SectionHeading>Leasing & Tenant Placement</SectionHeading>
          <div>
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-[#C8A766]/20" />
              <div className="space-y-5">
                {leasingSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-5 pl-1">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-[#C8A766]/40 flex items-center justify-center shrink-0 z-10">
                      <span className="text-[#C8A766] font-bold text-sm">{i + 1}</span>
                    </div>
                    <CCard className="flex-1">
                      <h4 className="font-semibold text-[#1a1714] mb-1">{step.title}</h4>
                      <p className="text-sm text-[#6b5d4d]">{step.desc}</p>
                    </CCard>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-[#C8A766]/5 border border-[#C8A766]/15 max-w-3xl mx-auto">
              <Scale className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
              <p className="text-sm text-[#6b5d4d]">
                All tenancy registrations are processed in accordance with relevant local authority regulations.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

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
                <div key={i} className="p-5 rounded-xl bg-white/60 border border-[#C8A766]/25 hover:border-[#C8A766]/40 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#C8A766]/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-[#C8A766]" />
                    </div>
                    <h4 className="font-semibold text-[#1a1714] text-sm">{item.label}</h4>
                  </div>
                  <p className="text-xs text-[#6b5d4d] pl-12">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#C8A766]/5 border border-[#C8A766]/15">
              <Eye className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
              <p className="text-sm text-[#6b5d4d]">
                Financial transparency is maintained through structured reporting and owner-accessible documentation.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ MAINTENANCE (dedicated section) ═══ */}
        <Section id="maintenance">
          <SectionHeading>Maintenance & Operations</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CCard>
              <h3 className="font-semibold text-[#1a1714] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Preventive Maintenance</h3>
              <BulletList items={[
                "Scheduled HVAC, plumbing, and electrical inspections",
                "Annual property condition assessments",
                "Common area and amenity upkeep coordination",
                "Warranty tracking and claims management",
              ]} />
            </CCard>
            <CCard>
              <h3 className="font-semibold text-[#1a1714] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Reactive & Emergency</h3>
              <BulletList items={[
                "24/7 emergency response coordination",
                "Vetted vendor dispatch within SLA targets",
                "Cost-approved repair protocols with owner thresholds",
                "Incident documentation and follow-up reporting",
              ]} />
            </CCard>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ TENANT MANAGEMENT ═══ */}
        <Section id="tenant-mgmt">
          <SectionHeading>Tenant Management</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CCard>
              <h3 className="font-semibold text-[#1a1714] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Communication & Relations</h3>
              <BulletList items={[
                "Dedicated tenant communication portal",
                "Complaint resolution protocols with SLA tracking",
                "Move-in orientation and property guidelines",
                "Regular satisfaction surveys",
              ]} />
            </CCard>
            <CCard>
              <h3 className="font-semibold text-[#1a1714] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>Inspections & Compliance</h3>
              <BulletList items={[
                "Scheduled mid-tenancy inspections",
                "Move-out condition assessments",
                "Security deposit reconciliation",
                "Damage documentation and recovery",
              ]} />
            </CCard>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ RENEWALS ═══ */}
        <Section id="renewals">
          <SectionHeading>Renewals & Retention Strategy</SectionHeading>
          <CCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-[#C8A766]" />
                </div>
                <h4 className="font-semibold text-[#1a1714] mb-2">Proactive Tracking</h4>
                <p className="text-sm text-[#6b5d4d]">Automated lease expiry alerts 90 days before renewal date with market rate comparisons.</p>
              </div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-[#C8A766]" />
                </div>
                <h4 className="font-semibold text-[#1a1714] mb-2">Market-Rate Negotiation</h4>
                <p className="text-sm text-[#6b5d4d]">Data-driven renewal terms based on current market conditions and RERA rental index.</p>
              </div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center mb-3">
                  <UserCheck className="w-5 h-5 text-[#C8A766]" />
                </div>
                <h4 className="font-semibold text-[#1a1714] mb-2">Retention Programs</h4>
                <p className="text-sm text-[#6b5d4d]">Targeted retention incentives for high-quality tenants to minimize vacancy periods.</p>
              </div>
            </div>
          </CCard>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ COMPLIANCE ═══ */}
        <Section id="compliance">
          <SectionHeading>Compliance & Governance</SectionHeading>
          <div>
            <p className="text-[#3d3529] mb-6 leading-relaxed">We operate in alignment with:</p>
            <CCard className="mb-6">
              <BulletList icon={Scale} items={[
                "Dubai Land Department (DLD) requirements",
                "RERA regulations and licensing standards",
                "Tenancy Law (Dubai Law No. 26 of 2007 and amendments)",
                "UAE Civil Code provisions governing lease agreements",
                "ADGM and DIFC regulatory frameworks (where applicable)",
              ]} />
            </CCard>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#C8A766]/5 border border-[#C8A766]/15">
              <Shield className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
              <p className="text-sm text-[#6b5d4d]">
                We do not provide legal representation but coordinate with licensed legal professionals when required.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ WORKFLOW DIAGRAM ═══ */}
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
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#C8A766]/30 flex items-center justify-center mb-3 shadow-sm">
                        <step.icon className="w-7 h-7 text-[#C8A766]" />
                      </div>
                      <p className="text-xs font-semibold text-[#1a1714] text-center whitespace-pre-line">{step.label}</p>
                    </div>
                    {i < 4 && (
                      <ArrowRight className="w-5 h-5 text-[#C8A766]/40 hidden md:block shrink-0 -mt-6" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-[#C8A766]/5 border border-[#C8A766]/15 text-center">
              <p className="text-sm text-[#6b5d4d]">
                <strong className="text-[#1a1714]">Continuous cycle.</strong> Each phase feeds into the next with monthly performance reviews and strategy adjustments.
              </p>
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

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
              <div key={i} className="p-5 rounded-xl bg-white/60 border border-[#C8A766]/25 hover:border-[#C8A766]/40 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#C8A766]/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-[#C8A766]" />
                  </div>
                  <h4 className="font-semibold text-[#1a1714] text-sm">{item.title}</h4>
                </div>
                <p className="text-xs text-[#6b5d4d]">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ ONBOARDING ═══ */}
        <Section id="onboarding">
          <SectionHeading>Management Onboarding Process</SectionHeading>
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#C8A766]/20" />
            <div className="space-y-5">
              {onboardingSteps.map((s) => (
                <div key={s.step} className="flex items-start gap-5 pl-1">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-[#C8A766]/40 flex items-center justify-center shrink-0 z-10">
                    <span className="text-[#C8A766] font-bold text-sm">{s.step}</span>
                  </div>
                  <CCard className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <s.icon className="w-5 h-5 text-[#C8A766] shrink-0" />
                      <h4 className="font-semibold text-[#1a1714]">{s.title}</h4>
                    </div>
                    <p className="text-sm text-[#6b5d4d] pl-8">{s.desc}</p>
                  </CCard>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ TRUST SIGNALS ═══ */}
        <Section id="trust">
          <SectionHeading centered>Trust & Credentials</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustSignals.map((item, i) => (
              <div key={i}
                className="text-center p-6 rounded-xl bg-white/70 border border-[#C8A766]/25 hover:border-[#C8A766]/50 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-[#C8A766]" />
                </div>
                <h4 className="font-semibold text-[#1a1714] mb-2" style={{ fontFamily: "Playfair Display, serif" }}>{item.title}</h4>
                <p className="text-xs text-[#6b5d4d] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ FEES ═══ */}
        <Section id="fees">
          <SectionHeading>Service Fees & Structure</SectionHeading>
          <CCard className="p-8">
            <p className="text-[#3d3529] leading-relaxed text-lg mb-4">
              Management fees are structured based on property type, asset size, and scope of service. A tailored proposal is issued following asset evaluation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-white/60 border border-[#C8A766]/20 text-center">
                <Percent className="w-5 h-5 text-[#C8A766] mx-auto mb-2" />
                <p className="font-semibold text-[#1a1714] text-sm">Performance-Based</p>
                <p className="text-xs text-[#6b5d4d] mt-1">Fees tied to occupancy and collection performance</p>
              </div>
              <div className="p-4 rounded-lg bg-white/60 border border-[#C8A766]/20 text-center">
                <FileText className="w-5 h-5 text-[#C8A766] mx-auto mb-2" />
                <p className="font-semibold text-[#1a1714] text-sm">Transparent Terms</p>
                <p className="text-xs text-[#6b5d4d] mt-1">No hidden charges or undisclosed markups</p>
              </div>
              <div className="p-4 rounded-lg bg-white/60 border border-[#C8A766]/20 text-center">
                <Settings className="w-5 h-5 text-[#C8A766] mx-auto mb-2" />
                <p className="font-semibold text-[#1a1714] text-sm">Custom Packages</p>
                <p className="text-xs text-[#6b5d4d] mt-1">Scaled to your portfolio requirements</p>
              </div>
            </div>
          </CCard>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ FAQ ═══ */}
        <Section id="faq">
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <Accordion type="single" collapsible className="space-y-3">
            {faqData.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-[#C8A766]/25 rounded-xl px-5 bg-white/60">
                <AccordionTrigger className="text-[#1a1714] hover:no-underline font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[#6b5d4d] leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>

        <SectionDivider variant="champagne" />

        {/* ═══ CTA / CONSULTATION ═══ */}
        <Section id="consultation">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1714] mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
              <span className="text-[#C8A766]">Entrust</span> Your Asset to Structured Management
            </h2>
            <p className="text-[#6b5d4d] max-w-2xl mx-auto">
              Request a tailored management proposal or speak directly with a property manager.
            </p>
          </div>

          <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-[#C8A766]/30 bg-white/80 shadow-[0_4px_20px_rgba(200,167,102,0.12)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-[#1a1714] mb-1 block">Full Name</label>
                <Input placeholder="Your full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-white/80 border-[#C8A766]/30 focus:border-[#C8A766]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1a1714] mb-1 block">Email</label>
                <Input type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="bg-white/80 border-[#C8A766]/30 focus:border-[#C8A766]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1a1714] mb-1 block">Phone</label>
                <Input placeholder="+971 ..." value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="bg-white/80 border-[#C8A766]/30 focus:border-[#C8A766]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1a1714] mb-1 block">Property Type</label>
                <Input placeholder="Residential / Commercial" value={formData.propertyType} onChange={e => setFormData(p => ({ ...p, propertyType: e.target.value }))} className="bg-white/80 border-[#C8A766]/30 focus:border-[#C8A766]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1a1714] mb-1 block">Location</label>
                <Input placeholder="Dubai, Abu Dhabi..." value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="bg-white/80 border-[#C8A766]/30 focus:border-[#C8A766]" />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm font-medium text-[#1a1714] mb-1 block">Additional Notes</label>
              <textarea
                placeholder="Describe your property or management requirements..."
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 text-sm bg-white/80 border-2 border-[#C8A766]/30 text-[#1a1714] placeholder:text-[#9c9080] focus:outline-none focus:ring-2 focus:ring-[#C8A766]/50 focus:border-[#C8A766] min-h-[100px] resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PremiumHeroButton variant="light-bg" onClick={() => {}}>
                Request Proposal
              </PremiumHeroButton>
              <PremiumHeroButton variant="light-bg" href="/contact">
                Book Consultation
              </PremiumHeroButton>
              <PremiumHeroButton variant="light-bg" href="/contact?service=property-management">
                Speak to Property Manager
              </PremiumHeroButton>
            </div>
            <p className="text-xs text-[#9c9080] mt-4 text-center">
              Submission does not constitute a service agreement. A dedicated property manager will contact you to discuss your requirements.
            </p>
          </div>
        </Section>

          </div>{/* close rounded card */}
        </div>{/* close max-w container */}
      </div>{/* close pageBg */}

      <SectionDivider />
    </>
  );
};

export default PropertyManagement;
