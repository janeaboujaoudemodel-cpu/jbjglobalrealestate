import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle, Building2, Users, ArrowUpRight } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import InquiryFormModal from "@/components/InquiryFormModal";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";

const benefits = [
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
    <section className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 bg-gradient-to-b from-zinc-900 via-background to-background">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl mb-12">
            <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6">
              {t('mortgage.title')}
            </span>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="text-gold">{t('mortgage.title')}</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              {t('mortgage.subtitle')}. Plan your property investment with our advanced mortgage calculator. Get accurate estimates for monthly payments, total interest, and find the perfect financing option for your UAE property purchase.
            </p>
          </div>

          {/* Calculator */}
          <MortgageCalculator />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Why Choose Our <span className="text-gold">{t('mortgage.title')}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our dedicated mortgage team partners with leading UAE banks to secure the best rates and terms for your property investment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="group bg-card border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banks Section */}
      <div className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">Partnered With</p>
            <h3 className="text-xl font-semibold text-foreground">Leading UAE Banks</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {["Emirates NBD", "ADCB", "FAB", "Mashreq", "DIB", "RAKBANK"].map((bank) => (
              <div key={bank} className="text-muted-foreground font-semibold text-lg">
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Secure Your <span className="text-gold">Mortgage?</span>
            </h2>
            <p className="text-zinc-600 text-lg mb-8">
              Speak with our mortgage advisors today and get personalized guidance for your property investment financing needs.
            </p>
            <button 
              onClick={() => setIsInquiryOpen(true)}
              className="relative inline-flex items-center justify-center gap-2 px-10 py-6 text-lg font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group"
              style={{
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.4),
                  0 6px 15px rgba(0,0,0,0.2),
                  inset 0 2px 4px rgba(255,255,255,0.9),
                  inset 0 -2px 4px rgba(200,167,102,0.2),
                  0 0 20px rgba(200,167,102,0.3)
                `,
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
              <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
              <span className="relative flex items-center justify-center gap-2">
                <span className="text-gold">{t('mortgage.contactAdvisor')}</span>
                <ArrowUpRight className="w-5 h-5 text-black" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <Footer />

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
