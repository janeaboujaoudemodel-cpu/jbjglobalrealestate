import { Link } from "react-router-dom";
import { ArrowLeft, Shield, CheckCircle, Building2, Users } from "lucide-react";
import MortgageCalculator from "@/components/MortgageCalculator";
import Footer from "@/components/Footer";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

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
    description: "We help match your budget to the best investment opportunities"
  },
  {
    icon: Users,
    title: "End-to-End Service",
    description: "From application to disbursement, we guide you every step"
  },
];

const MortgageCalculatorPage = () => {
  return (
    <section className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 bg-gradient-to-b from-black via-zinc-950 to-zinc-950">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Properties
          </Link>
          
          <div className="max-w-3xl mb-12">
            <span className="inline-block px-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6">
              Mortgage Advisory
            </span>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Calculate Your <span className="text-gold">Mortgage</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
              Plan your property investment with our advanced mortgage calculator. Get accurate estimates for monthly payments, total interest, and find the perfect financing option for your UAE property purchase.
            </p>
          </div>

          {/* Calculator */}
          <MortgageCalculator />
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Why Choose Our <span className="text-gold">Mortgage Advisory</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our dedicated mortgage team partners with leading UAE banks to secure the best rates and terms for your property investment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-gold/30 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-zinc-400">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banks Section */}
      <div className="py-16 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-zinc-400 text-sm uppercase tracking-wider mb-2">Partnered With</p>
            <h3 className="text-xl font-semibold text-white">Leading UAE Banks</h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {["Emirates NBD", "ADCB", "FAB", "Mashreq", "DIB", "RAKBANK"].map((bank) => (
              <div key={bank} className="text-zinc-500 font-semibold text-lg">
                {bank}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Secure Your <span className="text-gold">Mortgage?</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Speak with our mortgage advisors today and get personalized guidance for your property investment financing needs.
            </p>
            <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
              <button className="bg-gradient-to-r from-gold to-gold-dark text-black px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity">
                Schedule a Consultation
              </button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
};

export default MortgageCalculatorPage;