import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Building2, CheckCircle2, TrendingUp, FileText,
  Shield, Scale, Eye, DollarSign, Briefcase, MapPin, Search,
  Target, Layers, Calendar, Users, ClipboardList, Sparkles,
  ArrowRight, Lock, Send, Home, Calculator,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const tocSections = [
  { id: "overview", label: "Valuation Overview" },
  { id: "market-based", label: "Market-Based Valuation" },
  { id: "cma", label: "Comparative Market Analysis" },
  { id: "yield", label: "Investment Yield Assessment" },
  { id: "offplan", label: "Developer & Off-Plan Assessment" },
  { id: "bank", label: "Bank & Financing Use Cases" },
  { id: "methodology", label: "Methodology & Data Sources" },
  { id: "regulatory", label: "Regulatory Considerations" },
  { id: "report", label: "Valuation Report Structure" },
  { id: "request", label: "Request a Valuation" },
];

const GoldDivider = () => (
  <div className="py-6 md:py-8">
    <div className="max-w-5xl mx-auto px-4 flex items-center gap-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <Sparkles className="w-4 h-4 text-gold/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>
  </div>
);

const Section = ({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) => (
  <section id={id} className={`scroll-mt-24 py-16 md:py-20 ${className}`}>
    <div className="max-w-5xl mx-auto px-4">{children}</div>
  </section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2
    variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
    className="text-3xl md:text-4xl font-bold text-black mb-8"
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

const reportSections = [
  { icon: FileText, title: "Executive Summary", desc: "High-level property position and market context." },
  { icon: MapPin, title: "Market Position", desc: "Location performance and competitive landscape." },
  { icon: BarChart3, title: "Comparable Analysis", desc: "Benchmarking against similar transactions and listings." },
  { icon: Target, title: "Pricing Recommendation", desc: "Data-supported pricing range and strategy." },
  { icon: TrendingUp, title: "Investment Perspective", desc: "Yield analysis and capital appreciation outlook." },
  { icon: Shield, title: "Risk Factors", desc: "Market variables, supply pipeline, and regulatory considerations." },
  { icon: Briefcase, title: "Strategic Recommendation", desc: "Actionable guidance for sale, hold, or refinancing decisions." },
];

const RequestValuation = () => {
  const navigate = useNavigate();
  const { captureLead } = useLeadCapture();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", propertyType: "", location: "", size: "",
    bedrooms: "", status: "", purpose: "", notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.propertyType) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await captureLead(
        { email: formData.email || undefined, fullName: formData.name, phone: formData.phone },
        "property-valuation"
      );
      if (success) navigate("/thank-you?type=valuation");
      else toast.error("Something went wrong. Please try again.");
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const set = (field: string, value: string) => setFormData(p => ({ ...p, [field]: value }));

  return (
    <>
      <SEOHead
        title="Property Valuation & Market Intelligence | JBJ Global Real Estate"
        description="Independent market-based property assessment in the UAE. Data-driven valuations for sale strategy, refinancing, portfolio planning, and asset optimization."
        canonicalPath="/sell/valuation"
      />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F4EC] to-[#EDE4D3]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-gold/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-gold/8 rounded-full blur-[80px]" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-gold/30 bg-white/60 backdrop-blur-sm">
              <BarChart3 className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">Valuation Services</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Property Valuation &<br />Market Intelligence
            </h1>

            <p className="text-lg md:text-xl text-gold/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              Independent Market-Based Property Assessment in the UAE
            </p>

            <p className="text-zinc-700 text-base md:text-lg max-w-3xl leading-relaxed mb-4">
              Our valuation service provides structured, data-supported property assessments aligned with prevailing UAE market conditions and regulatory frameworks.
            </p>
            <p className="text-zinc-600 text-base max-w-3xl leading-relaxed mb-10">
              We deliver valuation insights for sale strategy, refinancing, portfolio planning, and asset optimization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <PremiumHeroButton variant="light-bg" onClick={() => scrollTo("request")}>
                Request Valuation
              </PremiumHeroButton>
              <PremiumHeroButton variant="light-bg" href="/property-evaluator">
                Check Market Estimate
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ 2. TABLE OF CONTENTS ═══ */}
      <section className="bg-white py-12 md:py-16 border-b border-gold/10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8 text-center" style={{ fontFamily: "Playfair Display, serif" }}>
            Table of Contents
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tocSections.map((s, i) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="text-left px-4 py-3 rounded-xl border border-gold/20 bg-gradient-to-br from-white to-[#FDFBF7] hover:border-gold/50 hover:shadow-md transition-all text-sm text-zinc-700 hover:text-black flex items-center gap-2 group"
              >
                <span className="text-gold/60 font-semibold text-xs">{String(i + 1).padStart(2, "0")}</span>
                <span className="group-hover:text-black transition-colors">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-br from-[#FDFBF7] via-white to-[#F8F4EC]">

        {/* ═══ 3. VALUATION OVERVIEW ═══ */}
        <Section id="overview">
          <SectionTitle>Valuation Overview</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">Our valuation framework considers:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { icon: MapPin, label: "Location performance" },
                { icon: BarChart3, label: "Comparable transactions" },
                { icon: TrendingUp, label: "Supply & demand trends" },
                { icon: Building2, label: "Developer reputation" },
                { icon: ClipboardList, label: "Property condition" },
                { icon: DollarSign, label: "Rental yield benchmarks" },
                { icon: Calendar, label: "Handover timelines (for off-plan)" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gold/15">
                  <item.icon className="w-5 h-5 text-gold shrink-0" />
                  <span className="text-zinc-700">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                Valuation results are market-based estimates and do not constitute a certified government appraisal unless issued by a licensed valuation firm where required.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 4. MARKET-BASED VALUATION ═══ */}
        <Section id="market-based">
          <SectionTitle>Market-Based Valuation</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">We analyze:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white">
              <BulletList icon={Search} items={[
                "Recent transaction data",
                "Active listings in the market",
                "Price-per-square-foot comparisons",
                "Market velocity and time-on-market trends",
                "Absorption rate across comparable segments",
              ]} />
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 5. CMA ═══ */}
        <Section id="cma">
          <SectionTitle>Comparative Property Benchmarking</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">We benchmark your property against:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white mb-6">
              <BulletList icon={Layers} items={[
                "Similar unit types within the same community",
                "Same building performance and transaction history",
                "Area-level price averages and trends",
                "Developer-level averages across comparable projects",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Target className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                No inflated estimates. Pure market alignment based on verifiable data.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 6. YIELD ASSESSMENT ═══ */}
        <Section id="yield">
          <SectionTitle>Investment Yield Assessment</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, title: "Gross Yield Estimate", desc: "Annualized rental income relative to property value." },
                { icon: Calculator, title: "Net Yield Projection", desc: "After deducting service charges, maintenance, and vacancy." },
                { icon: TrendingUp, title: "Rental Range Estimation", desc: "Market-aligned rental pricing for the specific unit type." },
                { icon: Shield, title: "Occupancy Risk", desc: "Vacancy exposure based on area demand dynamics." },
                { icon: BarChart3, title: "ROI Modeling", desc: "Capital appreciation and total return projection." },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-white border border-gold/15">
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

        {/* ═══ 7. OFF-PLAN ═══ */}
        <Section id="offplan">
          <SectionTitle>Off-Plan & Developer Analysis</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">For off-plan properties, we consider:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white mb-6">
              <BulletList icon={Building2} items={[
                "Developer track record and delivery history",
                "Construction progress and handover pipeline",
                "Payment plan structure and financial commitment",
                "Market cycle timing and entry positioning",
                "Post-handover capital gain potential",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                Projection-based assessment; subject to market variables and developer performance.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 8. BANK & FINANCING ═══ */}
        <Section id="bank">
          <SectionTitle>Bank & Financing Use Cases</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">Valuations may be required for:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white mb-6">
              <BulletList icon={Briefcase} items={[
                "Mortgage refinancing",
                "Loan security documentation",
                "Asset restructuring",
                "Portfolio reporting and wealth management",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Scale className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                For official bank submission, certified valuation by a licensed RERA-approved valuer may be required.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 9. METHODOLOGY ═══ */}
        <Section id="methodology">
          <SectionTitle>Methodology & Data Sources</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">Our analysis references:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white">
              <BulletList icon={Eye} items={[
                "Market transaction data from official registries",
                "Developer pricing and project information",
                "Comparative active listings across platforms",
                "Area performance trends and historical data",
                "Internal analytics models and market intelligence",
              ]} />
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 10. REGULATORY ═══ */}
        <Section id="regulatory">
          <SectionTitle>Regulatory Considerations</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">Our valuation practice operates in alignment with:</p>
            <div className="p-6 md:p-8 rounded-xl border border-gold/20 bg-white mb-6">
              <BulletList icon={Scale} items={[
                "Dubai Land Department (DLD) guidelines",
                "RERA regulatory framework",
                "UAE real estate legislation and market standards",
              ]} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
              <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-600">
                We provide market valuation insights, not government-issued property certificates unless explicitly arranged through licensed partners.
              </p>
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 11. REPORT STRUCTURE ═══ */}
        <Section id="report">
          <SectionTitle>Valuation Report Structure</SectionTitle>
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-zinc-700 leading-relaxed mb-6">What you receive:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportSections.map((item, i) => (
                <div key={i} className="p-5 rounded-xl bg-white border border-gold/15 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">{item.title}</h4>
                    <p className="text-sm text-zinc-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>
        <GoldDivider />

        {/* ═══ 12. REQUEST FORM ═══ */}
        <Section id="request">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
                Request a Valuation
              </h2>
              <p className="text-zinc-600 max-w-2xl mx-auto">
                Submit your property details for a structured, data-driven valuation assessment.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 md:p-8 rounded-2xl border border-gold/20 bg-white shadow-[0_4px_20px_rgba(200,167,102,0.08)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Property Type *</label>
                  <Select value={formData.propertyType} onValueChange={v => set("propertyType", v)}>
                    <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Location *</label>
                  <Input placeholder="Community / Area" value={formData.location} onChange={e => set("location", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Size (sq ft)</label>
                  <Input placeholder="e.g., 1200" value={formData.size} onChange={e => set("size", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Bedrooms</label>
                  <Select value={formData.bedrooms} onValueChange={v => set("bedrooms", v)}>
                    <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 BR</SelectItem>
                      <SelectItem value="2">2 BR</SelectItem>
                      <SelectItem value="3">3 BR</SelectItem>
                      <SelectItem value="4">4 BR</SelectItem>
                      <SelectItem value="5+">5+ BR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Current Status</label>
                  <Select value={formData.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="offplan">Off-Plan</SelectItem>
                      <SelectItem value="owner-occupied">Owner Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-1 block">Purpose</label>
                  <Select value={formData.purpose} onValueChange={v => set("purpose", v)}>
                    <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sell">Sale Strategy</SelectItem>
                      <SelectItem value="refinance">Refinancing</SelectItem>
                      <SelectItem value="investment">Investment Analysis</SelectItem>
                      <SelectItem value="portfolio">Portfolio Reporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gold/15 pt-4 mb-4">
                <h3 className="text-sm font-semibold text-black mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-black mb-1 block">Full Name *</label>
                    <Input placeholder="Your name" value={formData.name} onChange={e => set("name", e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-black mb-1 block">Email</label>
                    <Input type="email" placeholder="your@email.com" value={formData.email} onChange={e => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-black mb-1 block">Phone *</label>
                    <Input placeholder="+971 ..." value={formData.phone} onChange={e => set("phone", e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-black mb-1 block">Additional Notes</label>
                <textarea
                  placeholder="Any details about the property or your requirements..."
                  value={formData.notes}
                  onChange={e => set("notes", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-gold/50 min-h-[100px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-gold/5 border border-gold/15">
                <Lock className="w-4 h-4 text-gold shrink-0" />
                <p className="text-xs text-zinc-500">Secure & Confidential — Your information is protected and reviewed by authorized personnel only.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-semibold text-black bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold/80 hover:shadow-[0_8px_25px_rgba(200,167,102,0.3)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Submitting..." : "Request Property Valuation"}
                <ArrowRight className="w-5 h-5 text-gold" />
              </button>

              <p className="text-xs text-zinc-400 mt-4 text-center">
                This is a preliminary assessment request. Final valuation is subject to property inspection and data verification. <a href="/contact" className="text-gold hover:underline">Contact our team for professional guidance</a>.
              </p>
            </form>
          </motion.div>
        </Section>
      </div>
    </>
  );
};

export default RequestValuation;
