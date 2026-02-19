import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle, Building2, Users, ArrowUpRight, ArrowRight } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import InquiryFormModal from "@/components/InquiryFormModal";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO } from "@/constants/stats";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";

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
    <section className="min-h-screen bg-black">
      {/* Hero Section - Champagne Layer */}
      <div className="relative py-16 md:py-24 bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-black/70 hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl mb-12">
            <span className="inline-block px-4 py-1.5 bg-gold/20 border border-gold/40 rounded-full text-gold text-sm font-medium mb-6">
              AI-Powered Financial Planning
            </span>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="text-black">Mortgage</span>{" "}
              <span className="text-gold">Calculator</span>
            </h1>
            <p className="text-black/70 text-lg md:text-xl leading-relaxed">
              {t('mortgage.subtitle')}. Plan your property investment with our advanced mortgage calculator. Get accurate estimates for monthly payments, total interest, and find the perfect financing option for your UAE property purchase.
            </p>
          </div>

          {/* Calculator */}
          <MortgageCalculator compact />

          {/* CTA Button - Centered at bottom of calculator section */}
          <div className="mt-8 lg:mt-12 flex justify-center">
            <a 
              href={CONTACT_INFO.inquiryFormUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full max-w-md"
            >
              <Button 
                variant="primary" 
                className="w-full h-14 text-base font-semibold group shadow-lg hover:shadow-[0_14px_45px_rgba(200,167,102,0.4)] hover:-translate-y-1 transition-all duration-300"
              >
                Request Mortgage Partner Introduction
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Mortgage Advisors Section - Champagne Layer */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-black/10 border border-gold/40 rounded-full text-black/80 text-sm font-medium mb-6">
              Professional Support
            </span>
            <h2 
              className="text-3xl md:text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Prefer a <span className="text-gold">Mortgage Advisor</span> Through Our Licensed Partners?
            </h2>
            <p className="text-black/70 max-w-2xl mx-auto">
              Our calculator gives you instant estimates, but for personalized guidance, through our licensed partners, we connect you with dedicated mortgage advisors who work with leading UAE banks to secure the best rates and terms for your property investment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advisorBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="group bg-white/60 backdrop-blur-sm border border-gold/30 rounded-xl p-6 hover:border-gold/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/20"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-black/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banks Section - Dark with gold accents */}
      <div className="py-16 border-t border-gold/20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-gold/60 text-sm uppercase tracking-wider mb-2">Partnered With</p>
            <h3 className="text-xl font-semibold text-white">Leading UAE Banks</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {["Emirates NBD", "ADCB", "FAB", "Mashreq", "DIB", "RAKBANK"].map((bank) => (
              <div key={bank} className="text-white/70 font-semibold text-lg hover:text-gold transition-colors">
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Premium Champagne */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-[#E8DCC8] to-[#F5EBD7]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Secure Your <span className="text-gold">Mortgage?</span>
            </h2>
            <p className="text-black/70 text-lg mb-8">
              Speak with our mortgage advisors today and get personalized guidance for your property investment financing needs.
            </p>
            <button 
              onClick={() => setIsInquiryOpen(true)}
              className="relative inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold rounded-xl transition-all duration-300 bg-black border-2 border-gold/60 hover:scale-[1.02] transform active:scale-95 group"
              style={{
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.3),
                  0 6px 15px rgba(0,0,0,0.3),
                  0 0 20px rgba(200,167,102,0.2)
                `,
              }}
            >
              <span className="text-white group-hover:text-gold transition-colors">{t('mortgage.contactAdvisor')}</span>
              <ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Financial Disclaimer */}
        <div className="mt-8 p-4 bg-zinc-900/60 border border-gold/20 rounded-xl max-w-4xl mx-auto">
          <p className="text-zinc-400 text-sm leading-relaxed">
            <strong className="text-zinc-300">Disclaimer:</strong> This calculator provides estimates for informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
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
