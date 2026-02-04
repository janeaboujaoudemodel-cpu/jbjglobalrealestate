import { motion, type Variants } from "framer-motion";
import { ArrowRight, TrendingUp, Search, BarChart3, FileText, Shield, PieChart, Building, Phone, MessageCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { type ReactNode } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Section Shell wrapper following 3-layer UI system
function SectionShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={`py-16 md:py-20 bg-black ${className ?? ""}`.trim()}>
      <div className="jj-layer-2">
        <div className="container mx-auto px-4">{children}</div>
      </div>
    </section>
  );
}

const InvestorServices = () => {
  const investmentServices = [
    {
      title: "Market Entry Advisory",
      description: "Guidance on entering the Dubai market.",
      deliverables: "Market overview, area selection, entry timing assessment.",
      icon: TrendingUp
    },
    {
      title: "Asset Selection & Comparison",
      description: "Evaluation of multiple investment options.",
      deliverables: "Comparative analysis, price benchmarks, risk notes.",
      icon: Search
    },
    {
      title: "Off-Plan & New Development Advisory",
      description: "Structured review of developer-led projects.",
      deliverables: "Project assessment, payment plan review, delivery risk review.",
      icon: Building
    },
    {
      title: "Rental Yield Assessment",
      description: "Income-focused evaluation.",
      deliverables: "Rental benchmarks, operating cost review, yield scenarios.",
      icon: BarChart3
    },
    {
      title: "Exit & Liquidity Strategy",
      description: "Planning beyond acquisition.",
      deliverables: "Exit timing logic, resale positioning, liquidity considerations.",
      icon: FileText
    },
    {
      title: "Portfolio Structuring",
      description: "Multi-asset investment planning.",
      deliverables: "Allocation logic, diversification review, performance tracking.",
      icon: PieChart
    }
  ];

  const investmentProcess = [
    { step: "Objective Definition", description: "Capital size, horizon, risk tolerance" },
    { step: "Market Context Review", description: "Macro and area-specific data" },
    { step: "Opportunity Shortlist", description: "Filtered investment options" },
    { step: "Comparative Analysis", description: "Pricing, yield, and risk evaluation" },
    { step: "Execution Support", description: "Transaction coordination" },
    { step: "Post-Investment Review", description: "Performance and next-step planning" }
  ];

  const whoThisIsFor = [
    "First-time property investors in Dubai",
    "International investors seeking UAE exposure",
    "Capital preservation investors",
    "Yield-focused rental investors",
    "Long-term portfolio builders",
    "Family offices and private clients"
  ];

  const whatWeDoNot = [
    "We do not guarantee returns or income",
    "We do not provide financial or legal advice",
    "We do not promote projects based on commission",
    "We do not make investment decisions on behalf of clients"
  ];

  const marketFocusAreas = [
    "Downtown Dubai", "Business Bay", "Dubai Marina", "Palm Jumeirah",
    "Dubai Hills Estate", "Jumeirah Village Circle", "Meydan", "City Walk",
    "DIFC", "Arabian Ranches", "Emaar South", "Dubai South"
  ];

  const experienceStandards = [
    "Transparent data presentation",
    "No pressure-based recommendations",
    "Documented assumptions",
    "Clear communication at every stage",
    "Confidential handling of information",
    "Long-term relationship mindset",
    "Post-transaction availability"
  ];

  const handleWhatsAppClick = () => {
    window.location.href = getWhatsAppUrl("Hello JBJ Global Real Estate, I would like to discuss investment opportunities in Dubai.");
  };

  const handleCallClick = () => {
    window.location.href = getCallUrl();
  };

  return (
    <>
      <SEOHead
        title="Investor Advisory & Market Intelligence | JBJ Global Real Estate"
        description="Structured investment advisory for individuals and institutions seeking exposure to Dubai's real estate market. Data-driven guidance with clarity and discipline."
        keywords="dubai real estate investment, property investment dubai, investor advisory dubai, dubai market intelligence"
        canonicalPath="/investors"
      />
      <GlobalHeader />
      
      {/* Sticky Actions - Desktop */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-3">
        <button
          onClick={handleWhatsAppClick}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={handleCallClick}
          className="w-12 h-12 bg-gold hover:bg-gold/90 rounded-full flex items-center justify-center text-black shadow-lg transition-all"
          aria-label="Call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <Link
          to="/investors/join"
          className="w-12 h-12 bg-gradient-to-br from-champagne-light to-champagne-dark hover:from-champagne hover:to-champagne-light rounded-full flex items-center justify-center text-black shadow-lg transition-all border border-gold/30"
          aria-label="Join Investor List"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Sticky Actions - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-br from-champagne-light to-champagne-dark backdrop-blur-sm border-t border-gold/30 p-3 flex gap-3">
        <button
          onClick={handleWhatsAppClick}
          className="flex-1 h-11 bg-green-600 hover:bg-green-700 rounded-lg flex items-center justify-center gap-2 text-white font-medium text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        <button
          onClick={handleCallClick}
          className="flex-1 h-11 bg-gold hover:bg-gold/90 rounded-lg flex items-center justify-center gap-2 text-black font-medium text-sm"
        >
          <Phone className="w-4 h-4" />
          Call
        </button>
        <Link
          to="/investors/join"
          className="flex-1 h-11 bg-black hover:bg-black/90 rounded-lg flex items-center justify-center gap-2 text-white font-medium text-sm"
        >
          Join List
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <main className="min-h-screen bg-black pb-20 lg:pb-0">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-2 bg-gradient-to-r from-champagne-light to-champagne-dark border border-gold/40 rounded-full text-black text-sm font-medium mb-6"
              >
                Investor Advisory
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              >
                JBJ Global Real Estate
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-gold mb-2"
              >
                Investor Advisory & Market Intelligence
              </motion.p>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400"
              >
                Dubai, UAE
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Investor Overview */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Investor Overview
            </motion.h2>
            
            <motion.div
              variants={fadeInUp}
              className="jj-card-inner p-8 space-y-6"
            >
              <p className="text-black/70 leading-relaxed">
                JBJ Global Real Estate provides structured investment advisory for individuals and institutions seeking exposure to Dubai's real estate market. Our role is to help investors evaluate opportunities with clarity, discipline, and full market context — not to promote speculative decisions.
              </p>
              <p className="text-black/70 leading-relaxed">
                We support investors across residential, off-plan, and income-generating assets, focusing on capital protection, yield logic, exit visibility, and risk awareness. Every investment discussion is framed around verified data, market cycles, and regulatory structure.
              </p>
              <p className="text-black/70 leading-relaxed">
                Our advisory approach is designed for investors who value transparency, documentation, and informed decision-making rather than volume-driven sales. From first analysis to execution and post-acquisition follow-up, investors receive structured guidance aligned with long-term objectives.
              </p>
            </motion.div>
          </motion.div>
        </SectionShell>

        {/* Investment Philosophy */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Investment Philosophy
            </motion.h2>
            
            <motion.p
              variants={fadeInUp}
              className="text-black/60 text-center mb-8"
            >
              Our investment philosophy is built on three principles:
            </motion.p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                <div className="w-10 h-10 bg-gold/10 border border-gold/40 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gold font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Data Before Decisions</h3>
                <p className="text-black/60 text-sm">
                  All investment evaluations are based on official market data, historical transaction trends, and current supply-demand dynamics.
                </p>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                <div className="w-10 h-10 bg-gold/10 border border-gold/40 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gold font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Risk Awareness</h3>
                <p className="text-black/60 text-sm">
                  Every opportunity is assessed for market timing, liquidity, pricing sensitivity, and exit conditions.
                </p>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                <div className="w-10 h-10 bg-gold/10 border border-gold/40 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-gold font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Objective Alignment</h3>
                <p className="text-black/60 text-sm">
                  No two investors share the same goals. Strategy is always aligned with the investor's horizon, capital structure, and risk tolerance.
                </p>
              </motion.div>
            </div>
            
            <motion.p
              variants={fadeInUp}
              className="text-black/50 text-center mt-8 text-sm"
            >
              We do not promise returns, fixed yields, or guaranteed outcomes. Our responsibility is to provide clarity and structure so investors can decide with confidence.
            </motion.p>
          </motion.div>
        </SectionShell>

        {/* Who This Is For */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Who This Is For
            </motion.h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {whoThisIsFor.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner p-4 flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                  <span className="text-black/70 text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </SectionShell>

        {/* Investment Services */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-12 text-center"
            >
              Investment Services
            </motion.h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {investmentServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner p-6"
                >
                  <div className="w-12 h-12 bg-gold/10 border border-gold/40 rounded-xl flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-black mb-2">{service.title}</h3>
                  <p className="text-black/60 text-sm mb-3">{service.description}</p>
                  <p className="text-black/50 text-xs">
                    <span className="text-gold">Deliverables:</span> {service.deliverables}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </SectionShell>

        {/* Investment Process */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-12 text-center"
            >
              Investment Process
            </motion.h2>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gold/40 md:-translate-x-px" />
              
              <div className="space-y-8">
                {investmentProcess.map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className={`relative flex items-start gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-gold rounded-full md:-translate-x-1.5 mt-1.5 z-10" />
                    
                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <div className="jj-card-inner p-4">
                        <span className="text-gold text-sm font-semibold">Step {index + 1}</span>
                        <h3 className="text-black font-semibold mt-1">{item.step}</h3>
                        <p className="text-black/60 text-sm mt-1">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </SectionShell>

        {/* What We Do NOT Do */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              What We Do NOT Do
            </motion.h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {whatWeDoNot.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner p-4 flex items-start gap-3 border-l-4 border-l-red-500/50"
                >
                  <span className="text-black/70 text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </SectionShell>

        {/* Market Focus Areas */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Market Focus Areas
            </motion.h2>
            
            <div className="flex flex-wrap justify-center gap-3">
              {marketFocusAreas.map((area, index) => (
                <motion.span
                  key={index}
                  variants={fadeInUp}
                  className="px-4 py-2 bg-gradient-to-r from-champagne-light/50 to-champagne/50 border border-gold/30 rounded-full text-black text-sm font-medium"
                >
                  {area}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </SectionShell>

        {/* Investor Experience Standards */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Investor Experience Standards
            </motion.h2>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {experienceStandards.map((standard, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner p-4 flex items-center gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="text-black/70 text-sm">{standard}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </SectionShell>

        {/* Compliance & Disclosure */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Compliance & Disclosure
            </motion.h2>
            
            <motion.div
              variants={fadeInUp}
              className="jj-card-inner p-8"
            >
              <p className="text-black/60 text-sm leading-relaxed text-center">
                All investment information is provided for educational and advisory purposes only. Real estate investments involve risk, and outcomes may vary based on market conditions. JBJ Global Real Estate does not guarantee performance, returns, or appreciation. Final decisions remain solely with the investor.
              </p>
            </motion.div>
          </motion.div>
        </SectionShell>

        {/* Calls to Action */}
        <SectionShell>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8 text-center"
            >
              Get Started
            </motion.h2>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <motion.div variants={fadeInUp}>
                <Link to="/contact" className="block h-full">
                  <div className="jj-card-inner p-6 h-full hover:border-gold/60 transition-all group">
                    <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors">Request an Investor Consultation</h3>
                    <p className="text-black/60 text-sm mb-4">Discuss objectives confidentially</p>
                    <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Link to="/investors/join" className="block h-full">
                  <div className="jj-card-inner p-6 h-full hover:border-gold/60 transition-all group">
                    <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors">Join Investor List</h3>
                    <p className="text-black/60 text-sm mb-4">Receive curated opportunities</p>
                    <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                      Join Now <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <Link to="/market-intelligence" className="block h-full">
                  <div className="jj-card-inner p-6 h-full hover:border-gold/60 transition-all group">
                    <h3 className="text-lg font-semibold text-black mb-2 group-hover:text-gold transition-colors">Explore Market Intelligence</h3>
                    <p className="text-black/60 text-sm mb-4">Access data-driven insights</p>
                    <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                      View Reports <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </SectionShell>
      </main>
      
      <Footer />
    </>
  );
};

export default InvestorServices;
