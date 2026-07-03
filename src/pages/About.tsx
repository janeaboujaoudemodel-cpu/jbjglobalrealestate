import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Shield, Users, TrendingUp, Building2, BarChart3, FileCheck, Scale, Heart, Target, Sparkles, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { PortraitImage } from "@/components/ui/portrait-image";
import { useLanguage } from "@/contexts/LanguageContext";
import { FounderContent } from "@/components/FounderContent";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";

import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import luxuryVilla2 from "@/assets/luxury-villa-2.jpeg";
import aboutHeroVideoAsset from "@/assets/videos/dubai-landmarks-hero.mp4.asset.json";
const aboutHeroVideo = aboutHeroVideoAsset.url;
import { FounderPhotoEditOverlay } from "@/components/founder/FounderPhotoEditOverlay";
import { useFounderPhoto } from "@/hooks/useFounderPhoto";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};


// Founder portrait that honors the owner-uploaded override
const FounderAboutPortrait = () => {
  const { photoUrl } = useFounderPhoto();
  const src = photoUrl || founderProfessional;
  return (
    <img
      src={src}
      alt="Founder & CEO of JBJ GLOBAL REAL ESTATE"
      className="w-full h-full transition-transform duration-300 group-hover:scale-105"
      style={{ objectFit: 'cover', objectPosition: 'center 5%', transform: 'scale(1.25)' }}
      loading="lazy"
      decoding="async"
    />
  );
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
  // Cleaner, tighter section: single champagne band, one thin gold hairline
  return (
    <section
      id={id}
      className={`py-8 md:py-10 lg:py-12 bg-[#1A1A1A] ${className}`}
    >
      <div className="jj-section-gutter">
        <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/40 rounded-2xl p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
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
    className={`block text-[#1A1A1A] text-xs uppercase mb-4 tracking-[0.18em]`}
    style={{ fontSize: '12px' }}
  >
    {children}
  </span>
);

// Section headline component - now defaults to black text on pearl background
const SectionHeadline = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 
    className={`text-[#1A1A1A] text-2xl md:text-[32px] lg:text-[40px] font-semibold mb-6 leading-tight ${className}`}
  >
    {children}
  </h2>
);

// Content text wrapper for readability - now defaults to dark text on pearl background
const ContentText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div 
    className={`max-w-[680px] space-y-4 text-[#1A1A1A]/70 ${className}`}
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
  icon: import("lucide-react").LucideIcon; 
  title: string; 
  description: string;
}) => (
  <motion.div 
    className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 hover:border-[#B89555] rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_0_25px_rgba(200,167,102,0.28),0_18px_50px_rgba(0,0,0,0.35)] hover:-translate-y-1"
    variants={fadeInUp}
  >
    <IconTile icon={Icon} tone="gold" size="lg" className="mb-5" />

    <h3 className="text-[#1A1A1A] text-xl font-semibold mb-3">{title}</h3>
    <p className="text-[#1A1A1A]/70 text-base leading-relaxed">{description}</p>
  </motion.div>
);

const About = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <SEOHead {...pagesSEO.about} />
      <div data-marketing-page className="min-h-screen bg-[#F7F2EA]">

        {/* SECTION 1: HERO — clean cinematic video */}
        <section
          className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden"
          data-surface="dark"
          data-hero-dark
        >
          <div className="absolute inset-0">
            <video
              src={aboutHeroVideo}
              poster={luxuryVillaHero}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B]/85 via-black/80 to-black/95" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
          </div>

          <motion.div
            className="relative z-10 text-center px-6 max-w-[1000px] mx-auto py-20"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span
              className="inline-block mb-5 text-[#E6CF93] text-[10px] md:text-[11px] uppercase tracking-[0.32em] font-medium"
              variants={fadeInUp}
            >
              JBJ Global Real Estate
            </motion.span>
            <motion.h1
              className="text-white text-[36px] md:text-[52px] lg:text-[62px] font-light tracking-tight mb-5 leading-[1.05]"
              variants={fadeInUp}
            >
              A licensed brokerage, built on{" "}
              <span className="italic font-normal text-[#E6CF93]">clarity</span>.
            </motion.h1>
            <motion.p
              className="text-white/85 text-base md:text-lg max-w-2xl mx-auto mb-10 font-light"
              style={{ lineHeight: 1.75 }}
              variants={fadeInUp}
            >
              A Dubai mainland brokerage operating across the UAE. Structured advisory for buying, selling and renting property, grounded in verified market data and disciplined execution.
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              variants={fadeInUp}
            >
              {/* On dark hero: solid champagne primary + outlined secondary — both fully legible */}
              <Link
                to="/services"
                data-allow-dark-cta
                data-no-contrast-guard
                className="allow-white group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555] hover:bg-[#EFE6D6] transition-colors"
              >
                <span>Explore Our Services</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                data-allow-dark-cta
                data-no-contrast-guard
                className="allow-white group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full bg-transparent text-white border border-white/70 hover:bg-white/10 transition-colors"
              >
                <span className="text-white">Contact Our Team</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
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
                    {/* Emerald→black gradient card for premium dark look */}
                    <div className="absolute inset-0 -m-6 bg-gradient-to-br from-[#064E3B] via-[#052E22] to-black rounded-2xl border border-[#B89555]/40 shadow-[0_20px_60px_rgba(0,0,0,0.45)]" />

                    <div className="relative z-10">
                      <Link to="/founder" className="block group">
                        <div className="relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 mx-auto rounded-full overflow-hidden border-2 border-[#B89555] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(200,167,102,0.4),0_20px_50px_rgba(0,0,0,0.35)] group-hover:-translate-y-1">
                          <FounderAboutPortrait />
                        </div>
                      </Link>
                      <FounderPhotoEditOverlay />
                      <Link to="/founder" className="block mt-4">
                        <button
                          data-allow-dark-cta
                          data-no-contrast-guard
                          className="allow-white group/btn relative inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 w-full bg-white/10 border border-[#B89555]/60 text-white hover:bg-white/20"
                        >
                          <span className="text-white">Know more about the founder</span>
                          <span aria-hidden className="text-white">↗</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>


                {/* RIGHT: Who We Are */}
                <motion.div variants={fadeInUp} className="mt-8 md:mt-0">
                  <SectionLabel>Who We Are</SectionLabel>
                  <SectionHeadline>Who We Are</SectionHeadline>
                  
                  <ContentText>
                    <p>
                      JBJ Global Real Estate L.L.C. S.O.C is a licensed real estate brokerage authorized to facilitate property transactions across the UAE. We support local and international clients through every stage of the real estate journey, from market understanding and opportunity evaluation to transaction coordination and completion.
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
                    We believe real estate decisions must be informed, structured, and grounded in verified data, not sales pressure or assumptions.
                  </p>
                  <p>
                    Our approach combines market intelligence, clear process mapping, disciplined transaction management, and defined compliance boundaries. Every engagement is handled with clarity on scope, responsibility, and next steps.
                  </p>
                </ContentText>
                
                {/* Feature Cards - champagne style to match founder card */}
                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-lg p-5 shadow-sm">
                    <BarChart3 className="w-6 h-6 text-[#1A1A1A] mb-3" />
                    <p className="text-[#1A1A1A] text-base font-semibold leading-snug">Market Intelligence from Official Data</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-lg p-5 shadow-sm">
                    <FileCheck className="w-6 h-6 text-[#1A1A1A] mb-3" />
                    <p className="text-[#1A1A1A] text-base font-semibold leading-snug">Clear Process Mapping</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-lg p-5 shadow-sm">
                    <Target className="w-6 h-6 text-[#1A1A1A] mb-3" />
                    <p className="text-[#1A1A1A] text-base font-semibold leading-snug">Disciplined Transaction Management</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-lg p-5 shadow-sm">
                    <Shield className="w-6 h-6 text-[#1A1A1A] mb-3" />
                    <p className="text-[#1A1A1A] text-base font-semibold leading-snug">Defined Compliance Boundaries</p>
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
                
                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
                  {[
                    { Icon: BarChart3, label: "Government Data" },
                    { Icon: Building2, label: "Infrastructure" },
                    { Icon: TrendingUp, label: "Market Cycles" },
                    { Icon: Target, label: "Planning Strategy" },
                  ].map(({ Icon, label }) => (
                    <div
                      key={label}
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="allow-white rounded-lg p-5 border border-[#B89555]/40"
                      style={{ background: '#0A0A0A' }}
                    >
                      <Icon className="w-7 h-7 mb-3" style={{ color: '#FFFFFF' }} />
                      <p className="text-base font-semibold" style={{ color: '#FFFFFF' }}>{label}</p>
                    </div>
                  ))}
                </div>

              </motion.div>

              {/* RIGHT: Text Content */}
              <motion.div variants={fadeInUp}>
                <SectionLabel>Market Intelligence & Data</SectionLabel>
                <SectionHeadline>Data-Driven, Not Opinion-Driven</SectionHeadline>
                <ContentText>
                  <p>
                    Our market insights, reports, and tools are built using aggregated official data and verified market information. These insights are designed to support understanding, comparison, and clarity. They are not designed to predict outcomes or guarantee results.
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
                description="All activities remain within licensed scope. Trust is built through discipline, not promises."
              />
            </div>

          </motion.div>
        </Section>

        {/* SECTION 8: OUR COMMITMENT */}
        <Section className="!py-6 md:!py-8">
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
                Real estate is not about speed. It is about precision.
              </p>
            </ContentText>
            
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#064E3B] to-transparent mx-auto my-6" />
            
            <ContentText className="mx-auto text-center text-sm">
              <p>
                JBJ Global Real Estate is a licensed real estate brokerage in Dubai (Mainland). For regulated services outside our scope, we facilitate introductions to independent licensed partners. All engagements are governed by UAE law and applicable regulations.
              </p>
            </ContentText>
            
            {/* Initials */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full jj-pill-emerald-metallic border-0 mt-4">
              <span className="text-white text-xl font-bold">JBJ</span>
            </div>
          </motion.div>
        </Section>

        {/* SECTION 9: CTA — standardized "Ready to Get Started" block for site-wide consistency */}
        <CombinedContactNewsletter
          title="Not Sure Where to Start?"
          subtitle="Whether you are buying, renting, investing, or simply seeking clarity, our role is to guide you with precision, not pressure."
        />
      </div>
    </>
  );
};

export default About;
