import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Target,
  BarChart3,
  Building2,
  Layers,
  LogOut,
  Scale,
  XCircle,
  Users,
  ArrowRight,
  CheckCircle2,
  Shield,
  Globe,
  Briefcase,
  User
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const InvestmentAdvisory = () => {
  const advisoryServices = [
    {
      icon: Target,
      title: "Investment Strategy Definition",
      description: "We help investors define a clear investment strategy based on:",
      items: [
        "Capital allocation goals",
        "Time horizon (short, medium, long term)",
        "Income vs capital appreciation focus",
        "Risk tolerance and liquidity needs",
        "Preferred asset class (residential, off-plan, ready, land)"
      ],
      footer: "Each strategy is structured before any property recommendations are made."
    },
    {
      icon: BarChart3,
      title: "Market & Asset Analysis",
      description: "We provide objective analysis using:",
      items: [
        "Area-level market performance",
        "Historical transaction trends",
        "Rental yield benchmarks",
        "Supply vs demand dynamics",
        "Infrastructure and development pipelines"
      ],
      footer: "Advisory insights are supported by official UAE real estate data sources, ensuring accuracy and compliance."
    },
    {
      icon: Building2,
      title: "Off-Plan vs Ready Property Advisory",
      description: "We advise investors on when and why to consider:",
      items: [
        "Off-plan projects (pricing advantage, payment plans, growth potential)",
        "Ready properties (immediate income, established demand, lower delivery risk)"
      ],
      footer: "Each option is assessed based on market cycle positioning, developer profile, and investor objectives."
    },
    {
      icon: Layers,
      title: "Portfolio Structuring & Diversification",
      description: "For investors building multiple-asset portfolios, we assist with:",
      items: [
        "Asset diversification across locations and property types",
        "Risk balancing between off-plan and ready assets",
        "Income-producing vs growth-oriented assets",
        "Staggered entry and exit planning"
      ],
      footer: "This ensures exposure is spread intelligently, not concentrated by coincidence."
    },
    {
      icon: LogOut,
      title: "Exit Strategy & Resale Planning",
      description: "Every investment is evaluated with a clear exit perspective:",
      items: [
        "Expected holding period",
        "Resale liquidity in the target area",
        "Anticipated buyer demand at exit",
        "Market absorption and competition"
      ],
      footer: "We advise investors on optimal exit timing and resale positioning based on market conditions."
    },
    {
      icon: Scale,
      title: "Regulatory & Compliance Guidance",
      description: "Our advisory incorporates UAE real estate regulations, including:",
      items: [
        "Ownership structures and freehold zones",
        "Transaction registration requirements",
        "Transfer and documentation processes",
        "Investor eligibility considerations"
      ],
      footer: "We ensure advisory guidance remains aligned with current regulatory frameworks."
    }
  ];

  const doNotItems = [
    "We do not sell financial products",
    "We do not provide tax or legal opinions",
    "We do not guarantee returns or performance",
    "We do not offer speculative forecasts"
  ];

  const targetAudience = [
    { icon: User, label: "First-time property investors in the UAE" },
    { icon: Globe, label: "International investors seeking market clarity" },
    { icon: Layers, label: "Portfolio investors managing multiple assets" },
    { icon: TrendingUp, label: "Long-term investors focused on capital preservation and growth" }
  ];

  const whyJBJ = [
    "Licensed UAE real estate brokerage",
    "Market intelligence–driven advisory",
    "Clear separation between advisory and transaction execution",
    "Data-backed decision frameworks",
    "Structured, professional investment process"
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Investment Advisory</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
              variants={fadeInUp}
            >
              Strategic Real Estate <span className="text-gold">Investment Advisory</span> in the UAE
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-6"
              variants={fadeInUp}
            >
              JBJ Global Real Estate provides structured, data-driven investment advisory services for individuals, family offices, and institutional investors seeking clarity and confidence in the UAE real estate market.
            </motion.p>
            
            <motion.p 
              className="text-base md:text-lg text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-6"
              variants={fadeInUp}
            >
              Our advisory service is designed to help investors make informed property investment decisions based on market fundamentals, transaction data, regulatory frameworks, and long-term risk considerations — not speculation or sales pressure.
            </motion.p>
            
            <motion.p 
              className="text-base md:text-lg text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-10"
              variants={fadeInUp}
            >
              We guide investors through asset selection, market timing, portfolio construction, and exit planning, ensuring every decision aligns with their objectives, risk tolerance, and investment horizon.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Speak to an Investment Advisor
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 px-8 py-6 text-base"
                >
                  View Investment Opportunities
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* What Our Investment Advisory Covers */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <GuideSectionHeader icon={TrendingUp} title="What Our Investment Advisory Covers" centered />
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-muted-foreground max-w-2xl mx-auto mb-12"
            >
              Our advisory scope focuses on property investment guidance, not financial product sales.
            </motion.p>
            
            <div className="space-y-8">
              {advisoryServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-medium text-black mb-3">{service.title}</h3>
                      <p className="text-zinc-600 mb-4">{service.description}</p>
                      <div className="bg-black/5 rounded-xl p-4 mb-4">
                        <ul className="space-y-2">
                          {service.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                              <span className="text-zinc-700 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-sm text-zinc-600 italic">{service.footer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Do Not Do */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <GuideSectionHeader icon={XCircle} title="What We Do Not Do" centered />
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-400 max-w-2xl mx-auto mb-8"
            >
              To maintain transparency and compliance:
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {doNotItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                >
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </motion.div>
              ))}
            </div>
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-500 text-sm"
            >
              Where required, we introduce clients to licensed third-party professionals for legal, mortgage, or tax services.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Who This Service Is For */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <GuideSectionHeader icon={Users} title="Who This Service Is For" centered />
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-muted-foreground max-w-2xl mx-auto mb-12"
            >
              Our Investment Advisory is suitable for:
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-xl hover:border-gold transition-all"
                >
                  <div className="w-10 h-10 bg-black border border-gold rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-zinc-800 font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Investors Choose JBJ Global Real Estate */}
      <section className="py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <GuideSectionHeader icon={Shield} title="Why Investors Choose JBJ Global Real Estate" centered />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              {whyJBJ.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-zinc-200">{reason}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
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
              className="text-3xl md:text-4xl font-light text-foreground mb-6"
            >
              Start Your <span className="text-gold">Investment Advisory</span> Journey
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground mb-10"
            >
              If you are considering investing in UAE real estate and want structured, informed guidance, our advisory team is ready to assist.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button 
                  size="lg"
                  className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-base"
                >
                  Request an Investment Advisory Consultation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gold/50 text-foreground hover:bg-gold/10 px-8 py-6 text-base"
                >
                  Explore Current Investment Opportunities
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestmentAdvisory;
