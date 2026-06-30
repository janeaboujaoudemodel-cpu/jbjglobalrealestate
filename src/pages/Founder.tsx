import { Link, Navigate } from "react-router-dom";
import { ArrowUpRight, Building2, Users, Award, Globe, Shield, Scale, Briefcase, FileCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/SafeImage";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { IconTile } from "@/components/ui/icon-tile";
import { FounderPhotoEditOverlay } from "@/components/founder/FounderPhotoEditOverlay";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { useFounderPhoto } from "@/hooks/useFounderPhoto";

// Cream divider used between marketing sections — replaces the heavy black bands.
const CreamDivider = () => (
  <div aria-hidden className="w-full bg-[#FDFBF7]">
    <div className="h-px bg-[#EFE6D6]" />
  </div>
);


// Import founder images
import founderHero from "@/assets/founder-hero.png";
import founderPremium from "@/assets/founder-premium.png";
import founderProfessional from "@/assets/founder-professional.jpeg";
import ceoHeroOfficeFlags from "@/assets/ceo-hero-office-flags.jpg";

// Animation variants - NO y-axis animations to avoid "broken/falling" effect
const fadeInUp = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
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

// Decorative gold line component
const GoldLine = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent ${className}`} />
);

// Executive Leadership Team Data
const executiveTeam = [
  {
    name: "Jane Bou Jaoude",
    nameAr: "جاين بو جودة",
    role: "Founder & Chief Executive Officer",
    responsibility: "Responsible for strategic leadership, regulatory alignment, and executive oversight of all brokerage operations.",
    icon: Award,
  },
  {
    name: "Operations Director",
    nameAr: "",
    role: "Director of Operations",
    responsibility: "Oversees day-to-day brokerage operations, client workflows, and internal process governance.",
    icon: Briefcase,
  },
  {
    name: "Compliance Officer",
    nameAr: "",
    role: "Head of Compliance",
    responsibility: "Ensures regulatory compliance across all brokerage activities and partner coordination.",
    icon: Shield,
  },
  {
    name: "Advisory Lead",
    nameAr: "",
    role: "Head of Client Advisory",
    responsibility: "Manages client advisory frameworks, transaction support, and service delivery standards.",
    icon: Users,
  },
];

const Founder = () => {
  const { isFounderVisible, isLoading } = useFounderVisibility();
  const { photoUrl: founderPhotoOverride } = useFounderPhoto();


  // Redirect to about page if founder visibility is disabled
  if (!isLoading && !isFounderVisible) {
    return <Navigate to="/about" replace />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] overflow-x-hidden">
      {/* SEO Meta Tags */}
      <SEOHead {...pagesSEO.founder} />
      
      {/* HERO - CINEMATIC FULL BLEED */}
      <section className="relative min-h-screen flex items-end">
        {/* Background with parallax effect */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <SafeImage 
            src={ceoHeroOfficeFlags} 
            fallbackSrc={founderHero}
            alt="Founder & Leadership - JBJ Global Real Estate"
            className="w-full h-full bg-[#FDFBF7]"
            style={{ objectFit: "cover", objectPosition: "center 15%" }}
          />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[#1A1A1A]/10" />
        </motion.div>
        
        {/* Gold accent lines */}
        <div className="absolute left-0 top-1/3 w-32 md:w-64 h-px bg-gradient-to-r from-gold/50 to-transparent" />
        <div className="absolute right-0 bottom-1/3 w-32 md:w-64 h-px bg-gradient-to-l from-gold/50 to-transparent" />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
          <motion.div 
            className="max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="mb-4" variants={fadeInUp}>
              <SectionEyebrow icon={Building2}>Executive Governance</SectionEyebrow>
            </motion.div>
            
            <motion.h1 
              className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-4"
              variants={fadeInUp}
            >
              Founder &
              <br />
              <span className="text-[#FDFBF7]">
                Leadership
              </span>
            </motion.h1>
            
            <motion.div variants={fadeInUp}>
              <p className="text-white text-lg md:text-xl lg:text-2xl mb-1 font-semibold tracking-wide">
                Executive Governance of JBJ Global Real Estate
              </p>
              <p className="text-white/70 text-sm md:text-base mb-6 max-w-2xl">
                JBJ Global Real Estate operates under a clearly defined leadership and governance structure to ensure accountability, regulatory compliance, and operational excellence across all brokerage activities.
              </p>
            </motion.div>
            
            <motion.div variants={fadeInUp}>
              <a 
                href="#leadership"
                data-surface="champagne"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold/20 to-gold/10 border border-[#B89555]/50 text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#EFE6D6]/30 transition-all duration-300"
              >
                Meet Our Leadership
                <ArrowUpRight className="w-4 h-4 text-[#1A1A1A]" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Thin eyebrow on champagne — replaces the heavy black "Leadership" divider block */}
      <section className="relative bg-[#FDFBF7] pt-6 pb-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-1.5 text-[#1A1A1A]/70">
            <span className="text-[10px] uppercase tracking-[0.3em]">Leadership</span>
            <div className="w-px h-6 bg-[#B89555]/60" />
          </div>
        </div>
      </section>
      <CreamDivider />

      {/* SECTION 1: FOUNDER - 3-Layer System */}
      <section id="leadership" className="py-10 md:py-14 bg-[#FDFBF7] relative overflow-hidden">
        <div className="jj-layer-2" data-surface="champagne">
          <div className="jj-layer-active rounded-2xl p-4 sm:p-6 md:p-8" data-surface="champagne">
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
                  {/* Premium Gold frame accent */}
                  <div className="absolute -inset-3 bg-gradient-to-br from-gold/15 via-transparent to-gold/10 rounded-3xl" />
                  <div className="absolute -top-1 -left-1 w-16 h-16 border-l-[3px] border-t-[3px] border-[#B89555] rounded-tl-3xl" />
                  <div className="absolute -bottom-1 -right-1 w-16 h-16 border-r-[3px] border-b-[3px] border-[#B89555] rounded-br-3xl" />
                  
                  {/* Main photo container */}
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border-[3px] border-[#B89555] shadow-[0_0_60px_rgba(200,167,102,0.25)] bg-[#FDFBF7]">
                    <SafeImage 
                      src={founderPhotoOverride || founderPremium} 
                      fallbackSrc={founderProfessional}
                      alt="Jane Bou Jaoude (جاين بو جودة), Founder & CEO of JBJ Global Real Estate" 
                      className="w-full h-full"
                      style={{ objectFit: "cover", objectPosition: "center 15%" }}
                    />
                    <FounderPhotoEditOverlay />
                  </div>
                  
                  {/* Floating badge */}
                  <motion.div 
                    className="absolute -bottom-4 -right-4 bg-gradient-to-br from-gold to-[#C4A962] p-3 rounded-xl shadow-xl shadow-gold/30 overflow-hidden"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Award className="w-6 h-6 text-[#1A1A1A]" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Text Content - Right */}
              <motion.div className="lg:col-span-7 order-1 lg:order-2 space-y-6" variants={fadeInUp}>
                <div className="mb-8">
                  <span className="inline-flex items-center gap-2 text-[#1A1A1A] text-sm uppercase tracking-[0.4em]">
                    <Award className="w-4 h-4" />
                    Founder
                  </span>
                  <GoldLine className="w-32 mt-4" />
                </div>
                
                <h2 
                  className="text-[#1A1A1A] text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                >
                  Jane Bou
                  <br />
                  <span className="text-[#1A1A1A]">Jaoude</span>
                </h2>
                
                <p className="text-[#1A1A1A]/70 text-lg mb-2">جاين بو جودة</p>
                
                <p className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em] mb-6 font-medium">
                  Founder & Chief Executive Officer
                </p>
                
                {/* Bio Card - Champagne Inner */}
                <div className="jj-card-inner border-2 border-[#B89555] rounded-xl p-6 space-y-4" data-surface="champagne">
                  <p className="text-lg md:text-xl font-light text-[#1A1A1A]">
                    Jane Bou Jaoude is the Founder and Chief Executive Officer of JBJ Global Real Estate, a Dubai mainland licensed real estate brokerage authorized to BUY, SELL, and RENT properties across the UAE.
                  </p>
                  <p className="text-base text-[#1A1A1A]/70">
                    As Founder & CEO, she oversees the company's strategic direction, regulatory compliance, operational governance, partner relationships, and market positioning. All brokerage activities, advisory frameworks, and platform standards operate under executive oversight to ensure professionalism, transparency, and client protection.
                  </p>
                </div>
                
                {/* Role Focus Cards */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6">
                  <div className="jj-card-inner border-2 border-[#B89555] rounded-xl p-3 md:p-4 text-center transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1" data-surface="champagne">
                    <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-[#B89555] bg-gradient-to-br from-champagne-light to-champagne" data-surface="champagne">
                      <Globe className="w-4 h-4 md:w-5 md:h-5 text-[#1A1A1A]" />
                    </div>
                    <p className="text-[#1A1A1A] text-[10px] md:text-xs font-medium">Strategic Leadership</p>
                  </div>
                  <div className="jj-card-inner border-2 border-[#B89555] rounded-xl p-3 md:p-4 text-center transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1" data-surface="champagne">
                    <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-[#B89555] bg-gradient-to-br from-champagne-light to-champagne" data-surface="champagne">
                      <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#1A1A1A]" />
                    </div>
                    <p className="text-[#1A1A1A] text-[10px] md:text-xs font-medium">Regulatory Alignment</p>
                  </div>
                  <div className="jj-card-inner border-2 border-[#B89555] rounded-xl p-3 md:p-4 text-center transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1" data-surface="champagne">
                    <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-[#B89555] bg-gradient-to-br from-champagne-light to-champagne" data-surface="champagne">
                      <Scale className="w-4 h-4 md:w-5 md:h-5 text-[#1A1A1A]" />
                    </div>
                    <p className="text-[#1A1A1A] text-[10px] md:text-xs font-medium">Internal Controls</p>
                  </div>
                  <div className="jj-card-inner border-2 border-[#B89555] rounded-xl p-3 md:p-4 text-center transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1" data-surface="champagne">
                    <div className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl flex items-center justify-center border-2 border-[#B89555] bg-gradient-to-br from-champagne-light to-champagne" data-surface="champagne">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-[#1A1A1A]" />
                    </div>
                    <p className="text-[#1A1A1A] text-[10px] md:text-xs font-medium">Partner Coordination</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: EXECUTIVE LEADERSHIP - 3-Layer System */}
      <CreamDivider />
      <section className="py-10 md:py-14 bg-[#FDFBF7] relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg" data-surface="champagne">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.4em] drop-shadow-sm">Structure</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-[#1A1A1A] text-4xl md:text-5xl lg:text-6xl font-bold"
                >
                  Executive <span className="text-[#1A1A1A]">Leadership</span>
                </h2>
                <p className="text-[#1A1A1A]/70 text-lg mt-6 max-w-3xl mx-auto">
                  The executive leadership team supports the operational, advisory, and administrative functions of JBJ Global Real Estate under centralized governance.
                </p>
              </motion.div>

              {/* Leadership Cards Grid */}
              <motion.div 
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                variants={staggerContainer}
              >
                {executiveTeam.map((member, index) => (
                  <motion.div 
                    key={index}
                    className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl p-6 md:p-8 hover:border-[#B89555] transition-all duration-500 text-center shadow-sm"
                    data-surface="champagne"
                    variants={fadeInUp}
                  >
                    <IconTile icon={member.icon} tone="ink" size="lg" className="mx-auto mb-6" />

                    <h4 className="text-[#1A1A1A] text-lg font-semibold mb-1">
                      {member.name}
                    </h4>
                    {member.nameAr && (
                      <p className="text-[#1A1A1A]/70 text-sm mb-2">{member.nameAr}</p>
                    )}
                    <p className="text-[#1A1A1A] text-xs uppercase tracking-wider mb-4">
                      {member.role}
                    </p>
                    <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">
                      {member.responsibility}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: GOVERNANCE & OVERSIGHT - 3-Layer System */}
      <CreamDivider />
      <section className="py-10 md:py-14 bg-[#FDFBF7] relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg" data-surface="champagne">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.4em] drop-shadow-sm">Framework</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-[#1A1A1A] text-4xl md:text-5xl lg:text-6xl font-bold"
                >
                  Governance & <span className="text-[#1A1A1A]">Accountability</span>
                </h2>
              </motion.div>

              <motion.div 
                className="max-w-4xl mx-auto"
                variants={fadeInUp}
              >
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl p-6 md:p-10 shadow-sm" data-surface="champagne">
                  <p className="text-lg mb-6 text-[#1A1A1A]">
                    JBJ Global Real Estate operates with a centralized governance structure designed to ensure:
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <IconTile icon={FileCheck} tone="ink" size="sm" />
                      <p className="text-[#1A1A1A]/70">Clear decision-making authority</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconTile icon={Shield} tone="ink" size="sm" />
                      <p className="text-[#1A1A1A]/70">Compliance with UAE real estate regulations</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconTile icon={Scale} tone="ink" size="sm" />
                      <p className="text-[#1A1A1A]/70">Controlled advisory and brokerage processes</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <IconTile icon={Users} tone="ink" size="sm" />
                      <p className="text-[#1A1A1A]/70">Transparent internal accountability</p>
                    </div>
                  </div>
                  
                  <p className="text-[#1A1A1A]/70 border-t border-[#B89555]/20 pt-6">
                    Executive oversight applies to brokerage operations, platform tools, client engagement workflows, and partner introductions.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 4: REGULATORY POSITIONING - 3-Layer System */}
      <CreamDivider />
      <section className="py-10 md:py-14 bg-[#FDFBF7] relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg" data-surface="champagne">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.4em] drop-shadow-sm">Licensing</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-[#1A1A1A] text-4xl md:text-5xl lg:text-6xl font-bold"
                >
                  Regulatory <span className="text-[#1A1A1A]">Standing</span>
                </h2>
              </motion.div>

              <motion.div 
                className="max-w-4xl mx-auto"
                variants={fadeInUp}
              >
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl p-6 md:p-10 shadow-sm space-y-6" data-surface="champagne">
                  <div className="flex items-center gap-4 pb-6 border-b border-[#B89555]/20">
                    <IconTile icon={Building2} tone="ink" size="lg" />

                    <div>
                      <p className="text-[#1A1A1A] text-xl font-semibold">Dubai Mainland Licensed</p>
                      <p className="text-[#1A1A1A] text-sm uppercase tracking-wider">Real Estate Brokerage</p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-[#1A1A1A]">
                    JBJ Global Real Estate is a Dubai mainland licensed real estate brokerage authorized to conduct BUY, SELL, and RENT activities.
                  </p>
                  
                  <p className="text-[#1A1A1A]/70">
                    Legal, mortgage, visa, and other regulated services are provided through independent licensed partners. JBJ Global Real Estate facilitates introductions only and does not provide regulated services outside its brokerage license.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CLOSING STATEMENT & CTA - 3-Layer System */}
      <CreamDivider />
      <section className="py-10 md:py-14 bg-[#FDFBF7] relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="max-w-[1100px] mx-auto">
            {/* OUTER CARD - Active Champagne Layer */}
            <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              {/* INNER CARD - Champagne Layer */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                data-surface="champagne"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                {/* Badge */}
                <motion.div variants={fadeInUp} className="mb-4 sm:mb-6">
                  <SectionEyebrow icon={Sparkles}>Leadership Commitment</SectionEyebrow>
                </motion.div>
                
                <motion.p 
                  className="text-[#1A1A1A]/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed"
                  variants={fadeInUp}
                >
                  Leadership at JBJ Global Real Estate is structured to support long-term stability, professional standards, and informed client decision-making across all brokerage activities.
                </motion.p>

                <motion.div 
                  className="flex flex-wrap justify-center gap-3 sm:gap-4"
                  variants={fadeInUp}
                >
                  {/* Primary Button - Contact */}
                  <Link 
                    to="/contact"
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #B89555 100%)',
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
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Contact Our</span>
                      <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Team</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors relative z-10" />
                  </Link>

                  {/* Secondary Button - Services */}
                  <Link 
                    to="/services"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                  >
                    View Our Services
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Founder;
