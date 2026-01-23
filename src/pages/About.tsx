import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Users, TrendingUp, Building2, BarChart3, FileCheck, Scale, Heart, Target, Sparkles } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { PortraitImage } from "@/components/ui/portrait-image";
import { useLanguage } from "@/contexts/LanguageContext";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import luxuryVilla2 from "@/assets/luxury-villa-2.jpeg";
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

// Section wrapper with 3-layer system: Black page > Active Champagne section > Pearl content
// Thin black contour on sides (~0.75rem / mx-3)
const Section = ({ 
  children, 
  className = "", 
  dark = false,
  light = false,
  id
}: { 
  children: React.ReactNode; 
  className?: string;
  dark?: boolean;
  light?: boolean;
  id?: string;
}) => {
  // All sections now use 3-layer system on black background
  return (
    <section 
      id={id}
      className={`py-10 md:py-14 lg:py-[72px] bg-black ${className}`}
    >
      {/* Thin black contour + Active Champagne Layer */}
      <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3 sm:p-4">
        {/* Inner Pearl Layer */}
        <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
          <div className="max-w-[1100px] mx-auto">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

// Section label component - supports light backgrounds
const SectionLabel = ({ children, dark = true }: { children: React.ReactNode; dark?: boolean }) => (
  <span 
    className={`block text-gold text-xs uppercase mb-4 tracking-[0.18em]`}
    style={{ fontSize: '12px' }}
  >
    {children}
  </span>
);

// Section headline component - now defaults to black text on pearl background
const SectionHeadline = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 
    className={`text-black text-2xl md:text-[32px] lg:text-[40px] font-semibold mb-6 leading-tight ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {children}
  </h2>
);

// Content text wrapper for readability - now defaults to dark text on pearl background
const ContentText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={`max-w-[680px] space-y-4 text-zinc-700 ${className}`}
    style={{ fontSize: '17px', lineHeight: 1.75 }}
  >
    {children}
  </div>
);

// Card component for standards/policies - 3D hover with gold border
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
}) => (
  <motion.div 
    className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_0_25px_rgba(200,167,102,0.28),0_18px_50px_rgba(0,0,0,0.35)] hover:-translate-y-1"
    variants={fadeInUp}
  >
    <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center mb-5">
      <Icon className="w-7 h-7 text-gold" />
    </div>
    <h3 className="text-black text-xl font-semibold mb-3">{title}</h3>
    <p className="text-zinc-600 text-base leading-relaxed">{description}</p>
  </motion.div>
);

const About = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <SEOHead {...pagesSEO.about} />
      <div className="min-h-screen bg-black">
        
        {/* SECTION 1: HERO */}
        <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={luxuryVillaHero} 
              alt="About JBJ GLOBAL REAL ESTATE" 
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
          </div>
          
          <motion.div 
            className="relative z-10 text-center px-6 max-w-[1100px] mx-auto py-24"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge - Glass style with gold border, engraved look */}
            <motion.button 
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">About JBJ Global Real Estate</span>
            </motion.button>
            <motion.h1 
              className="text-white text-[36px] md:text-[48px] lg:text-[58px] font-semibold mb-6 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Built on Vision.<br className="hidden md:block" /> Driven by Results.
            </motion.h1>
            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ lineHeight: 1.7 }}
              variants={fadeInUp}
            >
              Licensed to BUY · SELL · RENT across the UAE.
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              {/* Hero CTA Buttons - Transparent bg, white 3D border, white title, gold icon on normal; filled on hover */}
              <Link to="/contact" className="relative z-20">
                <button 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="text-white group-hover:text-black transition-colors">Contact Us</span>
                  <ArrowUpRight className="w-4 h-4 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  {/* Hover fill overlay */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
              </Link>
              <Link to="/properties" className="relative z-20">
                <button 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="text-white group-hover:text-black transition-colors">Browse Properties</span>
                  <ArrowUpRight className="w-4 h-4 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  {/* Hover fill overlay */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: FOUNDER WRITTEN BLOCK - WHITE BACKGROUND */}
        <Section light>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* LEFT: Founder Image with Premium Champagne Card Background */}
              <motion.div 
                className="flex justify-center"
                variants={fadeInUp}
              >
                <div className="relative">
                  {/* Champagne background card for premium look */}
                  <div className="absolute inset-0 -m-6 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl border border-gold/30 shadow-lg" />
                  
                  {/* Circular portrait - GLOBAL PORTRAIT RULE: object-position center 5%, lifted up, no cropping */}
                  {/* KEEP gold border always, add 3D lift on hover */}
                  <Link to="/founder" className="block group relative z-10">
                    <div className="w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 mx-auto rounded-full overflow-hidden border-2 border-gold transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(200,167,102,0.4),0_20px_50px_rgba(0,0,0,0.35)] group-hover:-translate-y-2">
                      <img 
                        src={founderProfessional}
                        alt="Founder & CEO Jane Bou Jaoude of JBJ GLOBAL REAL ESTATE"
                        className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'center 5%',
                          transform: 'scale(1.3)',
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    {/* Know More About the Founder - REVERSED: secondary on normal, primary on hover */}
                    <button 
                      className="group/btn mt-4 relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 overflow-hidden w-full bg-transparent border-2 border-black hover:border-gold"
                      style={{
                        background: 'transparent',
                      }}
                    >
                      {/* Hover overlay - 3D gold gradient */}
                      <span 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                          boxShadow: '0 6px 20px rgba(200,167,102,0.3), 0 4px 10px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(200,167,102,0.2)',
                        }}
                      />
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/0 group-hover/btn:from-white/80 to-transparent pointer-events-none transition-all duration-300" />
                      <span className="relative flex items-center justify-center gap-1">
                        <span className="text-black group-hover/btn:text-gold transition-colors">Know More About the</span>
                        <span className="text-gold group-hover/btn:text-black transition-colors">Founder</span>
                        <span className="text-black group-hover/btn:text-gold transition-colors">↗</span>
                      </span>
                    </button>
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT: Founder Statement */}
              <motion.div variants={fadeInUp} className="mt-8 md:mt-0">
                <p className="text-sm font-medium tracking-wide mb-6">
                  <span className="text-gold uppercase tracking-[0.15em]">Written by Founder & CEO,</span>{" "}
                  <Link 
                    to="/founder" 
                    className="text-black text-xl md:text-2xl font-semibold hover:text-gold transition-colors"
                  >
                    Jane Bou Jaoude
                  </Link>
                  <span className="block mt-2">
                    <Link 
                      to="/about" 
                      className="text-white bg-black px-3 py-1 rounded text-sm font-medium hover:text-gold transition-colors inline-block"
                    >
                      JBJ Global Real Estate
                    </Link>
                    <span className="block h-0.5 w-24 bg-gold mt-2" />
                  </span>
                </p>
                
                <ContentText>
                  <p>
                    I believe real estate decisions should never be driven by pressure, commissions, or promises that do not exist in reality.
                  </p>
                  <p>
                    There is no such thing as guaranteed ROI. Real estate follows cycles, market forces, and external factors that cannot be controlled.
                  </p>
                  <p>
                    My responsibility as the founder is to protect people from decisions made with incomplete information or unrealistic expectations.
                  </p>
                </ContentText>
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 3: HOW WE OPERATE - BLACK BACKGROUND */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* LEFT: Text Content */}
              <motion.div variants={fadeInUp}>
                <SectionLabel>How We Operate</SectionLabel>
                <SectionHeadline>Client Capital, Treated as Our Own</SectionHeadline>
                <ContentText>
                  <p>
                    At JBJ GLOBAL REAL ESTATE, we work with clients as if we are investing our own capital.
                  </p>
                  <p>
                    We do not treat a client's portfolio as a transaction. We treat it as if it were our own.
                  </p>
                </ContentText>
                
                {/* Feature Cards - champagne style to match founder card */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <Users className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Client-First Advisory</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <Shield className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Capital Protection</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <TrendingUp className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Long-Term Strategy</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <Target className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Goal Alignment</p>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT: Visual */}
              <motion.div 
                className="relative rounded-2xl overflow-hidden"
                variants={fadeInUp}
              >
                {/* Property/landscape images can use object-cover as they are not portraits */}
                <img 
                  src={luxuryVilla1} 
                  alt="Premium Advisory Services" 
                  className="w-full h-[400px] object-cover rounded-2xl"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 4: OFF-PLAN POLICY - BLACK BACKGROUND with WHITE CARDS */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-10" variants={fadeInUp}>
              <SectionLabel>Off-Plan Policy</SectionLabel>
              <SectionHeadline className="max-w-2xl mx-auto">No Fees. No Pressure.</SectionHeadline>
            </motion.div>

            {/* 3 Card Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={FileCheck}
                title="No Client Fees"
                description="For off-plan properties, we do not charge clients any fees. We do not take money from clients to sell them a project."
              />
              <FeatureCard 
                icon={Shield}
                title="No Pressure"
                description="Our role is to protect, guide, and educate. It is not to push clients toward what benefits us or the company."
              />
              <FeatureCard 
                icon={Heart}
                title="Client Protection First"
                description="We prioritize client interests above all else. Every recommendation is made with your financial wellbeing in mind."
              />
            </div>
          </motion.div>
        </Section>

        {/* SECTION 5: MARKET INTELLIGENCE */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* LEFT: Visual Panel */}
              <motion.div 
                className="relative"
                variants={fadeInUp}
              >
                <img 
                  src={luxuryVilla2} 
                  alt="Market Intelligence Analysis" 
                  className="w-full h-[420px] object-cover rounded-2xl"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-2xl" />
                
                {/* Overlay Cards - Market Intelligence Visual - LARGER CONTENT */}
                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                  <div className="bg-black/85 backdrop-blur-sm border border-gold/30 rounded-lg p-5">
                    <BarChart3 className="w-8 h-8 text-gold mb-3" />
                    <p className="text-white text-base font-semibold">Government Data</p>
                  </div>
                  <div className="bg-black/85 backdrop-blur-sm border border-gold/30 rounded-lg p-5">
                    <Building2 className="w-8 h-8 text-gold mb-3" />
                    <p className="text-white text-base font-semibold">Infrastructure</p>
                  </div>
                  <div className="bg-black/85 backdrop-blur-sm border border-gold/30 rounded-lg p-5">
                    <TrendingUp className="w-8 h-8 text-gold mb-3" />
                    <p className="text-white text-base font-semibold">Market Cycles</p>
                  </div>
                  <div className="bg-black/85 backdrop-blur-sm border border-gold/30 rounded-lg p-5">
                    <Target className="w-8 h-8 text-gold mb-3" />
                    <p className="text-white text-base font-semibold">Planning Strategy</p>
                  </div>
                </div>
              </motion.div>

              {/* RIGHT: Text Content */}
              <motion.div variants={fadeInUp}>
                <SectionLabel>Market Intelligence</SectionLabel>
                <SectionHeadline>Data, Not Opinion</SectionHeadline>
                <ContentText>
                  <p>
                    Developers promote their own projects. Sales agents sell what they are assigned. Our role is different.
                  </p>
                  <p>
                    We analyze the entire market. This includes developers, projects, locations, pricing history, and future planning zones.
                  </p>
                  <p>
                    Our analysis relies on official government data, public planning strategies, infrastructure roadmaps, and historical real estate cycles.
                  </p>
                </ContentText>
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 6: YOUR DECISION */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="text-center"
          >
            <SectionLabel>Your Decision</SectionLabel>
            <SectionHeadline className="max-w-3xl mx-auto">
              Clarity, Confidence, Protection
            </SectionHeadline>
            <ContentText className="max-w-2xl mx-auto text-center">
              <p>
                Clients always make the final decision.
              </p>
              <p>
                Our role is to provide clarity, structure, and protection so decisions are made with confidence.
              </p>
            </ContentText>
          </motion.div>
        </Section>

        {/* SECTION 7: OUR STANDARDS - Card Grid */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-10" variants={fadeInUp}>
              <SectionLabel>Our Standards</SectionLabel>
              <SectionHeadline className="max-w-2xl mx-auto">Integrity in Every Transaction</SectionHeadline>
            </motion.div>

            {/* 4 Card Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <FeatureCard 
                icon={Scale}
                title="Ethical Practice"
                description="We do not sell based on personal relationships, commission levels, or convenience."
              />
              <FeatureCard 
                icon={Shield}
                title="Legal Compliance"
                description="We respect the laws of the United Arab Emirates."
              />
              <FeatureCard 
                icon={Heart}
                title="Client Respect"
                description="We respect the client. We respect the capital being invested."
              />
              <FeatureCard 
                icon={TrendingUp}
                title="Post-Handover Support"
                description="We continue supporting clients through rental strategy, resale planning, and long-term asset positioning."
              />
            </div>

          </motion.div>
        </Section>

        {/* SECTION 8: SIGNATURE */}
        <Section className="py-8 md:py-12 lg:py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-zinc-700 text-base md:text-lg mb-6 leading-relaxed">
              Developers do not manage rentals or resales. This is where an independent, licensed brokerage adds real value.
            </p>
            
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6" />
            
            <Link 
              to="/founder" 
              className="inline-block group"
            >
              <p className="text-black text-xl md:text-2xl font-medium mb-2 group-hover:text-gold transition-colors">
                Founder & CEO Jane Bou Jaoude
              </p>
            </Link>
            <p 
              className="text-gold text-xs uppercase tracking-[0.18em] mb-4"
            >
              JBJ GLOBAL REAL ESTATE
            </p>
            
            {/* Initials */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black border-2 border-gold">
              <span className="text-gold text-xl font-bold">JBJ</span>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 9: CTA - 3-Layer System: Black > Active Champagne > Pearl */}
        <section className="py-16 sm:py-20 bg-black">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto">
              {/* OUTER CARD - Active Champagne Layer */}
              <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl sm:rounded-3xl p-2 sm:p-3">
                {/* INNER CARD - Pearl Layer */}
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-14 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                >
                  {/* Badge */}
                  <motion.div 
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full text-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 shadow-lg shadow-gold/20"
                    variants={fadeInUp}
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold" />
                    Begin Your Journey
                  </motion.div>

                  {/* Title */}
                  <motion.h2 
                    className="text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 leading-tight"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                    variants={fadeInUp}
                  >
                    Ready to Find Your Perfect Property?
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
                    variants={fadeInUp}
                  >
                    Connect with our brokerage team for expert guidance on buying, selling, or renting in the UAE.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div 
                    className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4"
                    variants={fadeInUp}
                  >
                    {/* Primary Button - Contact Us */}
                    <Link to="/contact" className="w-full sm:w-auto">
                      <button 
                        className="group relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
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
                        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                        <span className="relative flex items-center gap-1">
                          <span className="text-black group-hover:text-gold transition-colors">Contact</span>
                          <span className="text-gold group-hover:text-black transition-colors">Us</span>
                        </span>
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-gold transition-colors relative z-10" />
                      </button>
                    </Link>

                    {/* Secondary Button - Browse Properties */}
                    <Link to="/properties" className="w-full sm:w-auto">
                      <button 
                        className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                      >
                        Browse Properties
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default About;
