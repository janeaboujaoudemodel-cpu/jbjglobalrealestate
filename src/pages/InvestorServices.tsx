import { motion, type Variants } from "framer-motion";
import { ArrowRight, TrendingUp, Search, BarChart3, FileText, Shield, PieChart, Building, Phone, MessageCircle, CheckCircle, Globe, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { type ReactNode } from "react";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const InvestorServices = () => {
  const investmentServices = [
    {
      title: "Market Entry Advisory",
      description: "Guidance on entering the Dubai market with confidence and clarity.",
      deliverables: "Market overview, area selection, entry timing assessment.",
      icon: TrendingUp
    },
    {
      title: "Asset Selection & Comparison",
      description: "Evaluation of multiple investment options side-by-side.",
      deliverables: "Comparative analysis, price benchmarks, risk notes.",
      icon: Search
    },
    {
      title: "Off-Plan & New Development",
      description: "Structured review of developer-led projects and launches.",
      deliverables: "Project assessment, payment plan review, delivery risk review.",
      icon: Building
    },
    {
      title: "Rental Yield Assessment",
      description: "Income-focused evaluation for yield-driven investors.",
      deliverables: "Rental benchmarks, operating cost review, yield scenarios.",
      icon: BarChart3
    },
    {
      title: "Exit & Liquidity Strategy",
      description: "Strategic planning beyond acquisition for maximum returns.",
      deliverables: "Exit timing logic, resale positioning, liquidity considerations.",
      icon: FileText
    },
    {
      title: "Portfolio Structuring",
      description: "Multi-asset investment planning and diversification.",
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
      
      {/* Sticky Actions - Desktop */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-[50] flex-col gap-3">
        <button
          onClick={handleWhatsAppClick}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button
          onClick={handleCallClick}
          className="w-12 h-12 bg-gold hover:bg-gold/90 rounded-full flex items-center justify-center text-black shadow-lg transition-all hover:scale-110"
          aria-label="Call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <Link
          to="/contact"
          className="w-12 h-12 bg-gradient-to-br from-champagne-light to-champagne-dark hover:from-champagne hover:to-champagne-light rounded-full flex items-center justify-center text-black shadow-lg transition-all hover:scale-110 border border-gold/30"
          aria-label="Contact Us"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Sticky Actions - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[50] bg-gradient-to-br from-champagne-light to-champagne-dark backdrop-blur-sm border-t-2 border-gold/40 p-3 flex gap-2">
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
          to="/contact"
          className="flex-1 h-11 bg-black hover:bg-black/90 rounded-lg flex items-center justify-center gap-2 text-white font-medium text-sm"
        >
          Contact
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <main className="min-h-screen bg-black pb-20 lg:pb-0">
        {/* ═══ HERO ═══ */}
        <section className="relative pt-24 pb-14 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-gold/3 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.06),transparent_70%)]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 mb-5">
                <div className="h-px w-10 bg-gold/60" />
                <span className="px-4 py-1.5 bg-gradient-to-r from-champagne-light to-champagne-dark border border-gold/40 rounded-full text-black text-xs font-semibold tracking-wider uppercase">
                  Investor Advisory
                </span>
                <div className="h-px w-10 bg-gold/60" />
              </motion.div>
              
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight"
              >
                Investor Advisory &{" "}
                <span className="text-gold">Market Intelligence</span>
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-8"
              >
                Structured investment guidance for individuals and institutions seeking exposure to Dubai's real estate market.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleWhatsAppClick}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 h-11 rounded-lg gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Us
                </Button>
                <Button
                  onClick={handleCallClick}
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 px-6 h-11 rounded-lg gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
                <Link to="/contact">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-6 h-11 rounded-lg gap-2">
                    Book Consultation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ OVERVIEW + PHILOSOPHY (merged, tighter) ═══ */}
        <section className="py-10 md:py-14 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="max-w-5xl mx-auto"
              >
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  Investor Overview
                </motion.h2>
                
                <motion.div variants={fadeInUp} className="jj-card-inner p-6 md:p-8 mb-8">
                  <div className="space-y-4 text-black/70 leading-relaxed text-sm md:text-base">
                    <p>
                      JBJ Global Real Estate provides structured investment advisory for individuals and institutions seeking exposure to Dubai's real estate market. Our role is to help investors evaluate opportunities with clarity, discipline, and full market context.
                    </p>
                    <p>
                      We support investors across residential, off-plan, and income-generating assets, focusing on capital protection, yield logic, exit visibility, and risk awareness. Every discussion is framed around verified data, market cycles, and regulatory structure.
                    </p>
                  </div>
                </motion.div>

                {/* Philosophy Cards */}
                <motion.h3 variants={fadeInUp} className="text-xl md:text-2xl font-bold text-black mb-5 text-center">
                  Investment Philosophy
                </motion.h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { n: "1", title: "Data Before Decisions", desc: "All evaluations are based on official market data, historical transaction trends, and current supply-demand dynamics." },
                    { n: "2", title: "Risk Awareness", desc: "Every opportunity is assessed for market timing, liquidity, pricing sensitivity, and exit conditions." },
                    { n: "3", title: "Objective Alignment", desc: "Strategy is always aligned with the investor's horizon, capital structure, and risk tolerance." },
                  ].map((item) => (
                    <motion.div key={item.n} variants={fadeInUp} className="jj-card-inner p-5 flex flex-col">
                      <div className="w-9 h-9 bg-gold/10 border border-gold/40 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-gold font-bold text-sm">{item.n}</span>
                      </div>
                      <h4 className="text-base font-semibold text-black mb-1.5">{item.title}</h4>
                      <p className="text-black/60 text-sm leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.p variants={fadeInUp} className="text-black/50 text-center mt-5 text-xs">
                  We do not promise returns, fixed yields, or guaranteed outcomes. Our responsibility is to provide clarity and structure so investors can decide with confidence.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ WHO THIS IS FOR ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-5xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  Who This Is For
                </motion.h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {whoThisIsFor.map((item, index) => (
                    <motion.div key={index} variants={fadeInUp} className="jj-card-inner p-4 flex items-center gap-3">
                      <div className="w-2 h-2 bg-gold rounded-full flex-shrink-0" />
                      <span className="text-black/70 text-sm">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ INVESTMENT SERVICES — Premium Connected Grid ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-3 text-center">
                  Investment Services
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-black/50 text-center text-sm mb-8 max-w-2xl mx-auto">
                  Comprehensive advisory services designed for every stage of your investment journey.
                </motion.p>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 max-w-5xl mx-auto rounded-xl overflow-hidden border-2 border-gold/30">
                  {investmentServices.map((service, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="relative p-6 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-b border-r border-gold/20 last:border-b-0 group hover:bg-gradient-to-br hover:from-[#F5F0E6] hover:to-[#EDE4D3] transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-gold/10 border border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                          <service.icon className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-black mb-1">{service.title}</h3>
                          <p className="text-black/60 text-sm mb-2 leading-relaxed">{service.description}</p>
                          <p className="text-xs text-black/45">
                            <span className="text-gold font-medium">Deliverables:</span> {service.deliverables}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA under services */}
                <motion.div variants={fadeInUp} className="flex justify-center mt-6 gap-3">
                  <Button onClick={handleWhatsAppClick} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-lg">
                    <MessageCircle className="w-4 h-4" /> Discuss Services
                  </Button>
                  <Link to="/contact">
                    <Button variant="outline" className="border-gold/40 text-black hover:bg-gold/10 gap-2 rounded-lg">
                      <Phone className="w-4 h-4" /> Book a Call
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ INVESTMENT PROCESS ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
                  Investment Process
                </motion.h2>
                
                {/* Horizontal steps on desktop, vertical on mobile */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {investmentProcess.map((item, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="jj-card-inner p-4 text-center relative"
                    >
                      <div className="w-8 h-8 bg-gold/15 border border-gold/40 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-gold text-xs font-bold">{index + 1}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-black mb-1 leading-tight">{item.step}</h4>
                      <p className="text-black/50 text-[11px] leading-snug">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ WHAT WE DO NOT DO ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  What We Do NOT Do
                </motion.h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {whatWeDoNot.map((item, index) => (
                    <motion.div key={index} variants={fadeInUp} className="jj-card-inner p-4 flex items-start gap-3 border-l-4 border-l-red-400/50">
                      <Shield className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                      <span className="text-black/70 text-sm">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ MARKET FOCUS AREAS ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  Market Focus Areas
                </motion.h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {marketFocusAreas.map((area, index) => (
                    <motion.span
                      key={index}
                      variants={fadeInUp}
                      className="px-4 py-2 bg-gradient-to-r from-champagne-light/50 to-champagne/50 border border-gold/30 rounded-full text-black text-sm font-medium hover:border-gold/60 transition-colors cursor-default"
                    >
                      {area}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ EXPERIENCE STANDARDS ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  Investor Experience Standards
                </motion.h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {experienceStandards.map((standard, index) => (
                    <motion.div key={index} variants={fadeInUp} className="jj-card-inner p-3.5 flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="text-black/70 text-sm">{standard}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ COMPLIANCE ═══ */}
        <section className="py-6 md:py-10 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="max-w-4xl mx-auto">
                <div className="jj-card-inner p-6">
                  <h3 className="text-lg font-semibold text-black mb-2 text-center">Compliance & Disclosure</h3>
                  <p className="text-black/55 text-sm leading-relaxed text-center">
                    All investment information is provided for educational and advisory purposes only. Real estate investments involve risk, and outcomes may vary based on market conditions. JBJ Global Real Estate does not guarantee performance, returns, or appreciation. Final decisions remain solely with the investor.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ GET STARTED — CTA Section ═══ */}
        <section className="py-8 md:py-12 bg-black">
          <div className="jj-layer-2">
            <div className="container mx-auto px-4">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
                <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
                  Get Started
                </motion.h2>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <motion.div variants={fadeInUp}>
                    <button onClick={handleWhatsAppClick} className="block w-full h-full text-left">
                      <div className="jj-card-inner p-5 h-full hover:border-gold/60 transition-all group cursor-pointer">
                        <div className="w-10 h-10 bg-green-600/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-600/20 transition-colors">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-base font-semibold text-black mb-1 group-hover:text-gold transition-colors">WhatsApp Consultation</h3>
                        <p className="text-black/60 text-sm mb-3">Discuss investment objectives confidentially</p>
                        <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                          Message Now <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                  
                  <motion.div variants={fadeInUp}>
                    <button onClick={handleCallClick} className="block w-full h-full text-left">
                      <div className="jj-card-inner p-5 h-full hover:border-gold/60 transition-all group cursor-pointer">
                        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                          <Phone className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-base font-semibold text-black mb-1 group-hover:text-gold transition-colors">Call Our Team</h3>
                        <p className="text-black/60 text-sm mb-3">Speak directly with an investment advisor</p>
                        <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                          Call Now <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                  
                  <motion.div variants={fadeInUp}>
                    <Link to="/contact" className="block h-full">
                      <div className="jj-card-inner p-5 h-full hover:border-gold/60 transition-all group">
                        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                          <Globe className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-base font-semibold text-black mb-1 group-hover:text-gold transition-colors">Book Consultation</h3>
                        <p className="text-black/60 text-sm mb-3">Schedule a detailed strategy session</p>
                        <span className="text-gold text-sm font-medium inline-flex items-center gap-1">
                          Get Started <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default InvestorServices;
