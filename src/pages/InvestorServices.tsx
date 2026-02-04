import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Search, BarChart3, FileText, Shield, PieChart, Building, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

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
          className="w-12 h-12 bg-white hover:bg-zinc-100 rounded-full flex items-center justify-center text-black shadow-lg transition-all"
          aria-label="Join Investor List"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Sticky Actions - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-t border-gold/20 p-3 flex gap-3">
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
          className="flex-1 h-11 bg-white hover:bg-zinc-100 rounded-lg flex items-center justify-center gap-2 text-black font-medium text-sm"
        >
          Join List
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <main className="min-h-screen bg-black pb-20 lg:pb-0">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
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
                className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6"
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
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Investor Overview
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-8 space-y-6"
              >
                <p className="text-zinc-300 leading-relaxed">
                  JBJ Global Real Estate provides structured investment advisory for individuals and institutions seeking exposure to Dubai's real estate market. Our role is to help investors evaluate opportunities with clarity, discipline, and full market context — not to promote speculative decisions.
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  We support investors across residential, off-plan, and income-generating assets, focusing on capital protection, yield logic, exit visibility, and risk awareness. Every investment discussion is framed around verified data, market cycles, and regulatory structure.
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  Our advisory approach is designed for investors who value transparency, documentation, and informed decision-making rather than volume-driven sales. From first analysis to execution and post-acquisition follow-up, investors receive structured guidance aligned with long-term objectives.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Investment Philosophy */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Investment Philosophy
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-zinc-400 text-center mb-8"
              >
                Our investment philosophy is built on three principles:
              </motion.p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Data Before Decisions</h3>
                  <p className="text-zinc-400 text-sm">
                    All investment evaluations are based on official market data, historical transaction trends, and current supply-demand dynamics.
                  </p>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Risk Awareness</h3>
                  <p className="text-zinc-400 text-sm">
                    Every opportunity is assessed for market timing, liquidity, pricing sensitivity, and exit conditions.
                  </p>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="jj-card-inner p-6">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gold font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Objective Alignment</h3>
                  <p className="text-zinc-400 text-sm">
                    No two investors share the same goals. Strategy is always aligned with the investor's horizon, capital structure, and risk tolerance.
                  </p>
                </motion.div>
              </div>
              
              <motion.p
                variants={fadeInUp}
                className="text-zinc-500 text-center mt-8 text-sm"
              >
                We do not promise returns, fixed yields, or guaranteed outcomes. Our responsibility is to provide clarity and structure so investors can decide with confidence.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
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
                    <span className="text-zinc-300 text-sm">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Investment Services */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
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
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mb-4">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                    <p className="text-zinc-400 text-sm mb-3">{service.description}</p>
                    <p className="text-zinc-500 text-xs">
                      <span className="text-gold">Deliverables:</span> {service.deliverables}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Investment Process */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
              >
                Investment Process
              </motion.h2>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gold/30 md:-translate-x-px" />
                
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
                          <span className="text-gold text-xs font-medium">Step {index + 1}</span>
                          <h3 className="text-white font-semibold mt-1">{item.step}</h3>
                          <p className="text-zinc-400 text-sm mt-1">{item.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We Do NOT Do */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                What We Do NOT Do
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-8"
              >
                <ul className="space-y-4">
                  {whatWeDoNot.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Market Focus Areas */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Market Focus Areas
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-3"
              >
                {marketFocusAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm"
                  >
                    {area}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Investor Experience Standards */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Investor Experience Standards
              </motion.h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {experienceStandards.map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3 jj-card-inner p-4"
                  >
                    <div className="w-8 h-8 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-bold text-sm">✓</span>
                    </div>
                    <span className="text-zinc-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Compliance & Disclosure */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
              >
                Compliance & Disclosure
              </motion.h2>
              
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-8"
              >
                <p className="text-zinc-400 text-center leading-relaxed">
                  All investment information is provided for educational and advisory purposes only. Real estate investments involve risk, and outcomes may vary based on market conditions. JBJ Global Real Estate does not guarantee performance, returns, or appreciation. Final decisions remain solely with the investor.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Calls to Action */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Ready to Explore Investment Opportunities?
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400 mb-8"
              >
                Take the next step toward informed property investment in Dubai.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/investors/join">
                    Request an Investor Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                  <Link to="/investors/join">
                    Join Investor List
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link to="/market-intelligence">
                    Explore Market Intelligence
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default InvestorServices;
