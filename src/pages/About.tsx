import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Users, TrendingUp, Building2, BarChart3, FileCheck, Scale, Heart, Target } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { PortraitImage } from "@/components/ui/portrait-image";
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

// Section wrapper with consistent vertical rhythm
const Section = ({ 
  children, 
  className = "", 
  dark = false,
  id
}: { 
  children: React.ReactNode; 
  className?: string;
  dark?: boolean;
  id?: string;
}) => (
  <section 
    id={id}
    className={`py-10 md:py-14 lg:py-[72px] ${dark ? 'bg-zinc-950/80' : 'bg-black'} ${className}`}
  >
    <div className="container mx-auto px-6">
      <div className="max-w-[1100px] mx-auto">
        {children}
      </div>
    </div>
  </section>
);

// Section label component
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span 
    className="block text-gold text-xs uppercase mb-4 tracking-[0.18em]"
    style={{ fontSize: '12px' }}
  >
    {children}
  </span>
);

// Section headline component
const SectionHeadline = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 
    className={`text-white text-2xl md:text-[32px] lg:text-[40px] font-semibold mb-6 leading-tight ${className}`}
    style={{ fontFamily: "Poppins, sans-serif" }}
  >
    {children}
  </h2>
);

// Content text wrapper for readability
const ContentText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={`max-w-[680px] space-y-4 text-zinc-300 ${className}`}
    style={{ fontSize: '17px', lineHeight: 1.75 }}
  >
    {children}
  </div>
);

// Card component for standards/policies
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
    className="bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-6 hover:border-gold/30 transition-colors"
    variants={fadeInUp}
  >
    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-gold" />
    </div>
    <h3 className="text-white text-lg font-semibold mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const About = () => {
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
            <motion.span 
              className="inline-block text-gold text-xs uppercase mb-5 tracking-[0.18em]"
              variants={fadeInUp}
            >
              About JBJ GLOBAL REAL ESTATE
            </motion.span>
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
              <Link to="/contact" className="relative z-20">
                <Button 
                  variant="primary"
                  className="px-8 py-6 text-base"
                >
                  Contact Us
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/properties" className="relative z-20">
                <Button 
                  variant="secondary"
                  className="px-8 py-6 text-base"
                >
                  Browse Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION 2: FOUNDER WRITTEN BLOCK - Image LEFT, Text RIGHT */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* LEFT: Founder Image with Premium Card Background */}
              <motion.div 
                className="flex justify-center"
                variants={fadeInUp}
              >
                <div className="relative">
                  {/* Subtle premium background card */}
                  <div className="absolute inset-0 -m-6 bg-gradient-to-br from-zinc-900/80 to-zinc-950/50 rounded-2xl border border-zinc-800/40" />
                  
                  {/* Circular portrait - GLOBAL FOUNDER IMAGE RULE */}
                  <Link to="/founder" className="block group relative z-10">
                    {/* GLOBAL PORTRAIT IMAGE SYSTEM - LOCKED
                        - Subject fills 70-85% of frame
                        - Head is NEVER cropped
                        - Face centered with focus on upper portion
                        - Uses PortraitImage component */}
                    <PortraitImage 
                      src={founderProfessional}
                      alt="Jane Abou Jaoude, Founder and CEO of JBJ GLOBAL REAL ESTATE"
                      shape="circle"
                      size="full"
                      focus="center"
                      bordered
                      className="w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 mx-auto group-hover:border-gold/60 transition-all duration-300"
                    />
                    <p className="text-center mt-4 text-gold text-sm group-hover:text-gold-light transition-colors">
                      View Leadership Profile →
                    </p>
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT: Founder Statement */}
              <motion.div variants={fadeInUp}>
                <SectionLabel>Written by the Founder</SectionLabel>
                <p className="text-white text-xl md:text-2xl font-medium mb-6">
                  <Link 
                    to="/founder" 
                    className="text-gold hover:text-gold-light underline underline-offset-4 transition-colors"
                  >
                    Jane Abou Jaoude
                  </Link>
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

        {/* SECTION 3: HOW WE OPERATE - Text LEFT, Image RIGHT */}
        <Section dark>
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
                
                {/* Feature Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                    <Users className="w-5 h-5 text-gold mb-2" />
                    <p className="text-white text-sm font-medium">Client-First Advisory</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                    <Shield className="w-5 h-5 text-gold mb-2" />
                    <p className="text-white text-sm font-medium">Capital Protection</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                    <TrendingUp className="w-5 h-5 text-gold mb-2" />
                    <p className="text-white text-sm font-medium">Long-Term Strategy</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4">
                    <Target className="w-5 h-5 text-gold mb-2" />
                    <p className="text-white text-sm font-medium">Goal Alignment</p>
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

        {/* SECTION 4: OFF-PLAN POLICY - 3 Card Layout */}
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

        {/* SECTION 5: MARKET INTELLIGENCE - Image LEFT, Text RIGHT */}
        <Section dark>
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
                
                {/* Overlay Cards - Market Intelligence Visual */}
                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                  <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
                    <BarChart3 className="w-4 h-4 text-gold mb-1" />
                    <p className="text-white text-xs font-medium">Government Data</p>
                  </div>
                  <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
                    <Building2 className="w-4 h-4 text-gold mb-1" />
                    <p className="text-white text-xs font-medium">Infrastructure</p>
                  </div>
                  <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
                    <TrendingUp className="w-4 h-4 text-gold mb-1" />
                    <p className="text-white text-xs font-medium">Market Cycles</p>
                  </div>
                  <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
                    <Target className="w-4 h-4 text-gold mb-1" />
                    <p className="text-white text-xs font-medium">Planning Strategy</p>
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

        {/* SECTION 6: YOUR DECISION - Callout Block */}
        <Section>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
          >
            {/* Callout Block with Background Contrast */}
            <div className="relative bg-gradient-to-br from-zinc-900/90 to-zinc-950/70 border border-zinc-800/50 rounded-2xl p-10 md:p-14 text-center overflow-hidden">
              {/* Subtle gold accent */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              
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
            </div>
          </motion.div>
        </Section>

        {/* SECTION 7: OUR STANDARDS - Card Grid */}
        <Section dark>
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

            <motion.p 
              className="text-zinc-400 text-center mt-8 max-w-2xl mx-auto"
              style={{ fontSize: '15px', lineHeight: 1.7 }}
              variants={fadeInUp}
            >
              Developers do not manage rentals or resales. This is where an independent, licensed brokerage adds real value.
            </motion.p>
          </motion.div>
        </Section>

        {/* SECTION 8: SIGNATURE */}
        <Section className="py-8 md:py-12 lg:py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-block">
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/50 to-transparent mx-auto mb-6" />
              <Link 
                to="/founder" 
                className="inline-block group"
              >
                <p className="text-white text-xl md:text-2xl font-medium mb-2 group-hover:text-gold transition-colors">
                  Jane Abou Jaoude
                </p>
              </Link>
              <p 
                className="text-gold text-xs uppercase tracking-[0.18em]"
              >
                Founder and CEO, JBJ GLOBAL REAL ESTATE
              </p>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 9: CTA */}
        <Section dark className="py-14 md:py-18 lg:py-24">
          <motion.div 
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Ready to Find Your Perfect Property?
            </motion.h2>
            <motion.p 
              className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto"
              variants={fadeInUp}
            >
              Connect with our brokerage team for expert guidance on buying, selling, or renting in the UAE.
            </motion.p>
            <motion.div 
              className="flex flex-wrap justify-center gap-4"
              variants={fadeInUp}
            >
              <Link to="/contact" className="relative z-10">
                <Button 
                  variant="primary"
                  className="px-8 py-6 text-base"
                >
                  Contact Us
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/properties" className="relative z-10">
                <Button 
                  variant="secondary"
                  className="px-8 py-6 text-base"
                >
                  Browse Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Section>

        <Footer />
      </div>
    </>
  );
};

export default About;
