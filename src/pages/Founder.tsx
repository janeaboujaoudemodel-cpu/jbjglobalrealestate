import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Gem, Film, Mail, Phone, ExternalLink, Award, Globe, Users, TrendingUp, Star, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { SafeImage } from "@/components/SafeImage";
import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS, CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";

// Import all founder images
import founderHero from "@/assets/founder-hero.png";
import founderDark from "@/assets/founder-dark.png";
import jjFlags from "@/assets/jj-flags.png";
import founderOffice from "@/assets/founder-office.jpeg";
import founderJetBoarding from "@/assets/founder-jet-boarding.jpeg";
import founderJetInterior from "@/assets/founder-jet-interior.jpeg";
import founderProfessional from "@/assets/founder-professional.jpeg";
import founderYacht from "@/assets/founder-yacht.jpeg";
import founderAwardStage from "@/assets/founder-award-stage.jpeg";
import founderRedCarpet from "@/assets/founder-red-carpet.jpeg";
import founderPremium from "@/assets/founder-premium.png";
import founderJetWhite from "@/assets/founder-jet-white.jpg";
import founderYachtDubai from "@/assets/founder-yacht-dubai.jpg";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const CounterStat = ({ end, suffix, prefix, label, icon: Icon }: { end: number; suffix: string; prefix: string; label: string; icon?: any }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <motion.div 
      ref={ref} 
      className="text-center group"
      variants={fadeInUp}
    >
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/20 group-hover:border-gold/50 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-gold/5">
          <Icon className="w-6 h-6 text-gold" />
        </div>
      )}
      <p 
        className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-4xl md:text-5xl lg:text-6xl font-bold mb-3" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-zinc-400 text-xs md:text-sm uppercase tracking-[0.2em]">{label}</p>
    </motion.div>
  );
};

// Decorative gold line component
const GoldLine = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent ${className}`} />
);

const Founder = () => {
  const divisions = [
    {
      icon: Building2,
      name: "JJ Global Capital",
      description: "The flagship investment and advisory division of JJ Holding Group. Orchestrating premium UAE real estate portfolios with institutional precision, delivering bespoke wealth preservation strategies and capital appreciation for a distinguished global clientele.",
      image: founderOffice,
      tagline: "Real Estate Investment & Advisory",
      url: "https://jjglobalcapital.com"
    },
    {
      icon: Gem,
      name: "Maison Jane",
      description: "An exclusive luxury lifestyle atelier embodying the founder's vision of refined living. Curating transformative experiences across beauty, wellness, and personal concierge services for the world's most discerning individuals.",
      image: founderJetInterior,
      tagline: "Luxury Lifestyle & Concierge",
      url: "https://maisonjane.ae"
    },
    {
      icon: Film,
      name: "JJ Media Group",
      description: "The strategic communications powerhouse shaping narrative excellence across the group's ventures. Architecting brand identities, digital ecosystems, and influence frameworks that command attention on the global stage.",
      image: founderRedCarpet,
      tagline: "Media & Strategic Communications",
      url: "https://jjmediagroup.ae"
    },
    {
      icon: Award,
      name: "JJ Fashion House",
      description: "A distinguished creative atelier translating the founder's aesthetic philosophy into haute couture and bespoke design. Crafting exclusive collections that epitomize institutional elegance and timeless sophistication.",
      image: founderAwardStage,
      tagline: "Haute Couture & Design",
      url: "https://jjfashionhouse.com"
    },
  ];

  const philosophyItems = [
    {
      title: "Founder-Led",
      description: "Strategic direction flows from the founder, ensuring consistency and alignment with core values.",
      icon: Users,
    },
    {
      title: "Accountability",
      description: "Every entity operates with clear responsibility structures and non-negotiable standards.",
      icon: Award,
    },
    {
      title: "Discretion",
      description: "Privacy and professionalism define relationships. Visibility earned through results.",
      icon: Globe,
    },
    {
      title: "Quality First",
      description: "Growth is deliberate. Quality of service and depth of expertise over rapid expansion.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* HERO - CINEMATIC FULL BLEED */}
      <section className="relative min-h-screen flex items-end">
        {/* Background with parallax effect */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Hero image - smart crop from top (head first) */}
          <SafeImage 
            src={founderProfessional} 
            fallbackSrc={founderHero}
            alt="Jane Abou Jaoude - Founder & Chairwoman" 
            className="w-full h-full object-cover object-top"
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute top-8 right-8 md:top-16 md:right-16 opacity-20">
          <div className="w-32 h-32 md:w-48 md:h-48 border border-gold/40 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-32 md:h-32 border border-gold/20 rounded-full" />
        </div>
        
        {/* Gold accent lines */}
        <div className="absolute left-0 top-1/3 w-32 md:w-64 h-px bg-gradient-to-r from-gold/50 to-transparent" />
        <div className="absolute right-0 bottom-1/3 w-32 md:w-64 h-px bg-gradient-to-l from-gold/50 to-transparent" />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 lg:pb-32">
          <motion.div 
            className="max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="mb-6" variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-gold/40 text-gold text-xs uppercase tracking-[0.3em] px-5 py-2.5 rounded-full shadow-lg shadow-gold/10">
                <Star className="w-3.5 h-3.5 fill-gold" />
                Founder & Chairwoman
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              JANE ABOU
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold">
                JAOUDE
              </span>
            </motion.h1>
            
            <motion.div variants={fadeInUp}>
              <p className="text-white text-xl md:text-2xl lg:text-3xl mb-1 font-semibold tracking-wide">
                JJ Global Capital
              </p>
              <p className="text-zinc-400 text-sm md:text-base mb-8">
                Powered by{" "}
                <a 
                  href="https://jjholdinggroup.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold/80 transition-colors underline underline-offset-4 decoration-gold/50"
                >
                  JJ Holding Group
                </a>
              </p>
            </motion.div>
            
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl italic max-w-xl border-l-4 border-gold/60 pl-6 py-2"
              variants={fadeInUp}
            >
              "Building institutions that outlast trends. Creating value through standards, not scale."
            </motion.p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 text-zinc-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-[0.3em]">Discover</span>
          <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* THE FOUNDER - PREMIUM EDITORIAL LAYOUT */}
      <section className="py-24 md:py-40 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/3 to-transparent" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Premium Single Photo - Left */}
            <motion.div className="lg:col-span-5 order-2 lg:order-1" variants={scaleIn}>
              <div className="relative">
                {/* Gold frame accent */}
                <div className="absolute -inset-4 bg-gradient-to-br from-gold/20 via-transparent to-gold/10 rounded-3xl" />
                <div className="absolute -top-2 -left-2 w-20 h-20 border-l-2 border-t-2 border-gold/50 rounded-tl-3xl" />
                <div className="absolute -bottom-2 -right-2 w-20 h-20 border-r-2 border-b-2 border-gold/50 rounded-br-3xl" />
                
                {/* Main photo container */}
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 bg-gradient-to-b from-white to-zinc-100">
                  <SafeImage 
                    src={founderPremium} 
                    fallbackSrc={founderProfessional}
                    alt="Jane Abou Jaoude - Founder & Chairwoman" 
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Subtle vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                
                {/* Floating badge */}
                <motion.div 
                  className="absolute -bottom-6 -right-6 bg-gradient-to-br from-gold to-[#C4A962] p-4 rounded-2xl shadow-xl shadow-gold/30"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  <Award className="w-8 h-8 text-black" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Text Content - Right */}
            <motion.div className="lg:col-span-7 order-1 lg:order-2" variants={fadeInUp}>
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 text-gold text-sm uppercase tracking-[0.4em]">
                  <Star className="w-4 h-4 fill-gold" />
                  The Visionary
                </span>
                <GoldLine className="w-32 mt-4" />
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-7xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Jane Abou
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold">Jaoude</span>
              </h2>
              
              <p className="text-gold text-sm uppercase tracking-[0.3em] mb-8 font-medium">
                Founder & Chairwoman · JJ Holding Group
              </p>
              
              <div className="space-y-6 text-zinc-300 leading-relaxed max-w-2xl">
                <p className="text-xl md:text-2xl font-light text-white/90">
                  A distinguished business architect whose vision has shaped a diversified portfolio spanning real estate investment, luxury lifestyle, media communications, and haute couture.
                </p>
                <p className="text-lg">
                  As the driving force behind JJ Holding Group, Jane has cultivated an ecosystem of excellence—where each venture is defined by uncompromising standards, strategic precision, and an unwavering commitment to institutional integrity.
                </p>
                <p className="text-lg text-zinc-400">
                  Her leadership philosophy transcends conventional metrics. Every decision is calibrated for generational impact, balancing calculated ambition with refined discretion. From the boardrooms of Dubai to international stages, she exemplifies a new paradigm of entrepreneurial sophistication.
                </p>
              </div>
              
              {/* Accolades row - All 3 on same line */}
              <div className="mt-12 grid grid-cols-3 gap-4 md:gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <Globe className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Global Presence</p>
                    <p className="text-zinc-500 text-xs">International Operations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Award-Winning</p>
                    <p className="text-zinc-500 text-xs">Recognized Excellence</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Proven Track Record</p>
                    <p className="text-zinc-500 text-xs">Consistent Growth</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOUNDER QUOTE - "AS PER JANE" */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            {/* Elegant quote marks */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gold/30 to-gold/10 rounded-full flex items-center justify-center border border-gold/40">
                <span className="text-gold text-4xl font-serif leading-none">"</span>
              </div>
            </div>
            
            <blockquote 
              className="text-white text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed mb-10 italic"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Excellence is not a destination—it is the standard by which every decision is measured. 
              We do not chase trends; we establish precedents.
            </blockquote>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/50" />
              <Star className="w-4 h-4 text-gold fill-gold/50" />
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/50" />
            </div>
            
            {/* Attribution */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">
                Jane Abou Jaoude, Founder
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* JJ HOLDING GROUP - FLAGS VISUAL */}
      <section className="py-24 md:py-40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
        {/* Premium pattern background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
        
        {/* Gold gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Flags Image */}
            <motion.div className="order-2 lg:order-1" variants={scaleIn}>
              <div className="aspect-[16/9] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10">
                <SafeImage 
                  src={jjFlags} 
                  fallbackSrc={founderHero}
                  alt="JJ Holding Group & JJ Global Capital" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            {/* Content */}
            <motion.div className="order-1 lg:order-2" variants={fadeInUp}>
              <div className="mb-10">
                <span className="text-gold text-sm uppercase tracking-[0.4em]">The Group</span>
                <GoldLine className="w-24 mt-4" />
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                JJ Holding
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Group</span>
              </h2>
              
              {/* Moved founder-led text here */}
              <p className="text-white text-xl md:text-2xl leading-relaxed mb-6 font-light">
                A <span className="text-gold font-medium">founder-led</span>, multi-division holding built on unwavering standards, discretion, and long-term vision.
              </p>
              
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-6">
                Every entity within the group reflects a deliberate approach to business—where quality supersedes quantity, and reputation is earned through consistent excellence.
              </p>
              
              <p className="text-zinc-500 leading-relaxed mb-8">
                The group's governance remains founder-led, ensuring that strategic decisions align with the long-term vision rather than short-term market pressures.
              </p>
              
              {/* Explore JJ Holding Group Button */}
              <a 
                href="https://jjholdinggroup.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold to-[#C4A962] hover:from-gold-light hover:to-gold text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02]"
              >
                Explore JJ Holding Group
                <ArrowUpRight className="w-5 h-5" />
              </a>
            </motion.div>
          </motion.div>

          {/* Stats - Ultra Premium Design */}
          <motion.div 
            className="mt-24 md:mt-40"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { end: 4, suffix: "", prefix: "", label: "Divisions", icon: Building2 },
                { ...COMPANY_STATS.yearsExperience, icon: Award },
                { ...COMPANY_STATS.countriesServed, icon: Globe },
                { ...COMPANY_STATS.portfolioValue, icon: TrendingUp },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border border-zinc-800 rounded-3xl p-8 md:p-10 hover:border-gold/40 transition-all duration-500 group relative overflow-hidden"
                  variants={fadeInUp}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                  <div className="relative z-10">
                    <CounterStat {...stat} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* THE GROUP DIVISIONS - PREMIUM CARDS */}
      <section className="py-24 md:py-40 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* JJ Holding Group Header Card */}
          <motion.div 
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800/80 to-zinc-900 border border-gold/40 rounded-3xl p-8 md:p-10 relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  {/* JJ Logo Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-gold/30 to-gold/10 rounded-2xl flex items-center justify-center border-2 border-gold/50 shadow-xl shadow-gold/20">
                    <span className="text-gold text-3xl font-light tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>J | J</span>
                  </div>
                  <div>
                    <p className="text-gold/70 text-xs uppercase tracking-[0.3em] mb-1">Head Company</p>
                    <h3 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JJ Holding Group
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">Four Divisions • International Excellence</p>
                  </div>
                </div>
                <a 
                  href="https://jjholdinggroup.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gold hover:bg-gold-light text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/30"
                >
                  Visit Website
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="text-gold text-sm uppercase tracking-[0.4em]">Our Portfolio</span>
            <GoldLine className="w-32 mx-auto mt-4 mb-8" />
            <h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Group <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Divisions</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 lg:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {divisions.map((division, index) => (
              <motion.div 
                key={division.name}
                className="group relative bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border border-zinc-800 rounded-3xl overflow-hidden hover:border-gold/50 transition-all duration-700"
                variants={fadeInUp}
              >
                {/* Background Image with cinematic overlay */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
                  <SafeImage 
                    src={division.image} 
                    fallbackSrc={founderHero}
                    alt={division.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70" />
                </div>
                
                {/* Visit Website Button - Always visible */}
                <a 
                  href={division.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-gold/20 backdrop-blur-md border border-gold/40 text-gold text-xs px-3 py-2 rounded-full hover:bg-gold hover:text-black transition-all duration-300"
                >
                  Visit
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                
                {/* Content */}
                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex items-start gap-6 mb-6">
                    {/* Premium Icon with gradient border */}
                    <div className="w-18 h-18 md:w-20 md:h-20 bg-gradient-to-br from-gold/25 to-gold/5 rounded-2xl flex items-center justify-center border-2 border-gold/40 group-hover:border-gold/70 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-gold/20 transition-all duration-500 flex-shrink-0">
                      <division.icon className="w-9 h-9 md:w-10 md:h-10 text-gold drop-shadow-[0_0_8px_rgba(168,146,90,0.4)]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <span className="text-gold/80 text-xs uppercase tracking-[0.25em] mb-2 block font-medium">{division.tagline}</span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold group-hover:text-gold transition-colors duration-300" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {division.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
                    {division.description}
                  </p>
                </div>
                
                {/* Decorative gold corners */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-gold/15 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LEADERSHIP PHILOSOPHY */}
      <section className="py-24 md:py-40 bg-gradient-to-b from-black via-zinc-950/50 to-black relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20 md:mb-24"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="text-gold text-sm uppercase tracking-[0.4em]">Philosophy</span>
            <GoldLine className="w-32 mx-auto mt-4 mb-8" />
            <h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Leadership <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Philosophy</span>
            </h2>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {philosophyItems.map((item, index) => (
              <motion.div 
                key={item.title}
                className="group bg-gradient-to-b from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-10 hover:border-gold/40 transition-all duration-500 text-center relative overflow-hidden"
                variants={fadeInUp}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-8 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center border border-gold/30 group-hover:border-gold/60 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-gold/10">
                    <item.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h4 className="text-gold text-lg font-semibold uppercase tracking-wider mb-4">
                    {item.title}
                  </h4>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PULL-QUOTE BLOCK - PREMIUM CINEMATIC */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Elegant gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            {/* Premium Quote Card */}
            <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-black/95 border border-gold/30 rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-gold/5">
              {/* Decorative gold corner accents */}
              <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-gold/50 rounded-tl-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-gold/50 rounded-br-3xl" />
              <div className="absolute top-1/4 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-gold/3 rounded-full blur-3xl" />
              
              <div className="text-center relative z-10">
                {/* Quote Icon */}
                <div className="w-20 h-20 mx-auto mb-10 bg-gradient-to-br from-gold/30 to-gold/10 rounded-2xl flex items-center justify-center border border-gold/40 shadow-lg shadow-gold/10">
                  <span className="text-gold text-5xl font-serif leading-none">"</span>
                </div>
                
                {/* Quote Text */}
                <blockquote 
                  className="text-white text-3xl md:text-5xl lg:text-7xl font-light mb-14 leading-tight tracking-tight"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  We <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold font-medium">Create</span> | We <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold font-medium">Elevate</span> | We <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold font-medium">Lead</span>
                </blockquote>
                
                {/* Elegant Divider */}
                <div className="flex items-center justify-center gap-4 mb-10">
                  <div className="w-24 h-px bg-gradient-to-r from-transparent to-gold/50" />
                  <div className="w-2 h-2 bg-gold/60 rounded-full" />
                  <div className="w-24 h-px bg-gradient-to-l from-transparent to-gold/50" />
                </div>
                
                {/* Founder Attribution - Premium Layout */}
                <div className="flex flex-col items-center gap-5">
                  {/* Larger avatar with premium ring */}
                  <div className="relative">
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-full p-1.5 bg-gradient-to-br from-gold via-[#C4A962] to-gold shadow-2xl shadow-gold/30">
                      <div className="w-full h-full rounded-full overflow-hidden bg-black">
                        <SafeImage 
                          src={founderProfessional} 
                          fallbackSrc={founderHero} 
                          alt="Jane Abou Jaoude" 
                          className="w-full h-full object-cover object-[center_15%] scale-125"
                        />
                      </div>
                    </div>
                    {/* Decorative glow ring */}
                    <div className="absolute inset-0 rounded-full border border-gold/20 scale-125 animate-pulse" />
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B96A] to-gold text-2xl md:text-3xl font-semibold tracking-wide mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>Jane Abou Jaoude</p>
                    <p className="text-zinc-300 text-sm uppercase tracking-[0.25em] font-medium">Founder & Chairwoman</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-white text-base font-semibold tracking-wide">JJ Global Capital</p>
                      <p className="text-zinc-400 text-xs">
                        Powered by{" "}
                        <a 
                          href="https://jjholdinggroup.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gold hover:text-gold-light transition-colors underline underline-offset-2"
                        >
                          JJ Holding Group
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIFESTYLE GALLERY */}
      <section className="py-24 md:py-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16 md:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="text-gold text-sm uppercase tracking-[0.4em]">International</span>
            <GoldLine className="w-32 mx-auto mt-4 mb-8" />
            <h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Presence</span>
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* White jet outfit - Full height premium display */}
            <motion.div 
              className="aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 group relative"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderJetWhite} 
                fallbackSrc={founderHero}
                alt="Jane Abou Jaoude - Private Aviation" 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Premium overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Gold corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold/50 rounded-tl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold/50 rounded-br-xl" />
            </motion.div>
            
            {/* Yacht with Dubai skyline at night - Full height premium display */}
            <motion.div 
              className="aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 group relative"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderYachtDubai} 
                fallbackSrc={founderHero}
                alt="Jane Abou Jaoude - Dubai Marina Lifestyle" 
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Premium overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Gold corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold/50 rounded-tl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold/50 rounded-br-xl" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA - JJ GLOBAL CAPITAL - Reduced gap */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-black via-zinc-950/50 to-black border-t border-gold/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-gold to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="mb-8" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Get in Touch</span>
              <GoldLine className="w-32 mx-auto mt-4" />
            </motion.div>
            
            <motion.h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">JJ Global Capital</span>
            </motion.h2>
            
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              For daily requests, partnership discussions, collaboration in our divisions, or investment inquiries, we welcome your correspondence.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 md:gap-5 mb-12"
              variants={fadeInUp}
            >
              <Link 
                to="/contact"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold via-[#D4B96A] to-gold text-black font-semibold px-10 py-4 rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-gold/40 hover:shadow-gold/50 hover:scale-[1.03]"
              >
                Connect <ArrowUpRight className="w-5 h-5" />
              </Link>
              <a 
                href="mailto:partnerships@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Partnership <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:collaboration@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Collaboration <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Careers <Mail className="w-5 h-5" />
              </a>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10"
              variants={fadeInUp}
            >
              <a 
                href={getEmailUrl()} 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">{CONTACT_INFO.emailCapitalized}</span>
              </a>
              <a 
                href="mailto:support@jjglobalcapital.com" 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">Support@JJGlobalCapital.com</span>
              </a>
              <a 
                href={getCallUrl()} 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">{CONTACT_INFO.phone}</span>
              </a>
              <a 
                href={getWhatsAppUrl()} 
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-green-500/50 group-hover:scale-110 transition-all">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-zinc-300">WhatsApp</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA - JJ HOLDING GROUP */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 border-t border-zinc-800 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="mb-8" variants={fadeInUp}>
              <span className="text-zinc-400 text-sm uppercase tracking-[0.4em]">The Group</span>
              <GoldLine className="w-32 mx-auto mt-4" />
            </motion.div>
            
            <motion.h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Connect with <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">JJ Holding Group</span>
            </motion.h2>
            
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl mb-10 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              For media requests, partnership discussions, collaboration in our divisions, or general inquiries, we welcome your correspondence.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 md:gap-5 mb-12"
              variants={fadeInUp}
            >
              <a 
                href="https://jjholdinggroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold via-[#D4B96A] to-gold text-black font-semibold px-10 py-4 rounded-2xl hover:opacity-90 transition-all duration-300 shadow-xl shadow-gold/40 hover:shadow-gold/50 hover:scale-[1.03]"
              >
                Explore JJ Holding Group <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:partnerships@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Partnership <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:collaboration@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Collaboration <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Careers <Mail className="w-5 h-5" />
              </a>
            </motion.div>

            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6"
              variants={fadeInUp}
            >
              <a 
                href="mailto:inquiries@jjholdinggroup.com" 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">Inquiries@JJHoldingGroup.com</span>
              </a>
              <a 
                href="mailto:support@jjholdinggroup.com" 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">Support@JJHoldingGroup.com</span>
              </a>
            </motion.div>

          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Founder;
