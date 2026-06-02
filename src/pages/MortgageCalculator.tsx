import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle, Building2, Users, ArrowUpRight, ArrowRight } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import InquiryFormModal from "@/components/InquiryFormModal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO } from "@/constants/stats";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { AnimatedBorderShell } from "@/components/tools/AnimatedBorderShell";
import { AnimatedShineCTA } from "@/components/tools/AnimatedShineCTA";

const advisorBenefits = [
  {
    icon: Shield,
    title: "Expert Guidance",
    description: "Our mortgage advisors work with all major UAE banks to find you the best rates"
  },
  {
    icon: CheckCircle,
    title: "Pre-Approval Support",
    description: "Get pre-approved quickly with our streamlined documentation process"
  },
  {
    icon: Building2,
    title: "Property Matching",
    description: "We help match your budget to high-potential property opportunities"
  },
  {
    icon: Users,
    title: "End-to-End Service",
    description: "From application to disbursement, we guide you every step"
  },
];

const MortgageCalculatorPage = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <section className="min-h-screen bg-[#F7F2EA]">
      <SEOHead {...pagesSEO.mortgageCalculator} />

      {/* Tool shell — navy hero + form inside a single animated-border card */}
      <div className="container mx-auto px-4 pt-6 md:pt-8 pb-12">
        <div className="jbj-neon-frame">
        <AnimatedBorderShell tone="navy" className="overflow-hidden">
          <div className="bg-[#0b1626]">
            {/* Navy hero header with back inside, centered title */}
            <div
              className="relative px-6 md:px-10 pt-6 pb-12 md:pb-16 text-center"
              data-allow-dark-cta
              data-on-dark
              style={{
                background:
                  "radial-gradient(120% 80% at 50% 0%, #14305a 0%, #102540 55%, #0b1c33 100%)",
              }}
            >
              <div className="absolute top-5 left-5 md:left-8">
                <Link
                  to="/"
                  data-no-contrast-guard
                  data-on-dark
                  className="inline-flex items-center gap-2 text-white/85 hover:text-white text-sm transition-colors group allow-white"
                  style={{ color: "#FFFFFF" }}
                >
                  <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" />
                  <span className="text-white">Back to Home</span>
                </Link>
              </div>

              <div className="max-w-3xl mx-auto pt-6">
                <span
                  data-no-contrast-guard
                  data-on-dark
                  className="allow-white inline-block px-4 py-1.5 bg-white/10 border border-white/30 rounded-full text-white text-xs md:text-sm font-medium mb-5"
                  style={{ color: "#FFFFFF" }}
                >
                  AI-Powered Financial Planning
                </span>
                <h1
                  data-no-contrast-guard
                  data-on-dark
                  className="allow-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
                  style={{ color: "#FFFFFF" }}
                >
                  Mortgage Calculator
                </h1>
                <p
                  data-no-contrast-guard
                  data-on-dark
                  className="allow-white text-white/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {t('mortgage.subtitle')}. Plan your property investment with our advanced mortgage calculator. Get accurate estimates for monthly payments, total interest, and find the perfect financing option for your UAE property purchase.
                </p>
              </div>
            </div>

            {/* Calculator body on champagne, wrapped by the navy border */}
            <div className="bg-[#F7F2EA] px-4 md:px-8 py-8 md:py-10">
              <MortgageCalculator compact showHeading={false} showAssistant />

              <div className="mt-8 lg:mt-10 flex justify-center">
                <AnimatedShineCTA
                  as="a"
                  href={CONTACT_INFO.inquiryFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  tone="navy"
                  className="w-full max-w-md h-14 text-base"
                >
                  Request Mortgage Partner Introduction
                </AnimatedShineCTA>
              </div>
            </div>
          </div>
        </AnimatedBorderShell>
      </div>

      {/* Mortgage Advisors Section - Champagne Layer */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-[#102540]/10 border border-[#102540]/30 rounded-full text-[#102540] text-sm font-semibold mb-6">
              Professional Support
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
            >
              Prefer a <span className="text-[#102540]">Mortgage Advisor</span> Through Our Licensed Partners?
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Our calculator gives you instant estimates, but for personalized guidance, through our licensed partners, we connect you with dedicated mortgage advisors who work with leading UAE banks to secure the best rates and terms for your property investment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advisorBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="group bg-[#FDFBF7]/60 backdrop-blur-sm border border-[#B89555]/30 rounded-xl p-6 hover:border-[#B89555]/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/20"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-[#B89555]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 group-hover:text-[#1A1A1A] transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[#1A1A1A]/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banks Section - Navy with white wordmarks */}
      <div
        className="py-16 border-t border-[#B89555]/20 bg-[#102540]"
        data-allow-dark-cta
        data-on-dark
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-white/70 text-sm uppercase tracking-wider mb-2">Partnered With</p>
            <h3 className="text-xl font-semibold text-white">Leading UAE Banks</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {["Emirates NBD", "ADCB", "FAB", "Mashreq", "DIB", "RAKBANK"].map((bank) => (
              <div
                key={bank}
                data-on-dark
                data-no-contrast-guard
                className="px-5 py-3 rounded-lg border border-white/25 bg-white/5 text-white font-semibold text-base md:text-lg tracking-wide hover:bg-white/10 hover:border-white/50 transition-colors allow-white"
                style={{ color: "#FFFFFF" }}
              >
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Full-bleed, square corners, premium beige */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-[#ECE2D2] to-[#F7F1E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6"
            >
              Ready to Secure Your <span className="text-[#1A1A1A]">Mortgage?</span>
            </h2>
            <p className="text-[#1A1A1A]/70 text-lg mb-8">
              Speak with our mortgage advisors today and get personalized guidance for your property investment financing needs.
            </p>
            <button
              onClick={() => setIsInquiryOpen(true)}
              data-allow-dark-cta
              data-on-dark
              className="allow-white relative inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold rounded-lg transition-all duration-300 bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/60 text-white hover:scale-[1.02] transform active:scale-95 group shadow-[0_10px_30px_rgba(16,37,64,0.35)]"
            >
              <span className="font-bold text-white">{t('mortgage.contactAdvisor')}</span>
              <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Financial Disclaimer — premium beige styling */}
        <div className="mt-8 p-5 bg-gradient-to-r from-[#D8C7A6]/40 to-[#ECE2D2]/40 border border-[#B89555]/30 max-w-4xl mx-auto">
          <p className="text-[#1A1A1A]/60 text-sm leading-relaxed">
            <strong className="text-[#1A1A1A]/80">Disclaimer:</strong> This calculator provides estimates for informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="text-[#1A1A1A] hover:underline font-medium">Contact our team</Link> for professional guidance.
          </p>
        </div>
      </div>

      {/* Inquiry Form Modal */}
      <InquiryFormModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        source="mortgage-advisory"
      />
      
      <ActiveLeadBanner showAddToShortlist={false} />
    </section>
  );
};

export default MortgageCalculatorPage;
