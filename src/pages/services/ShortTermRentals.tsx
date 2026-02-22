import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileCheck,
  TrendingUp,
  Camera,
  Users,
  PieChart,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  Building2,
  Send,
  Home,
  Briefcase,
  Globe,
  Crown,
  MapPin,
  Star,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

/* ── Section divider ── */
const GoldDivider = () => (
  <div className="flex items-center justify-center py-2">
    <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C8A766]" />
    <div className="w-2 h-2 rotate-45 border border-[#C8A766] mx-3" />
    <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C8A766]" />
  </div>
);

/* ── Pillar card ── */
const PillarCard = ({
  icon: Icon,
  number,
  title,
  items,
}: {
  icon: any;
  number: number;
  title: string;
  items: string[];
}) => (
  <motion.div
    variants={fadeIn}
    className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F3EB] to-[#EDE4D3] border border-[#C8A766]/30 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C8A766] to-[#B8943F] flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C8A766]">
          Pillar {number}
        </span>
        <h3
          className="text-xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          {title}
        </h3>
      </div>
    </div>
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[#444]">
          <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0 mt-1" />
          <span className="text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

/* ── Section heading ── */
const SectionHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="text-center mb-12">
    <GoldDivider />
    <h2
      className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-6 mb-3"
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      {title}
    </h2>
    {subtitle && (
      <p className="text-[#666] max-w-2xl mx-auto text-base leading-relaxed">
        {subtitle}
      </p>
    )}
  </div>
);

const ShortTermRentals = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    propertyLocation: "",
    propertyType: "",
    bedrooms: "",
    furnished: "",
    currentStrategy: "",
    timeline: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your inquiry has been submitted. Our team will contact you shortly.");
  };

  return (
    <>
      <SEOHead
        title="Short-Term Rental & Holiday Home Management | JBJ Global Real Estate"
        description="Maximize yield, maintain standards, and operate in full compliance with our luxury short-term rental and holiday home management services."
        canonicalPath="/services/short-term-rentals"
      />

      {/* ═══════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center min-h-[85vh] overflow-hidden bg-gradient-to-b from-[#0d0b09] via-[#1a1610] to-[#0d0b09]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#C8A76615_0%,_transparent_60%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#C8A766]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#C8A766]/6 rounded-full blur-[140px]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border border-[#C8A766]/40 bg-white/5 backdrop-blur-md">
              <Home className="w-4 h-4 text-[#C8A766]" />
              <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">
                Holiday Home Services
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Luxury Short-Term Rental &<br />
              <span className="text-[#C8A766]">Holiday Home Management</span>
            </h1>

            <p className="text-zinc-300 text-lg md:text-xl mb-4 font-medium tracking-wide">
              Maximize Yield. Maintain Standards. Operate in Full Compliance.
            </p>

            <p className="text-zinc-400 text-base max-w-3xl mx-auto leading-relaxed mb-10">
              Short-term rental operations require more than simply listing a property online.
              From licensing and guest vetting to dynamic pricing and hospitality management,
              we provide a structured short-term rental framework designed to maximize occupancy
              while preserving asset value and maintaining regulatory alignment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=short-term-rental-evaluation">
                Evaluate My Rental Potential
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact?service=list-property">
                List My Property
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. WHAT IS SHORT-TERM RENTAL
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="What Is Short-Term Rental?" />
            <motion.div
              variants={fadeIn}
              className="bg-white border border-[#C8A766]/20 rounded-2xl p-8 md:p-10 shadow-sm"
            >
              <p className="text-[#444] text-base leading-relaxed mb-6">
                Short-term rental refers to furnished property leasing for daily, weekly,
                or monthly stays under applicable tourism regulations.
              </p>
              <p className="text-[#444] text-base leading-relaxed mb-5">
                In the UAE, holiday home operations require compliance with:
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Tourism authority permits",
                  "Building or community approval (where applicable)",
                  "Guest registration procedures",
                  "Operational and hospitality standards",
                  "Safety and furnishing requirements",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#444]">
                    <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#555] text-sm italic border-l-2 border-[#C8A766] pl-4">
                This service ensures structured compliance while optimizing investor returns.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. OUR STRUCTURED MANAGEMENT MODEL
      ═══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-white to-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <SectionHeading
              title="Our Structured Management Model"
              subtitle="Five premium service pillars designed to deliver institutional-grade operations."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <PillarCard
                icon={FileCheck}
                number={1}
                title="Licensing & Regulatory Coordination"
                items={[
                  "Holiday home permit assistance (where applicable)",
                  "Tourism authority compliance alignment",
                  "Building policy verification",
                  "Documentation coordination",
                  "Operational readiness checks",
                ]}
              />
              <PillarCard
                icon={TrendingUp}
                number={2}
                title="Revenue Optimization Strategy"
                items={[
                  "Dynamic pricing intelligence",
                  "Seasonal rate adjustment",
                  "Event-based pricing models",
                  "Market benchmarking",
                  "Yield projection modeling",
                  "Occupancy optimization",
                ]}
              />
              <PillarCard
                icon={Camera}
                number={3}
                title="Premium Listing Positioning"
                items={[
                  "Professional photography coordination",
                  "Optimized listing descriptions",
                  "Channel distribution strategy",
                  "Platform performance monitoring",
                  "Reputation and review management",
                ]}
              />
              <PillarCard
                icon={Users}
                number={4}
                title="Guest Experience & Hospitality Oversight"
                items={[
                  "Guest screening protocols",
                  "Check-in coordination",
                  "Housekeeping scheduling",
                  "Quality control inspections",
                  "Maintenance escalation",
                  "Guest communication handling",
                ]}
              />
            </div>
            {/* Pillar 5 centered */}
            <div className="max-w-5xl mx-auto mt-6 flex justify-center">
              <div className="w-full md:w-1/2">
                <PillarCard
                  icon={PieChart}
                  number={5}
                  title="Financial Transparency & Reporting"
                  items={[
                    "Occupancy tracking",
                    "Revenue reporting",
                    "Expense breakdown",
                    "Net return analysis",
                    "Monthly performance summaries",
                  ]}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. SHORT-TERM VS LONG-TERM
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Short-Term vs Long-Term Strategy" />
            <motion.div
              variants={fadeIn}
              className="bg-white border border-[#C8A766]/20 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#C8A766] to-[#B8943F]">
                      <th className="text-left text-white font-semibold p-4">Category</th>
                      <th className="text-left text-white font-semibold p-4">Short-Term Rental</th>
                      <th className="text-left text-white font-semibold p-4">Long-Term Rental</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Revenue Potential", "Higher (market dependent)", "Stable"],
                      ["Flexibility", "High", "Limited"],
                      ["Operational Intensity", "High", "Moderate"],
                      ["Owner Access", "Flexible", "Restricted"],
                      ["Seasonal Exposure", "Yes", "Minimal"],
                    ].map(([cat, short, long], i) => (
                      <tr
                        key={i}
                        className={`border-b border-[#C8A766]/10 ${i % 2 === 0 ? "bg-[#FDFBF7]" : "bg-white"}`}
                      >
                        <td className="p-4 font-medium text-[#1a1a1a]">{cat}</td>
                        <td className="p-4 text-[#555]">{short}</td>
                        <td className="p-4 text-[#555]">{long}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <motion.p
              variants={fadeIn}
              className="text-[#666] text-sm leading-relaxed mt-6 text-center max-w-3xl mx-auto"
            >
              The optimal rental strategy depends on your asset type, location profile,
              and investor objectives. Our advisory framework helps you evaluate both models
              to determine the approach that aligns with your financial goals and
              operational preferences.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. WHO THIS SERVICE IS DESIGNED FOR
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Who This Service Is Designed For" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Globe, label: "Overseas investors" },
                { icon: Crown, label: "Luxury apartment owners" },
                { icon: Star, label: "Branded residence owners" },
                { icon: MapPin, label: "High-demand district property holders" },
                { icon: Briefcase, label: "Owners seeking flexible personal usage" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="flex items-center gap-4 bg-gradient-to-br from-[#FDFBF7] to-[#F3EDE0] border border-[#C8A766]/20 rounded-xl p-5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C8A766] to-[#B8943F] flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[#333] font-medium text-sm">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. PROPERTY ELIGIBILITY REQUIREMENTS
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Property Eligibility Requirements" />
            <motion.div
              variants={fadeIn}
              className="bg-white border border-[#C8A766]/20 rounded-2xl p-8 shadow-sm"
            >
              <p className="text-[#444] text-base mb-6">Properties must meet:</p>
              <ul className="space-y-3 mb-6">
                {[
                  "Furnishing standards",
                  "Safety compliance requirements",
                  "Building and community approval",
                  "Regulatory licensing conditions",
                  "Operational suitability criteria",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[#444]">
                    <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#888] text-sm italic border-l-2 border-[#C8A766]/50 pl-4">
                Not all properties qualify for short-term rental operations.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7. RISK MANAGEMENT & ASSET PROTECTION
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Risk Management & Asset Protection" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Guest verification systems",
                "Deposit and damage protocols",
                "Insurance coordination",
                "Inventory tracking",
                "Maintenance documentation",
                "Incident escalation process",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="flex items-center gap-4 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-[#C8A766]/20 rounded-xl p-5"
                >
                  <ShieldCheck className="w-5 h-5 text-[#C8A766] shrink-0" />
                  <span className="text-[#444] text-sm font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8. REVENUE PROJECTION
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Revenue Projection" />
            <motion.div
              variants={fadeIn}
              className="bg-gradient-to-br from-[#1a1610] via-[#1e1a14] to-[#0d0b09] border border-[#C8A766]/30 rounded-2xl p-8 md:p-10 text-center"
            >
              <BarChart3 className="w-10 h-10 text-[#C8A766] mx-auto mb-6" />
              <p className="text-zinc-300 text-base mb-6">We provide:</p>
              <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
                {[
                  "Estimated occupancy range",
                  "Average nightly rate forecast",
                  "Gross annual income projection",
                  "Expense ratio estimation",
                  "Net yield projection",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0 mt-1" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="lg"
                className="border-[#C8A766] text-[#C8A766] hover:bg-[#C8A766]/10"
                asChild
              >
                <Link to="/contact?service=revenue-projection">
                  Request Revenue Projection
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. OWNER PERFORMANCE DASHBOARD
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading
              title="Owner Performance Dashboard"
              subtitle="Digital reporting for complete visibility."
            />
            <motion.div
              variants={fadeIn}
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F3EB] to-[#EDE4D3] border border-[#C8A766]/25 rounded-2xl p-8"
            >
              <p className="text-[#444] mb-6">Owners receive access to:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Occupancy rate tracking",
                  "Revenue trend analysis",
                  "Booking source breakdown",
                  "Guest feedback overview",
                  "Maintenance activity logs",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[#444]">
                    <div className="w-2 h-2 rounded-full bg-[#C8A766]" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          10. OPERATIONAL WORKFLOW
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Operational Workflow" />
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#C8A766] via-[#C8A766]/40 to-transparent hidden md:block" />
              <div className="space-y-6">
                {[
                  "Property Assessment",
                  "Licensing & Compliance Setup",
                  "Furnishing & Styling (if required)",
                  "Platform Activation",
                  "Live Pricing Optimization",
                  "Continuous Performance Monitoring",
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    variants={fadeIn}
                    className="flex items-center gap-5"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C8A766] to-[#B8943F] flex items-center justify-center shrink-0 z-10 shadow-sm">
                      <span className="text-white font-bold text-sm">{i + 1}</span>
                    </div>
                    <div className="flex-1 bg-white border border-[#C8A766]/20 rounded-xl px-6 py-4 shadow-sm">
                      <span className="text-[#1a1a1a] font-medium text-sm">{step}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          11. OWNER BENEFITS
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <SectionHeading title="Owner Benefits" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                "Increased revenue potential",
                "Structured operational management",
                "Transparent reporting",
                "Asset protection oversight",
                "Brand-aligned hospitality experience",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeIn}
                  className="bg-gradient-to-br from-[#FDFBF7] to-[#F3EDE0] border border-[#C8A766]/20 rounded-xl p-6 text-center shadow-sm"
                >
                  <CheckCircle2 className="w-6 h-6 text-[#C8A766] mx-auto mb-3" />
                  <span className="text-[#333] font-medium text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          12. INQUIRY FORM
      ═══════════════════════════════════════════ */}
      <section className="bg-[#FDFBF7] py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-3xl mx-auto"
          >
            <SectionHeading
              title="Evaluate Your Short-Term Rental Strategy"
              subtitle="Submit your property details to begin the assessment process."
            />
            <motion.form
              variants={fadeIn}
              onSubmit={handleSubmit}
              className="bg-white border border-[#C8A766]/20 rounded-2xl p-8 md:p-10 shadow-sm space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Full Name</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="border-[#C8A766]/30 focus:border-[#C8A766]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-[#C8A766]/30 focus:border-[#C8A766]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Phone</Label>
                  <Input
                    placeholder="+971 XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-[#C8A766]/30 focus:border-[#C8A766]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Property Location</Label>
                  <Input
                    placeholder="e.g. Dubai Marina, Downtown"
                    value={formData.propertyLocation}
                    onChange={(e) => setFormData({ ...formData, propertyLocation: e.target.value })}
                    className="border-[#C8A766]/30 focus:border-[#C8A766]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(v) => setFormData({ ...formData, propertyType: v })}
                  >
                    <SelectTrigger className="border-[#C8A766]/30 focus:border-[#C8A766]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Number of Bedrooms</Label>
                  <Select
                    value={formData.bedrooms}
                    onValueChange={(v) => setFormData({ ...formData, bedrooms: v })}
                  >
                    <SelectTrigger className="border-[#C8A766]/30 focus:border-[#C8A766]">
                      <SelectValue placeholder="Select bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5+">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Furnished</Label>
                  <Select
                    value={formData.furnished}
                    onValueChange={(v) => setFormData({ ...formData, furnished: v })}
                  >
                    <SelectTrigger className="border-[#C8A766]/30 focus:border-[#C8A766]">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#333] text-sm font-medium">Current Rental Strategy</Label>
                  <Select
                    value={formData.currentStrategy}
                    onValueChange={(v) => setFormData({ ...formData, currentStrategy: v })}
                  >
                    <SelectTrigger className="border-[#C8A766]/30 focus:border-[#C8A766]">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="long-term">Long-Term Rental</SelectItem>
                      <SelectItem value="short-term">Short-Term Rental</SelectItem>
                      <SelectItem value="personal">Personal Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#333] text-sm font-medium">Expected Launch Timeline</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(v) => setFormData({ ...formData, timeline: v })}
                >
                  <SelectTrigger className="border-[#C8A766]/30 focus:border-[#C8A766]">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediately">Immediately</SelectItem>
                    <SelectItem value="1-month">Within 1 Month</SelectItem>
                    <SelectItem value="3-months">Within 3 Months</SelectItem>
                    <SelectItem value="6-months">Within 6 Months</SelectItem>
                    <SelectItem value="exploring">Just Exploring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#C8A766] to-[#B8943F] text-white hover:from-[#B8943F] hover:to-[#A88535] shadow-md"
              >
                <Send className="w-4 h-4 mr-2" />
                Evaluate My Short-Term Rental Strategy
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          13. CLOSING STATEMENT
      ═══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center"
          >
            <GoldDivider />
            <motion.h2
              variants={fadeIn}
              className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mt-6 mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Transform Your Property into a Performance-Driven Asset
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-[#555] text-base leading-relaxed"
            >
              Short-term rental is a structured hospitality business model — not passive leasing.
              With professional oversight, revenue optimization, and regulatory coordination,
              your property operates at institutional standards while maintaining premium positioning.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          14. COMPLIANCE NOTE
      ═══════════════════════════════════════════ */}
      <section className="bg-[#F5F0E6] py-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-[#888] text-xs leading-relaxed max-w-3xl mx-auto">
            Short-term rental operations are conducted subject to applicable tourism authority
            regulations and building approvals. Licensing requirements may vary depending on
            property location and operational structure.
          </p>
        </div>
      </section>
    </>
  );
};

export default ShortTermRentals;
