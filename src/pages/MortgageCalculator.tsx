import { useState } from "react";
import { ArrowUpRight, Calculator, Shield, CheckCircle, Building2, Users, Landmark } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import InquiryFormModal from "@/components/InquiryFormModal";
import { useLanguage } from "@/contexts/LanguageContext";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { PremiumToolShell } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";

const EMERALD_CARD = "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)";
const WHITE_HAIRLINE = "1px solid rgba(255,255,255,0.34)";

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
    <PremiumToolShell
      theme={toolThemes.emerald}
      eyebrowIcon={Calculator}
      eyebrow="AI-Powered Mortgage Tool"
      title="Mortgage Calculator"
      subtitle={`${t('mortgage.subtitle')}. Get accurate estimates for monthly payments, total interest and find the right financing option for your UAE property purchase.`}
    >
      <SEOHead {...pagesSEO.mortgageCalculator} />

      <div className="w-full space-y-8 md:space-y-10">
        {/* Calculator — dark emerald card */}
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-4 md:p-8 overflow-hidden"
            style={{ background: EMERALD_CARD, border: WHITE_HAIRLINE, boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
          >
            <MortgageCalculator compact showHeading={false} showAssistant themeVariant="navy" />
          </div>
        </div>

        {/* Advisor section — dark emerald cards, pure white ink, no gold */}
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-6 md:p-10 overflow-hidden"
            style={{ background: EMERALD_CARD, border: WHITE_HAIRLINE, boxShadow: "0 8px 32px rgba(0,0,0,0.45)" }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "#FFFFFF" }}>
                Prefer a Mortgage Advisor Through Our Licensed Partners?
              </h2>
              <p className="mt-3 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.82)" }}>
                Our calculator gives you instant estimates. For personalized guidance through our licensed partners,
                we connect you with dedicated mortgage advisors.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {advisorBenefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl p-5"
                  style={{
                    background: "linear-gradient(135deg, rgba(4,40,28,0.85), rgba(0,0,0,0.85))",
                    border: WHITE_HAIRLINE,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000 100%)",
                      border: "1px solid rgba(255,255,255,0.42)",
                    }}
                  >
                    <b.icon className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </div>
                  <h3 className="font-semibold mb-1" style={{ color: "#FFFFFF" }}>{b.title}</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>{b.body}</p>
                </div>
              ))}
            </div>

            {/* Bank partner network */}
            <div
              className="mt-8 rounded-2xl p-5 md:p-6 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(4,40,28,0.75), rgba(0,0,0,0.85))",
                border: WHITE_HAIRLINE,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000 100%)",
                      border: "1px solid rgba(255,255,255,0.42)",
                    }}
                  >
                    <Landmark className="w-6 h-6" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: "#FFFFFF" }}>Bank Partner Network</h3>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>
                      Introductions through licensed mortgage partners connected with leading UAE banks.
                    </p>
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 md:justify-end">
                  {bankPartners.map((bank) => (
                    <span
                      key={bank}
                      className="rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em]"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.42)",
                        color: "#FFFFFF",
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
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold rounded-xl transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.46)",
                  boxShadow: "0 0 28px rgba(16,185,129,0.45)",
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                <span style={{ color: "#FFFFFF" }}>Request Mortgage Partner Introduction</span>
                <ArrowUpRight className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </button>

              <p className="mt-6 text-xs max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.68)" }}>
                <strong>Disclaimer:</strong> This calculator provides estimates for informational purposes only and does not constitute financial advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      <InquiryFormModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        source="mortgage-advisory"
      />
      <ActiveLeadBanner showAddToShortlist={false} />
    </PremiumToolShell>
  );
};

export default MortgageCalculatorPage;
