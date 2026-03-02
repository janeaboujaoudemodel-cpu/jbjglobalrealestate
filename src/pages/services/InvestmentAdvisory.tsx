import { motion } from "framer-motion";
import VideoBackground from "@/components/VideoBackground";
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
  User,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { SEOHead } from "@/components/SEOHead";

// Import hero video
import investmentAdvisoryHeroVideo from "@/assets/videos/dubai-investment-hero.mp4";

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
    footer: "Advisory insights are supported by official UAE real estate data sources."
  },
  {
    icon: Building2,
    title: "Off-Plan vs Ready Property Advisory",
    description: "We advise investors on when and why to consider:",
    items: [
      "Off-plan projects (pricing advantage, payment plans, growth potential)",
      "Ready properties (immediate income, established demand, lower delivery risk)"
    ],
    footer: "Each option is assessed based on market cycle positioning and investor objectives."
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
    footer: "We advise investors on optimal exit timing and resale positioning."
  },
  {
    icon: Scale,
    title: "Due Diligence & Risk Advisory",
    description: "Our advisory includes risk evaluation across:",
    items: [
      "Developer track record and delivery reliability",
      "Project-level completion risks",
      "Payment plan structures and exposure",
      "Contractual terms and developer obligations"
    ],
    footer: "Investors receive a clear understanding of both upside potential and downside risks."
  }
];

const doNotItems = [
  "We do not provide financial advice or tax planning",
  "We do not guarantee investment returns",
  "We do not sell financial products",
  "We do not manage client funds or escrow"
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

const InvestmentAdvisory = () => {
  return (
    <>
      <SEOHead
        title="Investment Advisory Services | JBJ Global Real Estate"
        description="Strategic real estate investment advisory in the UAE. Data-driven guidance for individuals, family offices, and institutional investors."
        canonicalPath="/services/investment-advisory"
      />

      {/* HERO SECTION - Full-screen with video background */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          <VideoBackground 
            src={investmentAdvisoryHeroVideo}
            poster="https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        
        {/* Floating gold accent orbs */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Investment Advisory
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Strategic Investment Advisory
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Data-driven investment guidance for the UAE real estate market. Make informed decisions with clarity and confidence.
            </p>
            
            {/* Hero CTA Buttons - Using PremiumHeroButton for consistency */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=investment-advisory">
                Speak to an Advisor
              </PremiumHeroButton>
              <PremiumHeroButton href="/properties">
                View Opportunities
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* What Our Investment Advisory Covers */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What Our Investment Advisory Covers
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-600 max-w-2xl mx-auto mb-12"
            >
              Our advisory scope focuses on property investment guidance, not financial product sales.
            </motion.p>
            
            <div className="space-y-6">
              {advisoryServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-medium text-black mb-3">{service.title}</h3>
                      <p className="text-zinc-600 mb-4">{service.description}</p>
                      <ul className="space-y-2 mb-4">
                        {service.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
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
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <XCircle className="w-7 h-7 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What We Do Not Do
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-600 max-w-2xl mx-auto mb-8"
            >
              To maintain transparency and compliance:
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {doNotItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 jj-card-inner !p-4"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-zinc-700">{item}</span>
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
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Who This Service Is For
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-center text-zinc-600 max-w-2xl mx-auto mb-12"
            >
              Our Investment Advisory is suitable for:
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 jj-card-inner !p-5"
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
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <Shield className="w-8 h-8 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Why Investors Choose JBJ
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyJBJ.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 jj-card-inner !p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-zinc-800">{reason}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Start Your Investment Advisory Journey
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-zinc-700 mb-10"
            >
              If you are considering investing in UAE real estate and want structured, informed guidance, our advisory team is ready to assist.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Button 
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-black font-semibold px-8"
              >
                <Link to="/contact?service=investment-advisory">
                  Request Investment Advisory Consultation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-gold text-gold hover:bg-gold/10"
              >
                <Link to="/properties">
                  Explore Current Investment Opportunities
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="bg-black py-12 border-t border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              to="/investor-education"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Investor Education
            </Link>
            <Link
              to="/market-intelligence"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Market Intelligence
            </Link>
            <Link
              to="/buyer-guide"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Buyer Guide
            </Link>
            <Link
              to="/contact"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default InvestmentAdvisory;
