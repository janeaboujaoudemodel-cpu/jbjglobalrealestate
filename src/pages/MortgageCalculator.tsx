import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, CheckCircle, Building2, Users, Calculator, Sparkles, ArrowUpRight, Landmark } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import InquiryFormModal from "@/components/InquiryFormModal";
import { useLanguage } from "@/contexts/LanguageContext";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";

// JBJ brand palette
const PAGE = "#FDFBF7";       // champagne page
const SURFACE = "#F7F2EA";    // surface
const RAISED = "#EFE6D6";     // raised
const GOLD = "#B89555";       // gold hairline accent
const INK = "#1A1A1A";        // ink text

const advisorBenefits = [
  { icon: Shield,      title: "Expert Guidance",       body: "Our mortgage advisors work with all major UAE banks to find you the best rates." },
  { icon: CheckCircle, title: "Pre-Approval Support",  body: "Get pre-approved quickly with our streamlined documentation process." },
  { icon: Building2,   title: "Property Matching",     body: "We help match your budget to high-potential property opportunities." },
  { icon: Users,       title: "End-to-End Service",    body: "From application to disbursement, we guide you every step." },
];

const bankPartners = ["Emirates NBD", "Mashreq", "ADCB", "FAB", "HSBC", "Standard Chartered"];

const MortgageCalculatorPage = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <ToolAnimatedFrame theme={toolThemes.navy}>
      <SEOHead {...pagesSEO.mortgageCalculator} />

      <section
        className="relative w-full min-h-screen overflow-hidden"
        style={{ background: PAGE }}
      >
        {/* Hero */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm mb-8 transition-colors group"
              style={{ color: INK }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" style={{ color: INK }} />
              <span>Back to Home</span>
            </Link>

            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="inline-flex items-center mb-6 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: RAISED,
                  border: `1px solid ${GOLD}55`,
                  color: INK,
                }}
              >
                <Calculator className="w-4 h-4 mr-2" style={{ color: GOLD }} />
                FREE AI Tool
              </span>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: INK }}
              >
                Mortgage <span style={{ color: GOLD }}>Calculator</span>
              </h1>

              <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: `${INK}B3` }}>
                {t('mortgage.subtitle')}. Get accurate estimates for monthly payments, total interest and find the right financing option for your UAE property purchase.
              </p>

              <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-10">
                {[
                  { Icon: CheckCircle, title: "Instant Estimates",  body: "Monthly payment, total interest, and loan breakdown in real time" },
                  { Icon: Sparkles,    title: "All Major UAE Banks", body: "Tuned to current local rates and down-payment rules" },
                  { Icon: Shield,      title: "100% Free",            body: "No signup required, no commitment — just clarity" },
                ].map(({ Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-xl p-4 text-left"
                    style={{
                      background: SURFACE,
                      border: `1px solid ${GOLD}40`,
                    }}
                  >
                    <Icon className="w-7 h-7 mb-2" style={{ color: GOLD }} />
                    <p className="font-medium" style={{ color: INK }}>{title}</p>
                    <p className="text-sm" style={{ color: `${INK}B3` }}>{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Calculator body — champagne raised card */}
        <div className="container mx-auto px-4 pt-8 md:pt-12 pb-16">
          <div className="max-w-5xl mx-auto">
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: SURFACE,
                border: `1px solid ${GOLD}55`,
                boxShadow: `0 18px 50px -20px ${GOLD}33`,
              }}
            >
              <div className="px-4 md:px-8 py-8 md:py-10">
                <MortgageCalculator compact showHeading={false} showAssistant />
              </div>
            </div>
          </div>

          {/* Advisor benefits and bank partners — champagne tiles */}
          <div className="max-w-5xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: INK }}>
                Prefer a <span style={{ color: GOLD }}>Mortgage Advisor</span> Through Our Licensed Partners?
              </h2>
              <p className="mt-3 max-w-2xl mx-auto" style={{ color: `${INK}B3` }}>
                Our calculator gives you instant estimates. For personalized guidance through our licensed partners, we connect you with dedicated mortgage advisors.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {advisorBenefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl p-5"
                  style={{
                    background: SURFACE,
                    border: `1px solid ${GOLD}40`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: RAISED,
                      border: `1px solid ${GOLD}55`,
                    }}
                  >
                    <b.icon className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: INK }}>{b.title}</h3>
                  <p className="text-sm" style={{ color: `${INK}B3` }}>{b.body}</p>
                </div>
              ))}
            </div>

            <div
              className="mt-8 rounded-[24px] p-5 md:p-6 overflow-hidden relative"
              style={{
                background: `linear-gradient(135deg, ${SURFACE} 0%, #FFFFFF 52%, ${RAISED} 100%)`,
                border: `1.5px solid ${GOLD}`,
                boxShadow: `0 18px 48px -28px ${GOLD}55`,
              }}
            >
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-20" style={{ background: "radial-gradient(circle at 100% 0%, rgba(6,78,59,0.28), transparent 62%)" }} />
              <div className="relative flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div data-surface="emerald" data-emerald="true" className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg jj-title-emerald">Bank Partner Network</h3>
                    <p className="text-sm" style={{ color: `${INK}B3` }}>Introductions through licensed mortgage partners connected with leading UAE banks.</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 md:justify-end">
                  {bankPartners.map((bank) => (
                    <span
                      key={bank}
                      className="jj-bank-partner-chip rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em]"
                      style={{
                        background: "rgba(255,255,255,0.74)",
                        border: `1px solid ${GOLD}80`,
                      }}
                    >
                      {bank}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => setIsInquiryOpen(true)}
                data-emerald-action="true"
                data-surface="emerald"
                data-emerald="true"
                className="jj-emerald-action inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold rounded-xl transition-all hover:scale-[1.02]"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Request Mortgage Partner Introduction</span>
                <ArrowUpRight className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </button>

              <p className="mt-6 text-xs max-w-2xl mx-auto" style={{ color: `${INK}99` }}>
                <strong>Disclaimer:</strong> This calculator provides estimates for informational purposes only and does not constitute financial advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        source="mortgage-advisory"
      />
      <ActiveLeadBanner showAddToShortlist={false} />
    </ToolAnimatedFrame>
  );
};

export default MortgageCalculatorPage;
