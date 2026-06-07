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

// Neon palette — cyan primary, magenta accent, deep navy base
const NAVY = "#06B6D4";        // cyan-500
const NAVY_GLOW = "#22D3EE";   // cyan-400
const NAVY_DARK = "#05060F";   // deep navy

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
        data-neon-page
        data-allow-dark-cta
        data-no-contrast-guard
        data-on-dark
        className="allow-white relative w-full min-h-screen overflow-hidden"
        style={{ background: "#05060F" }}
      >
        {/* Extra accent orb (page shell already provides cyan+magenta) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 left-1/3 w-[460px] h-[460px] rounded-full blur-3xl opacity-30"
               style={{ background: "radial-gradient(circle, #A78BFA 0%, transparent 70%)", animation: "jjNeonPageOrb 26s ease-in-out infinite" }} />
        </div>


        {/* Hero */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(5,6,15,0.85) 55%, #000000 100%)`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,211,238,0.22),transparent_55%)]" />


          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/"
              data-no-contrast-guard
              className="allow-white inline-flex items-center gap-2 text-white/85 hover:text-white text-sm mb-8 transition-colors group"
              style={{ color: "#FFFFFF" }}
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform allow-white" />
              <span className="text-white allow-white">Back to Home</span>
            </Link>

            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className="allow-white inline-flex items-center mb-6 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: "rgba(96,165,250,0.18)",
                  border: "1px solid rgba(96,165,250,0.45)",
                  color: "#DBEAFE",
                }}
              >
                <Calculator className="w-4 h-4 mr-2" style={{ color: NAVY_GLOW }} />
                FREE AI Tool
              </span>

              <h1
                className="allow-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ color: "#FFFFFF" }}
              >
                Mortgage{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #93C5FD, #60A5FA, #2563EB)`,
                    WebkitBackgroundClip: "text",
                  }}
                >
                  Calculator
                </span>
              </h1>

              <p className="allow-white text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.85)" }}>
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
                    data-allow-dark-cta
                    data-no-contrast-guard
                    className="allow-white rounded-xl p-4 text-left"
                    style={{
                      background: `linear-gradient(135deg, #102540 0%, #0A1830 55%, #000 100%)`,
                      border: `1px solid rgba(96,165,250,0.32)`,
                    }}
                  >
                    <Icon className="w-7 h-7 mb-2" style={{ color: NAVY_GLOW }} />
                    <p className="font-medium" style={{ color: "rgba(255,255,255,0.94)" }}>{title}</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>{body}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Calculator body — dark glowing card */}
        <div className="container mx-auto px-4 pt-8 md:pt-12 pb-16">
          <div className="max-w-5xl mx-auto">
            <div
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0B2244 0%, #08152B 45%, #000 100%)",
                border: "1px solid rgba(96,165,250,0.35)",
                boxShadow:
                  "0 0 0 1px rgba(96,165,250,0.25), 0 18px 50px rgba(30,78,140,0.35), inset 0 0 28px rgba(96,165,250,0.10)",
              }}
            >
              <div className="px-4 md:px-8 py-8 md:py-10" data-mortgage-dark>
                <MortgageCalculator compact showHeading={false} showAssistant themeVariant="navy" />
              </div>
            </div>
          </div>

          {/* Advisor benefits and bank partners — dark glowing tiles */}
          <div className="max-w-5xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="allow-white text-2xl md:text-3xl font-bold" style={{ color: "#FFFFFF" }}>
                Prefer a{" "}
                <span style={{ color: NAVY_GLOW }}>Mortgage Advisor</span>{" "}
                Through Our Licensed Partners?
              </h2>
              <p className="allow-white mt-3 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
                Our calculator gives you instant estimates. For personalized guidance through our licensed partners, we connect you with dedicated mortgage advisors.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {advisorBenefits.map((b) => (
                <div
                  key={b.title}
                  data-allow-dark-cta
                  data-no-contrast-guard
                  className="allow-white rounded-xl p-5"
                  style={{
                    background: "linear-gradient(135deg, #102540 0%, #08152B 60%, #000 100%)",
                    border: "1px solid rgba(96,165,250,0.30)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "rgba(96,165,250,0.16)",
                      border: "1px solid rgba(96,165,250,0.45)",
                    }}
                  >
                    <b.icon className="w-5 h-5 allow-white" style={{ color: NAVY_GLOW }} />
                  </div>
                  <h3 className="font-semibold mb-1 allow-white" style={{ color: "#FFFFFF" }}>{b.title}</h3>
                  <p className="text-sm allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>{b.body}</p>
                </div>
              ))}
            </div>

            <div
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white mt-8 rounded-2xl p-5 md:p-6"
              style={{
                background: "linear-gradient(135deg, #123968 0%, #08152B 55%, #000 100%)",
                border: "1px solid rgba(96,165,250,0.35)",
                boxShadow: "inset 0 0 28px rgba(96,165,250,0.10)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(96,165,250,0.16)", border: "1px solid rgba(147,197,253,0.45)" }}>
                    <Landmark className="w-6 h-6 allow-white" style={{ color: NAVY_GLOW }} />
                  </div>
                  <div>
                    <h3 className="allow-white font-bold text-lg" style={{ color: "#FFFFFF" }}>Bank Partner Network</h3>
                    <p className="allow-white text-sm" style={{ color: "rgba(255,255,255,0.68)" }}>Introductions through licensed mortgage partners connected with leading UAE banks.</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 md:justify-end">
                  {bankPartners.map((bank) => (
                    <span
                      key={bank}
                      className="allow-white rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{
                        color: "#FFFFFF",
                        background: "linear-gradient(135deg, #FFFFFF 0%, #93C5FD 18%, #1E4E8C 58%, #06101E 100%)",
                        border: "1px solid rgba(191,219,254,0.78)",
                        boxShadow: "0 0 0 1px rgba(147,197,253,0.25), 0 8px 22px rgba(96,165,250,0.24), inset 0 1px 0 rgba(255,255,255,0.55)",
                        textShadow: "0 2px 12px rgba(0,0,0,0.65)",
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
                data-allow-dark-cta
                data-no-contrast-guard
                className="allow-white inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #93C5FD 18%, #1E4E8C 58%, #06101E 100%)",
                  border: "1px solid rgba(191,219,254,0.78)",
                  color: "#FFFFFF",
                  boxShadow: "0 0 0 1px rgba(147,197,253,0.35), 0 12px 36px rgba(96,165,250,0.42), inset 0 1px 0 rgba(255,255,255,0.55)",
                  textShadow: "0 2px 14px rgba(0,0,0,0.65)",
                }}
              >
                Request Mortgage Partner Introduction
                <ArrowUpRight className="w-5 h-5 allow-white" />
              </button>

              <p className="mt-6 text-xs allow-white max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
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

      {/* Force Mortgage Calculator inputs to render dark/navy inside this shell */}
      <style>{`
        [data-mortgage-dark] .bg-\\[\\#F7F2EA\\] {
          background: linear-gradient(135deg, #0F2849 0%, #08172E 100%) !important;
          border-color: rgba(96,165,250,0.30) !important;
        }
        [data-mortgage-dark] .text-\\[\\#1A1A1A\\],
        [data-mortgage-dark] .text-\\[\\#1A1A1A\\]\\/70,
        [data-mortgage-dark] .text-\\[\\#1A1A1A\\]\\/60 {
          color: #FFFFFF !important;
        }
        [data-mortgage-dark] .text-\\[\\#102540\\] { color: #93C5FD !important; }
        [data-mortgage-dark] .border-\\[\\#B89555\\]\\/30 { border-color: rgba(96,165,250,0.30) !important; }
        [data-mortgage-dark] .bg-\\[\\#EFE6D6\\] { background: rgba(96,165,250,0.18) !important; }
        [data-mortgage-dark] .bg-\\[\\#B89555\\] { background: #60A5FA !important; }
      `}</style>
    </ToolAnimatedFrame>
  );
};

export default MortgageCalculatorPage;
