import { motion } from "framer-motion";
import {
  Building2,
  Scale,
  Briefcase,
  Hotel,
  TrendingUp,
  Handshake,
  ArrowUpRight,
  Download,
  CheckCircle,
  Shield,
  Globe,
  Users,
  Sparkles,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionDivider } from "@/components/ui/section-divider";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { useToast } from "@/hooks/use-toast";
import { PartnerApplicationPortal } from "@/components/partners/PartnerApplicationPortal";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const PARTNERSHIP_CATEGORIES = [
  {
    title: "Developer Partnerships",
    icon: Building2,
    forList: ["Off-plan developers", "Luxury residential brands", "Boutique developers", "International project sponsors"],
    scope: ["Project launch support", "Structured sales channel distribution", "Market positioning strategy", "Investor acquisition campaigns", "AI-powered listing optimization"],
  },
  {
    title: "Investor & Private Capital Partnerships",
    icon: TrendingUp,
    forList: ["Private investors", "Family offices", "Institutional investors", "Investment groups"],
    scope: ["Deal sourcing", "Structured acquisition advisory", "ROI modeling", "Asset strategy", "Long-term portfolio management coordination"],
  },
  {
    title: "Brokerage & Channel Partnerships",
    icon: Handshake,
    forList: ["International brokerages", "Independent brokers", "Referral partners"],
    scope: ["Co-listing structures", "Cross-market collaboration", "Commission agreements", "Structured deal flow", "Shared investor network access"],
  },
  {
    title: "Legal & Financial Institution Partnerships",
    icon: Scale,
    forList: ["Law firms", "Mortgage providers", "Tax advisors", "Corporate structuring consultants"],
    scope: ["Integrated client advisory", "Joint case structuring", "Investor protection framework", "Regulatory compliance support"],
  },
  {
    title: "Hospitality & Luxury Brand Collaborations",
    icon: Hotel,
    forList: ["Short-term rental operators", "Property management firms", "Luxury lifestyle brands", "Concierge providers"],
    scope: ["Premium asset positioning", "Lifestyle-based sales strategy", "High-end client targeting"],
  },
];

const PROCESS_STEPS = [
  { num: 1, title: "Initial Qualification", items: ["Strategic alignment", "Market positioning", "Compliance framework", "Value-add synergy"] },
  { num: 2, title: "Strategic Framework Design", items: ["Partnership scope", "Revenue model", "Operational structure", "Marketing strategy"] },
  { num: 3, title: "Legal & Commercial Agreement", items: ["Scope of work", "Commission structure", "Confidentiality", "Compliance obligations"] },
  { num: 4, title: "Integration & Launch", items: ["CRM integration (if required)", "Project onboarding", "Asset data synchronization", "Go-live campaign launch"] },
  { num: 5, title: "Performance Tracking", items: ["KPI monitoring", "Reporting structure", "Revenue tracking", "Ongoing optimization"] },
];

const REGIONS = ["UAE", "Europe", "Asia", "Middle East", "CIS Markets", "Latin America"];

const PARTNERSHIP_TYPES = [
  "Developer Partnership",
  "Investor & Private Capital",
  "Brokerage & Channel",
  "Legal & Financial Institution",
  "Hospitality & Luxury Brand",
  "Other",
];

const Partners = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
      <main className="pt-0">

        {/* ═══ HERO ═══ */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          {/* Subtle gold spiral accents */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#EFE6D6]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#EFE6D6]/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeIn}>
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-full px-5 py-2.5 mb-6 shadow-sm cursor-default hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
                  <Handshake className="w-4 h-4 text-[#1A1A1A]" />
                  <span className="text-[#1A1A1A] font-semibold text-xs uppercase tracking-[0.2em]">Strategic Partnerships</span>
                </button>
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Strategic Partnerships with{" "}
                <span className="text-[#1A1A1A]">JBJ Global Real Estate</span>
              </motion.h1>

              <motion.p variants={fadeIn} className="text-lg md:text-xl text-[#1A1A1A]/70 mb-4 leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: "'Playfair Display', serif" }}>
                Build with Us. Scale with Us. Lead with Us.
              </motion.p>

              <motion.p variants={fadeIn} className="text-base text-[#1A1A1A]/70 mb-10 leading-relaxed max-w-3xl mx-auto">
                We collaborate with developers, investors, private offices, brokers, legal firms, hospitality brands, and global institutions to create long-term value and high-performance real estate ecosystems.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-4">
                <a href="#partner-application">
                  <Button variant="primary" size="lg" className="px-8">
                    <Sparkles className="w-5 h-5 mr-2 text-[#1A1A1A]" />
                    Become a Partner
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href={`mailto:${CONTACT_INFO.email}?subject=Partnership%20Overview%20Request`}>
                  <Button variant="secondary" size="lg" className="px-8">
                    <Download className="w-5 h-5 mr-2" />
                    Download Partnership Overview
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 1: WHY PARTNER ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-center text-[#1A1A1A] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Why Collaborate with <span className="text-[#1A1A1A]">JBJ</span>
              </motion.h2>

              <motion.p variants={fadeIn} className="text-center text-[#1A1A1A]/70 mb-12 max-w-3xl mx-auto leading-relaxed">
                JBJ Global Real Estate operates at the intersection of luxury advisory, structured real estate execution, digital innovation, and international client networks. Our partnership model is designed to create scalable, compliant, and measurable growth.
              </motion.p>

              <motion.div variants={fadeIn} className="jj-card-inner p-8 md:p-10">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  What Makes Us <span className="text-[#1A1A1A]">Different</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Licensed buy–sell–rent real estate advisory structure",
                    "High-net-worth investor network",
                    "Multi-language global client base",
                    "Integrated AI & property intelligence ecosystem",
                    "Premium digital marketing infrastructure",
                    "Structured onboarding and reporting framework",
                    "Compliance-focused operational execution",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      <span className="text-[#1A1A1A]/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-[#B89555]/20">
                  <p className="text-[#1A1A1A]/70 italic text-sm">We do not offer generic collaborations. <span className="text-[#1A1A1A] font-semibold not-italic">We build structured alliances.</span></p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 2: PARTNERSHIP CATEGORIES ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-6xl mx-auto">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-center text-[#1A1A1A] mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Partnership <span className="text-[#1A1A1A]">Structures</span>
              </motion.h2>

              <div className="grid md:grid-cols-2 gap-8">
                {PARTNERSHIP_CATEGORIES.map((cat, i) => (
                  <motion.div key={i} variants={fadeIn} className="jj-card-inner p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="jj-icon-box-active w-12 h-12 rounded-lg flex-shrink-0">
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-[#1A1A1A]">{cat.title}</h3>
                    </div>

                    <div className="mb-5">
                      <p className="text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold mb-2">For</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.forList.map((f) => (
                          <span key={f} className="text-xs bg-[#EFE6D6]/10 border border-[#B89555]/30 text-[#1A1A1A]/70 rounded-full px-3 py-1">{f}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold mb-2">Scope</p>
                      <ul className="space-y-1.5">
                        {cat.scope.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                            <CheckCircle className="w-3.5 h-3.5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 3: PARTNERSHIP PROCESS (Timeline) ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-center text-[#1A1A1A] mb-12" style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Structured Partnership <span className="text-[#1A1A1A]">Process</span>
              </motion.h2>

              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-gold/50 via-gold/30 to-transparent" />

                <div className="space-y-10">
                  {PROCESS_STEPS.map((step) => (
                    <motion.div key={step.num} variants={fadeIn} className="relative pl-16 md:pl-20">
                      {/* Step number circle */}
                      <div className="absolute left-0 top-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 flex items-center justify-center shadow-md z-10">
                        <span className="text-lg md:text-xl font-bold text-[#1A1A1A]">{step.num}</span>
                      </div>

                      <div className="jj-card-inner p-5 md:p-6">
                        <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">{step.title}</h3>
                        <ul className="space-y-1.5">
                          {step.items.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                              <CheckCircle className="w-3.5 h-3.5 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 4: COMPLIANCE & GOVERNANCE ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeIn} className="flex items-center justify-center gap-3 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-lg">
                  <Shield className="w-6 h-6" />
                </div>
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                Governance & Regulatory <span className="text-[#1A1A1A]">Integrity</span>
              </motion.h2>

              <motion.div variants={fadeIn} className="jj-card-inner p-8 md:p-10 text-left">
                <p className="text-[#1A1A1A]/70 mb-6">All partnerships operate within:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "UAE real estate regulatory framework",
                    "RERA compliance standards",
                    "Contractual transparency",
                    "Anti-money laundering guidelines",
                    "Data protection regulations",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      <span className="text-[#1A1A1A]/70 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-[#1A1A1A]/70 italic text-sm">We prioritize structured, ethical, and <span className="text-[#1A1A1A] font-semibold not-italic">compliant growth.</span></p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 5: IDEAL PROFILES ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-center text-[#1A1A1A] mb-10" style={{ fontFamily: "'Playfair Display', serif" }}>
                Ideal Partnership <span className="text-[#1A1A1A]">Profiles</span>
              </motion.h2>

              <motion.div variants={fadeIn} className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Established developers seeking global distribution",
                  "Investment groups seeking structured sourcing",
                  "Brokerages seeking premium positioning",
                  "Service providers aligned with luxury real estate",
                  "Strategic investors building long-term UAE exposure",
                ].map((profile, i) => (
                  <div key={i} className="jj-card-inner p-5 text-center">
                    <Users className="w-6 h-6 text-[#1A1A1A] mx-auto mb-3" />
                    <p className="text-sm text-[#1A1A1A]/70 font-medium">{profile}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 6: GLOBAL POSITIONING ═══ */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/5" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeIn} className="flex items-center justify-center gap-3 mb-6">
                <div className="jj-icon-box-active w-12 h-12 rounded-lg">
                  <Globe className="w-6 h-6" />
                </div>
              </motion.div>
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                International <span className="text-[#1A1A1A]">Collaboration</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-[#1A1A1A]/70 mb-10">We collaborate across:</motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap justify-center gap-3 mb-10">
                {REGIONS.map((r) => (
                  <span key={r} className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] font-semibold text-sm rounded-full px-5 py-2.5 shadow-sm hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">{r}</span>
                ))}
              </motion.div>

              <motion.div variants={fadeIn} className="space-y-1">
                <p className="text-[#1A1A1A]/70">Our network is <span className="text-[#1A1A1A] font-semibold">international.</span></p>
                <p className="text-[#1A1A1A]/70">Our execution is <span className="text-[#1A1A1A] font-semibold">local.</span></p>
                <p className="text-[#1A1A1A]/70">Our positioning is <span className="text-[#1A1A1A] font-semibold">premium.</span></p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 7: PARTNER PORTAL ═══ */}
        <section id="partner-application" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-center text-[#1A1A1A] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Partner <span className="text-[#1A1A1A]">Portal</span>
              </motion.h2>
              <motion.p variants={fadeIn} className="text-center text-[#1A1A1A]/70 mb-10">
                Apply for partnership, submit your proposal, and track your application status in real-time.
              </motion.p>

              <motion.div variants={fadeIn}>
                <PartnerApplicationPortal />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <SectionDivider variant="champagne" />

        {/* ═══ SECTION 8: CLOSING STATEMENT ═══ */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto text-center">
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Let's Build Strategic <span className="text-[#1A1A1A]">Growth Together</span>
              </motion.h2>
              <motion.div variants={fadeIn} className="space-y-3 text-[#1A1A1A]/70 mb-8">
                <p>At JBJ Global Real Estate, partnerships are not transactional.</p>
                <p>They are <span className="text-[#1A1A1A] font-semibold">strategic, structured, and long-term.</span></p>
                <p>If you are aligned with excellence, compliance, and scale — we invite you to connect.</p>
              </motion.div>
              <motion.div variants={fadeIn}>
                <a href="#partner-application">
                  <Button variant="primary" size="lg" className="px-10">
                    <Sparkles className="w-5 h-5 mr-2 text-[#1A1A1A]" />
                    Become a Partner
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto jj-card-inner rounded-lg p-6">
              <ComplianceDisclaimer variant="full" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Partners;
