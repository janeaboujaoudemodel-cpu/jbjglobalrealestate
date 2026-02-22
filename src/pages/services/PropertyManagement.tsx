import { motion } from "framer-motion";
import {
  Building2, Users, Wrench, FileText, CheckCircle2, ArrowRight,
  Phone, Clock, ClipboardList, Home, Key, Shield, Calendar,
  BarChart3, MessageSquare, RefreshCw, Settings, Briefcase,
  Scale, Eye, DollarSign, UserCheck, Hammer, BookOpen,
  ChevronRight, Sparkles, MapPin, Send,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { SectionDivider } from "@/components/ui/section-divider";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const tocSections = [
  { id: "overview", label: "Management Overview" },
  { id: "residential", label: "Residential Management" },
  { id: "commercial", label: "Commercial Management" },
  { id: "leasing", label: "Leasing & Tenant Placement" },
  { id: "financial", label: "Financial Management" },
  { id: "maintenance", label: "Maintenance & Operations" },
  { id: "legal", label: "Legal & Regulatory Compliance" },
  { id: "reporting", label: "Reporting & Transparency" },
  { id: "dashboard", label: "Owner Dashboard" },
  { id: "onboarding", label: "Management Onboarding Process" },
  { id: "fees", label: "Service Fees & Structure" },
  { id: "consultation", label: "Request Consultation" },
];

const onboardingSteps = [
  { step: 1, title: "Asset Review", icon: Eye },
  { step: 2, title: "Property Inspection", icon: ClipboardList },
  { step: 3, title: "Management Agreement Signing", icon: FileText },
  { step: 4, title: "Documentation Collection", icon: BookOpen },
  { step: 5, title: "Market Strategy Activation", icon: BarChart3 },
  { step: 6, title: "Tenant Placement or Transition", icon: UserCheck },
  { step: 7, title: "Reporting Initiation", icon: Send },
];

const leasingSteps = [
  "Market Assessment",
  "Pricing Strategy",
  "Professional Photography & Listing",
  "Tenant Screening",
  "Contract Drafting",
  "Ejari Registration (Dubai)",
  "Handover Documentation",
];

const faqData = [
  { q: "Do you collect rent on my behalf?", a: "Rent collection and follow-up are included as part of our financial management services, with structured reporting provided to owners." },
  { q: "Do I lose control of my property decisions?", a: "No. You define the approval thresholds. Major decisions always require your authorization." },
  { q: "Can you manage vacant units?", a: "Yes. We coordinate property readiness, repairs, and marketing preparation for vacant units." },
  { q: "Do you handle maintenance directly?", a: "We coordinate with qualified, vetted vendors. All work is performed by licensed professionals." },
  { q: "How are urgent issues handled?", a: "Urgent matters are escalated immediately via priority communication with clear options presented for your approval." },
  { q: "Can I see monthly activity reports?", a: "Yes. Owners receive structured monthly financial summaries, maintenance logs, and tenant status updates." },
  { q: "Can I terminate the service?", a: "Offboarding terms are clearly defined in the management agreement." },
  { q: "Is this the same as brokerage?", a: "No. Property management is an ongoing operational service, separate from sales or leasing brokerage transactions." },
];

/* ─── Divider ─── */
const GoldDivider = () => (
  <div className="py-6 md:py-8">
    <div className="max-w-5xl mx-auto px-4 flex items-center gap-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <Sparkles className="w-4 h-4 text-gold/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>
  </div>
);

/* ─── Section wrapper ─── */
const Section = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`scroll-mt-24 py-16 md:py-20 ${className}`}>
    <div className="max-w-5xl mx-auto px-4">{children}</div>
  </section>
);

/* ─── Champagne Card ─── */
const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="text-3xl md:text-4xl font-bold text-white mb-8"
    style={{ fontFamily: "Playfair Display, serif" }}
  >
    {children}
  </motion.h2>
);

const BulletList = ({ items, icon: Icon = CheckCircle2 }: { items: string[]; icon?: any }) => (
  <ul className="space-y-3">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-zinc-700 leading-relaxed">
        <Icon className="w-5 h-5 text-gold shrink-0 mt-0.5" />
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
      <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-[#C8A766]/8 rounded-full blur-[80px]" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/30 bg-black/30 backdrop-blur-sm">
              <Building2 className="w-4 h-4 text-[#C8A766]" />
              <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Services</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Property Management &<br />Asset Stewardship
            </h1>

            <p className="text-lg md:text-xl text-[#C8A766]/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              Comprehensive Management for Residential, Commercial & Investment Properties in the UAE
            </p>

            <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed mb-4">
              Our Property Management division delivers structured, transparent, and performance-driven management solutions designed to protect, optimize, and enhance the value of your real estate assets.
            </p>
            <p className="text-zinc-400 text-base max-w-3xl leading-relaxed mb-10">
              We manage properties with operational precision, financial accountability, and regulatory compliance in alignment with UAE real estate laws and authority requirements.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <PremiumHeroButton href="/contact?service=property-management">
                Request Management Proposal
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Schedule Asset Consultation
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 2. TABLE OF CONTENTS ═══ */}
      <section className="bg-[#151210] py-12 md:py-16 border-b border-[#C8A766]/10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: "Playfair Display, serif" }}>
            Table of Contents
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tocSections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-left px-4 py-3 rounded-xl border border-[#C8A766]/20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-[#C8A766]/50 hover:shadow-md transition-all text-sm text-zinc-700 hover:text-black flex items-center gap-2 group"
              >
                <span className="text-[#C8A766]/80 font-semibold text-xs">{String(i + 1).padStart(2, "0")}</span>
                <span className="group-hover:text-black transition-colors">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. MANAGEMENT OVERVIEW ═══ */}
      <div className="bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        <Section id="overview">
          <SectionTitle>Management Overview</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">
              We provide full-spectrum property management for:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-6 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <h3 className="font-semibold text-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>Clients We Serve</h3>
                <BulletList icon={Users} items={[
                  "Individual investors",
                  "Portfolio owners",
                  "Family offices",
                  "Overseas investors",
                  "Corporate property owners",
                ]} />
              </div>
              <div className="p-6 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                <h3 className="font-semibold text-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>Services Designed to Ensure</h3>
                <BulletList items={[
                  "Revenue optimization",
                  "Tenant quality control",
                  "Maintenance efficiency",
                  "Legal compliance",
                  "Risk mitigation",
                ]} />
              </div>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 4. RESIDENTIAL ═══ */}
        <Section id="residential">
          <SectionTitle>Residential Property Management</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="p-6 md:p-8 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] mb-6">
              <h3 className="font-semibold text-black mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Services Include</h3>
              <BulletList items={[
                "Tenant marketing & screening",
                "Lease preparation & renewals",
                "Move-in / move-out inspections",
                "Rent collection & follow-up",
                "Maintenance coordination",
                "Service charge monitoring",
                "Condition reporting",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                We follow RERA-compliant procedures in Dubai and applicable regulations across the UAE.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 5. COMMERCIAL ═══ */}
        <Section id="commercial">
          <SectionTitle>Commercial Property Management</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="p-6 md:p-8 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] mb-6">
              <h3 className="font-semibold text-black mb-4 text-lg" style={{ fontFamily: "Playfair Display, serif" }}>Services Include</h3>
              <BulletList items={[
                "Commercial leasing strategy",
                "Tenant retention planning",
                "Contract negotiation support",
                "Property performance analysis",
                "Maintenance oversight",
                "Compliance monitoring",
              ]} />
            </div>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Financial reporting aligned with commercial tenancy laws. Our structured approach ensures operational transparency and performance accountability.
            </p>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 6. LEASING ═══ */}
        <Section id="leasing">
          <SectionTitle>Leasing & Tenant Placement</SectionTitle>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/20" />
              <div className="space-y-5">
                {leasingSteps.map((step, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex items-center gap-5 pl-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-[#C8A766]/40 flex items-center justify-center shrink-0 z-10">
                      <span className="text-[#C8A766] font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                      <span className="font-medium text-black">{step}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <motion.div variants={fadeInUp} className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Scale className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                All tenancy registrations are processed in accordance with relevant local authority regulations.
              </p>
            </motion.div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 7. FINANCIAL ═══ */}
        <Section id="financial">
          <SectionTitle>Financial Management</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { icon: DollarSign, label: "Rent collection" },
                { icon: Shield, label: "Escrow tracking (where applicable)" },
                { icon: ClipboardList, label: "Expense management" },
                { icon: BarChart3, label: "Service charge monitoring" },
                { icon: Briefcase, label: "Vendor payments" },
                { icon: FileText, label: "Monthly statements" },
                { icon: Calendar, label: "Annual income summary" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                  <item.icon className="w-5 h-5 text-gold shrink-0" />
                  <span className="text-zinc-700">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Eye className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                Financial transparency is maintained through structured reporting and documentation.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 8. MAINTENANCE ═══ */}
        <Section id="maintenance">
          <SectionTitle>Maintenance & Operations</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Calendar, label: "Preventive maintenance planning" },
                { icon: Phone, label: "Emergency coordination" },
                { icon: Users, label: "Vendor management" },
                { icon: Eye, label: "Quality control inspection" },
                { icon: Shield, label: "Cost approval protocol" },
                { icon: ClipboardList, label: "Property condition reporting" },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-zinc-700 text-sm mt-2">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 9. LEGAL ═══ */}
        <Section id="legal">
          <SectionTitle>Legal & Regulatory Compliance</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 mb-6 leading-relaxed">We operate in alignment with:</p>
            <div className="p-6 md:p-8 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] mb-6">
              <BulletList icon={Scale} items={[
                "Dubai Land Department (DLD)",
                "RERA regulations",
                "Tenancy Law (Dubai Law No. 26 of 2007 and amendments where applicable)",
                "UAE Civil Code provisions governing lease agreements",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                We do not provide legal representation but coordinate with licensed legal professionals when required.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 10. REPORTING ═══ */}
        <Section id="reporting">
          <SectionTitle>Reporting & Owner Dashboard</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 mb-6 leading-relaxed">Owners receive:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="dashboard">
              {[
                { icon: BarChart3, title: "Monthly Financial Summary", desc: "Income, expenses, and net position." },
                { icon: Wrench, title: "Maintenance Log", desc: "Dates, issue types, status, and vendor notes." },
                { icon: UserCheck, title: "Tenant Status Updates", desc: "Occupancy, communications, and compliance." },
                { icon: RefreshCw, title: "Lease Renewal Alerts", desc: "Key dates and renewal reminders." },
                { icon: Eye, title: "Occupancy Performance", desc: "Utilization rates and market positioning." },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="w-5 h-5 text-gold" />
                    <h4 className="font-semibold text-black">{item.title}</h4>
                  </div>
                  <p className="text-sm text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 11. ONBOARDING ═══ */}
        <Section id="onboarding">
          <SectionTitle>Management Onboarding Process</SectionTitle>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/20" />
              <div className="space-y-5">
                {onboardingSteps.map((s) => (
                  <motion.div key={s.step} variants={fadeInUp} className="flex items-center gap-5 pl-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border-2 border-[#C8A766]/40 flex items-center justify-center shrink-0 z-10">
                      <span className="text-[#C8A766] font-bold text-sm">{s.step}</span>
                    </div>
                    <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 flex items-center gap-3">
                      <s.icon className="w-5 h-5 text-[#C8A766] shrink-0" />
                      <span className="font-medium text-black">{s.title}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 12. FEES ═══ */}
        <Section id="fees">
          <SectionTitle>Service Fees & Structure</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="p-6 md:p-8 rounded-xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <p className="text-zinc-700 leading-relaxed">
                Management fees are structured based on property type, asset size, and scope of service. A tailored proposal is issued following asset evaluation.
              </p>
              <p className="text-zinc-500 text-sm mt-4">
                Contact our team to receive a detailed management proposal customized to your property portfolio.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ FAQ ═══ */}
        <Section id="faq">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqData.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-[#C8A766]/30 rounded-xl px-5 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <AccordionTrigger className="text-black hover:no-underline font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-600 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 13. CTA / CONSULTATION ═══ */}
        <Section id="consultation">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
                Entrust Your Asset to Structured Management
              </h2>
              <p className="text-zinc-600 max-w-2xl mx-auto">
                Request a tailored management proposal or speak directly with a property manager.
              </p>
            </div>

            <div className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-[#C8A766]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.15)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Full Name</label>
                  <Input placeholder="Your full name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Email</label>
                  <Input type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Phone</label>
                  <Input placeholder="+971 ..." value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Property Type</label>
                  <Input placeholder="Residential / Commercial" value={formData.propertyType} onChange={e => setFormData(p => ({ ...p, propertyType: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Location</label>
                  <Input placeholder="Dubai, Abu Dhabi..." value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div className="mb-6">
                <label className="text-sm font-medium text-black mb-1 block">Additional Notes</label>
                <textarea
                  placeholder="Describe your property or management requirements..."
                  value={formData.notes}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[100px] resize-none"
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
              <p className="text-xs text-zinc-400 mt-4 text-center">
                Submission does not constitute a service agreement. A dedicated property manager will contact you to discuss your requirements.
              </p>
            </div>
          </motion.div>
        </Section>
      </div>
    </>
  );
};

export default PropertyManagement;
