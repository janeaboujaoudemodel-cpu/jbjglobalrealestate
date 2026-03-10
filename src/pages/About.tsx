import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Users, TrendingUp, Building2, BarChart3, FileCheck, Scale, Heart, Target, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { PortraitImage } from "@/components/ui/portrait-image";
import { useLanguage } from "@/contexts/LanguageContext";
import { FounderContent } from "@/components/FounderContent";

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
      <div className="mx-0 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3 sm:p-4">
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
        <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
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
              About JBJ Global Real Estate
            </motion.h1>
            <motion.p 
              className="text-white text-xl md:text-2xl font-medium max-w-3xl mx-auto mb-4"
              style={{ lineHeight: 1.6 }}
              variants={fadeInUp}
            >
              A Licensed Brokerage Built on Structure, Clarity, and Accountability
            </motion.p>
            <motion.p 
              className="text-zinc-300 text-base md:text-lg max-w-3xl mx-auto mb-10"
              style={{ lineHeight: 1.7 }}
              variants={fadeInUp}
            >
              JBJ Global Real Estate is a Dubai-based, mainland licensed real estate brokerage operating across the UAE. Our focus is clear: structured brokerage services for buying, selling, and renting property — supported by data, market intelligence, and disciplined execution. We operate with transparency, regulatory compliance, and long-term client trust at the core of everything we do.
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              {/* Hero CTA Buttons - Transparent bg, white 3D border, white title, gold icon on normal; filled on hover */}
              <Link to="/services" className="relative z-20">
                <button 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="text-white group-hover:text-black transition-colors">Explore Our Services</span>
                  <ArrowUpRight className="w-4 h-4 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  {/* Hover fill overlay */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
              </Link>
              <Link to="/contact" className="relative z-20">
                <button 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="text-white group-hover:text-black transition-colors">Contact Our Team</span>
                  <ArrowUpRight className="w-4 h-4 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  {/* Hover fill overlay */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: FOUNDER WRITTEN BLOCK - WHITE BACKGROUND */}
        <FounderContent>
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
                          alt="Founder & CEO of JBJ GLOBAL REAL ESTATE"
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

                {/* RIGHT: Who We Are */}
                <motion.div variants={fadeInUp} className="mt-8 md:mt-0">
                  <SectionLabel>Who We Are</SectionLabel>
                  <SectionHeadline>Who We Are</SectionHeadline>
                  
                  <ContentText>
                    <p>
                      JBJ Global Real Estate L.L.C. S.O.C is a licensed real estate brokerage authorized to facilitate property transactions across the UAE. We support local and international clients through every stage of the real estate journey — from market understanding and opportunity evaluation to transaction coordination and completion.
                    </p>
                    <p>
                      Our role is brokerage and coordination. Where additional services are required, we introduce clients to independent, licensed partners operating under their own regulatory frameworks.
                    </p>
                  </ContentText>
                </motion.div>
              </div>
            </motion.div>
          </Section>
        </FounderContent>

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
                <SectionLabel>Our Approach</SectionLabel>
                <SectionHeadline>Our Approach</SectionHeadline>
                <ContentText>
                  <p>
                    We believe real estate decisions must be informed, structured, and grounded in verified data — not sales pressure or assumptions.
                  </p>
                  <p>
                    Our approach combines market intelligence, clear process mapping, disciplined transaction management, and defined compliance boundaries. Every engagement is handled with clarity on scope, responsibility, and next steps.
                  </p>
                </ContentText>
                
                {/* Feature Cards - champagne style to match founder card */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <BarChart3 className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Market Intelligence from Official Data</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <FileCheck className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Clear Process Mapping</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <Target className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Disciplined Transaction Management</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-lg p-5 shadow-sm">
                    <Shield className="w-6 h-6 text-gold mb-3" />
                    <p className="text-black text-base font-semibold leading-snug">Defined Compliance Boundaries</p>
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
              <SectionLabel>What We Do</SectionLabel>
              <SectionHeadline className="max-w-2xl mx-auto">What We Do</SectionHeadline>
            </motion.div>

            {/* 3 Card Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={Building2}
                title="Property Buying & Selling"
                description="Off-plan and ready property buying, primary and secondary selling, with structured transaction support."
              />
              <FeatureCard 
                icon={Users}
                title="Residential & Commercial Rentals"
                description="Rental coordination for landlords and tenants across residential and commercial properties."
              />
              <FeatureCard 
                icon={Heart}
                title="Intelligence & Partner Introductions"
                description="Market intelligence, area analysis, investment education, and introductions to licensed partners (legal, mortgage, visa). All services within our licensed scope."
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
                <SectionLabel>Market Intelligence & Data</SectionLabel>
                <SectionHeadline>Data-Driven, Not Opinion-Driven</SectionHeadline>
                <ContentText>
                  <p>
                    Our market insights, reports, and tools are built using aggregated official data and verified market information. These insights are designed to support understanding, comparison, and clarity — not to predict outcomes or guarantee results.
                  </p>
                  <p>
                    All data usage is transparent, referenced, and handled in accordance with applicable regulations.
                  </p>
                </ContentText>
              </motion.div>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 6: WHAT WE DO NOT DO */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="text-center"
          >
            <SectionLabel>Regulatory Boundaries</SectionLabel>
            <SectionHeadline className="max-w-3xl mx-auto">
              Regulatory Boundaries
            </SectionHeadline>
            <ContentText className="max-w-2xl mx-auto text-center">
              <p>
                To maintain compliance and protect our clients, it is important to be clear about what we do not provide directly.
              </p>
              <p>
                JBJ Global Real Estate does NOT provide: legal advice or legal services, mortgage or banking services, financial or investment advisory services, or immigration or visa issuance services. Where such services are required, clients are introduced to independent, licensed partners and contract directly with them.
              </p>
            </ContentText>
          </motion.div>
        </Section>

        {/* SECTION 7: TECHNOLOGY WITH GOVERNANCE */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-10" variants={fadeInUp}>
              <SectionLabel>Trust & Governance</SectionLabel>
              <SectionHeadline className="max-w-2xl mx-auto">Trust, Governance, and Accountability</SectionHeadline>
            </motion.div>

            {/* 4 Card Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <FeatureCard 
                icon={Shield}
                title="AI Tools Monitored"
                description="AI-assisted tools are monitored and logged for transparency and accuracy."
              />
              <FeatureCard 
                icon={FileCheck}
                title="Intelligence Reviewed"
                description="Market intelligence is reviewed before publication to ensure quality."
              />
              <FeatureCard 
                icon={Scale}
                title="Data Confidentiality"
                description="Client data is handled with confidentiality and access controls."
              />
              <FeatureCard 
                icon={Target}
                title="Licensed Scope"
                description="All activities remain within licensed scope. Trust is built through discipline — not promises."
              />
            </div>

          </motion.div>
        </Section>

        {/* SECTION 8: OUR COMMITMENT */}
        <Section className="py-8 md:py-12 lg:py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-2xl mx-auto"
          >
            <SectionLabel>Our Commitment</SectionLabel>
            <SectionHeadline>Our Commitment</SectionHeadline>
            <ContentText className="mx-auto text-center">
              <p>
                We are committed to: clear communication, accurate information, structured processes, and long-term client trust.
              </p>
              <p>
                Real estate is not about speed — it is about precision.
              </p>
            </ContentText>
            
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto my-6" />
            
            <ContentText className="mx-auto text-center text-sm">
              <p>
                JBJ Global Real Estate is a licensed real estate brokerage in Dubai (Mainland). For regulated services outside our scope, we facilitate introductions to independent licensed partners. All engagements are governed by UAE law and applicable regulations.
              </p>
            </ContentText>
            
            {/* Initials */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black border-2 border-gold mt-4">
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
                    Not Sure Where to Start?
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
                    variants={fadeInUp}
                  >
                    Whether you are buying, renting, investing, or simply seeking clarity — our role is to guide you with precision, not pressure.
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
                          <span className="text-black group-hover:text-gold transition-colors">Speak with</span>
                          <span className="text-gold group-hover:text-black transition-colors">Our Team</span>
                        </span>
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-gold transition-colors relative z-10" />
                      </button>
                    </Link>

                    {/* Secondary Button - Browse Properties */}
                    <Link to="/services" className="w-full sm:w-auto">
                      <button 
                        className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                      >
                        Explore Our Services
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
