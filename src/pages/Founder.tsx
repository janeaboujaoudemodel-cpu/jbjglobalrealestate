import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Gem, Film, Mail, Phone, ExternalLink, Award, Globe, Users, TrendingUp, Star, MessageCircle, Calendar, MapPin, Mic, Video, Newspaper, BookOpen, Download, GraduationCap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { SafeImage } from "@/components/SafeImage";
import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS, CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

// Import all founder images
import founderHero from "@/assets/founder-hero.png";
import founderDark from "@/assets/founder-dark.png";
// jjFlags removed - old company branding
import founderOffice from "@/assets/founder-office.jpeg";
import founderJetBoarding from "@/assets/founder-jet-boarding.jpeg";
import founderJetInterior from "@/assets/founder-jet-interior.jpeg";
import founderProfessional from "@/assets/founder-professional.jpeg";
import founderYacht from "@/assets/founder-yacht.jpeg";
// founderAwardStage removed - image deleted per founder request
import founderRedCarpet from "@/assets/founder-red-carpet.jpeg";
import founderPremium from "@/assets/founder-premium.png";

// Import CEO awards and leadership photos
import ceoGcaAward from "@/assets/ceo/ceo-gca-award-2025.jpg";
import ceoBusinessPortrait from "@/assets/ceo/ceo-business-portrait.jpg";
import ceoLuxuryLifestyle from "@/assets/ceo/ceo-luxury-lifestyle.jpg";
import ceoLeadershipAward from "@/assets/ceo/ceo-leadership-award.jpg";
import ceoAwardTrophy from "@/assets/ceo/ceo-award-trophy.jpg";
import ceoPanelSpeaking from "@/assets/ceo/ceo-panel-speaking.jpg";
import ceoPanelDiscussion from "@/assets/ceo/ceo-panel-discussion.jpg";
import ceoMediaInterview from "@/assets/ceo/ceo-media-interview.jpg";
import ceoAwardCeremony from "@/assets/ceo/ceo-award-ceremony.jpg";
import ceoBackdropFlags from "@/assets/jane-ceo-executive-office-final-v9.jpg";
import ceoHeroOfficeFlags from "@/assets/ceo-hero-office-flags.jpg";

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

  // Career Timeline
  const careerTimeline = [
    {
      year: "2015",
      title: "Jane's Beauty — First Business (Age 16)",
      description: "Beauty services and early product selling via importing and shipping.",
      location: "Lebanon"
    },
    {
      year: "2020",
      title: "Relocated to Dubai",
      description: "Began building career and network in the UAE.",
      location: "Dubai, UAE"
    },
    {
      year: "2021",
      title: "Real Estate (Dubai)",
      description: "Worked with DAMAC and expanded UAE market exposure.",
      location: "Dubai, UAE"
    },
    {
      year: "2021–2022",
      title: "Head of Quality & Operations",
      description: "Al-Ghazal Transportation Company — led service standards, team training, and operations (495+).",
      location: "Dubai, UAE"
    },
    {
      year: "2022–2024",
      title: "Brokerage Training & Business Development",
      description: "Trained brokers and supported brokerage teams across marketing, projects, sales, and objection handling.",
      location: "Dubai, UAE"
    },
    {
      year: "2025",
      title: "Sobha Realty (Dubai)",
      description: "Supported real estate growth through structured sales and client experience systems.",
      location: "Dubai, UAE"
    },
    {
      year: "2025",
      title: "Founded JBJ Global Real Estate",
      description: "Founded JBJ Global Real Estate as a Dubai-based real estate brokerage.",
      location: "Dubai, UAE"
    },
  ];

  // Note: Speaking engagements and media appearances are only added once verified

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
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
          {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
              object-fit: cover + center 15% = max zoom, crop from bottom only
              Preserves head & shoulders, crops suit area */}
          <SafeImage 
            src={ceoHeroOfficeFlags} 
            fallbackSrc={founderHero}
            alt="Jane Abou Jaoude - Founder & CEO"
            className="w-full h-full bg-zinc-950"
            style={{ objectFit: "cover", objectPosition: "center 15%" }}
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
        
        {/* Hero Content - pushed down to show more of the flags */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
          <motion.div 
            className="max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="mb-4" variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-gold/40 text-gold text-xs uppercase tracking-[0.3em] px-5 py-2.5 rounded-full shadow-lg shadow-gold/10">
                <Star className="w-3.5 h-3.5 fill-gold" />
                Founder & CEO
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-4"
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
              <p className="text-white text-lg md:text-xl lg:text-2xl mb-1 font-semibold tracking-wide">
                Founder & CEO • JBJ Global Real Estate
              </p>
              <p className="text-zinc-400 text-sm md:text-base mb-6">
                Real Estate Brokerage • Dubai, UAE
              </p>
            </motion.div>
            
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl italic max-w-xl border-l-4 border-gold/60 pl-6 py-2"
              variants={fadeInUp}
            >
              "Standards first. Discreet execution. Long-term trust."
            </motion.p>
          </motion.div>
        </div>
        
        {/* Scroll indicator moved below the hero (between sections) */}
      </section>

      {/* HERO / FOUNDER DIVIDER (Discover) */}
      <section className="relative bg-black py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <span className="text-xs uppercase tracking-[0.3em]">Discover</span>
            <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent" />
          </div>
        </div>
      </section>

      {/* THE FOUNDER - PREMIUM EDITORIAL LAYOUT */}
      <section className="pt-24 md:pt-32 pb-24 md:pb-40 relative overflow-hidden">
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
                {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                    object-fit: cover + center 15% = max zoom, crop from bottom */}
                <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 bg-zinc-950">
                  <SafeImage 
                    src={founderPremium} 
                    fallbackSrc={founderProfessional}
                    alt="Jane Abou Jaoude, Founder & CEO of JBJ GLOBAL REAL ESTATE" 
                    className="w-full h-full"
                    style={{ objectFit: "cover", objectPosition: "center 15%" }}
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
                Dubai-Based Real Estate Brokerage
              </p>
              
              <div className="space-y-6 text-zinc-300 leading-relaxed max-w-2xl">
                <p className="text-xl md:text-2xl font-light text-white/90">
                  Born August 25, 1998, in Lebanon. Fluent in French and Arabic, with self-taught English and Spanish. Active on social media since 2012 with 1M+ followers across platforms.
                </p>
                <p className="text-lg">
                  At 16, Jane launched Jane's Beauty (beauty services) and began selling products via importing and shipping from China. With 12+ years of industry experience in sales, customer experience, and business development, she relocated to Dubai in 2020 to pursue real estate.
                </p>
                <p className="text-lg text-zinc-400">
                  Her career includes working with DAMAC in 2021, leading quality and operations at Al-Ghazal Transportation Company (495+ team), and developing brokerage business divisions from 2022–2024. In 2025, she worked with Sobha Realty before founding JBJ Global Real Estate — a Dubai-based real estate brokerage for property sales and rentals.
                </p>
              </div>
              
              {/* Accolades row - All 4 with consistent spacing */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <Globe className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">4 Languages</p>
                    <p className="text-zinc-500 text-xs">FR · EN · AR · ES</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">2,800+ Trained</p>
                    <p className="text-zinc-500 text-xs">Brokers Mentored</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">495+ Managed</p>
                    <p className="text-zinc-500 text-xs">Operations Team</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 flex-shrink-0">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">12+ Years</p>
                    <p className="text-zinc-500 text-xs">Industry Experience</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DETAILED BIOGRAPHY - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-gold text-sm uppercase tracking-[0.4em] drop-shadow-sm">Biography</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  The Full <span className="text-gold">Story</span>
                </h2>
              </motion.div>

              <motion.div 
                className="max-w-4xl mx-auto space-y-6"
                variants={fadeInUp}
              >
                {/* Champagne Inner Cards */}
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-sm">
                  <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                    <BookOpen className="w-6 h-6" />
                    Origins & Early Entrepreneurship
                  </h3>
                  <p className="text-lg mb-4 text-black">
                    Jane Abou Jaoude was born on August 25, 1998, in Lebanon. Fluent in French and Arabic from childhood, she later taught herself English and Spanish—developing a global perspective from an early age.
                  </p>
                  <p className="text-lg mb-4 text-zinc-600">
                    At 16, Jane launched Jane's Beauty in 2015, offering beauty services while also selling products via importing and shipping from China. Active on social media since 2012, she built a following that now exceeds 1M+ across platforms.
                  </p>
                  <p className="text-lg text-zinc-600">
                    With 12+ years of experience in sales, customer experience, and business development, these early ventures taught her the fundamentals of service excellence and client relationships.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-sm">
                  <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                    <TrendingUp className="w-6 h-6" />
                    The Dubai Chapter
                  </h3>
                  <p className="text-lg mb-4 text-black">
                    In 2020, Jane relocated to Dubai and began building her career and network in the UAE. She started her real estate career with DAMAC in 2021, gaining valuable exposure to the Dubai property market.
                  </p>
                  <p className="text-lg mb-4 text-zinc-600">
                    From 2021–2022, she served as Head of Quality & Operations at Al-Ghazal Transportation Company, a luxury B2B transportation and hospitality services provider. Managing teams of 495+ employees, she trained coordinators and drivers while implementing service standards and KPIs.
                  </p>
                  <p className="text-lg text-zinc-600">
                    This corporate leadership experience provided invaluable insights into operations management, team building, and institutional standards—skills that would later define JBJ Global Real Estate's approach to excellence.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-sm">
                  <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    Brokerage Training & Development
                  </h3>
                  <p className="text-lg mb-4 text-black">
                    From 2022–2024, Jane worked with a brokerage company to develop the business across divisions including marketing, projects, sales, objection handling, and training brokers and teams. She has trained 2,800+ brokers through her intensive programs.
                  </p>
                  <p className="text-lg mb-4 text-zinc-600">
                    In 2025–2026, she worked with Sobha Realty, supporting real estate growth through structured sales and client experience systems.
                  </p>
                  <p className="text-lg text-zinc-600">
                    In 2025, Jane founded JBJ Global Real Estate — a Dubai-based real estate brokerage specializing in property sales and rental services across the UAE.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-sm">
                  <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                    <Award className="w-6 h-6" />
                    Leadership Philosophy
                  </h3>
                  <p className="text-lg mb-4 text-black">
                    Jane's approach to business emphasizes quality over quantity, discretion over publicity, and long-term value over short-term gains.
                  </p>
                  <p className="text-lg text-zinc-600">
                    Her leadership philosophy has become a model for founder-led enterprises in the region. Today, JBJ Global Real Estate 
                    serves UAE-based and international clients seeking premium property solutions in the Emirates.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AWARDS & RECOGNITION - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-gold text-sm uppercase tracking-[0.4em] drop-shadow-sm">Recognition</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Awards & <span className="text-gold">Achievements</span>
                </h2>
                <p className="text-zinc-600 text-lg mt-6 max-w-2xl mx-auto">
                  Recognized globally for excellence in leadership and innovation
                </p>
              </motion.div>

            {/* Awards Grid - Pearl Inner Cards */}
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
            >
              {/* GCA Award 2025 */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold transition-all duration-500 shadow-sm"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoGcaAward} 
                  fallbackSrc={founderHero}
                  alt="Global Cinema Award 2025" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Global Cinema Award (GCA)</h4>
                  <p className="text-zinc-300 text-sm">Excellence in Innovation</p>
                </div>
              </motion.div>

              {/* International India Awards */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoAwardTrophy} 
                  fallbackSrc={founderHero}
                  alt="International India Awards 2025" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">International India Awards (III-A)</h4>
                  <p className="text-zinc-400 text-sm">Leadership Excellence</p>
                </div>
              </motion.div>

              {/* Business Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoBusinessPortrait} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Business Portrait" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Executive Leadership</h4>
                  <p className="text-zinc-400 text-sm">Founder & CEO</p>
                </div>
              </motion.div>

              {/* Panel Speaking */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoPanelSpeaking} 
                  fallbackSrc={founderHero}
                  alt="Global Summit Panel Discussion" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Speaking</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Global Summit Panel</h4>
                  <p className="text-zinc-400 text-sm">Industry Discussion Panelist</p>
                </div>
              </motion.div>

              {/* Business Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoBusinessPortrait} 
                  fallbackSrc={founderHero}
                  alt="Business Leadership Summit" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Leadership</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Business Leadership Summit</h4>
                  <p className="text-zinc-400 text-sm">Executive Speaker</p>
                </div>
              </motion.div>

              {/* Media Interview */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoMediaInterview} 
                  fallbackSrc={founderHero}
                  alt="Media Interview" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Media</span>
                  <h4 className="text-white text-lg font-semibold mb-1">NewsTime HDTV Interview</h4>
                  <p className="text-zinc-400 text-sm">Industry Insights</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Additional Photos Row */}
            <motion.div 
              className="grid md:grid-cols-3 gap-6 mt-6"
              variants={staggerContainer}
            >
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoPanelDiscussion} 
                  fallbackSrc={founderHero}
                  alt="Panel Discussion" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Discussion</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Industry Panel Discussion</h4>
                  <p className="text-zinc-400 text-sm">Real Estate Innovation Forum</p>
                </div>
              </motion.div>

              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoLuxuryLifestyle} 
                  fallbackSrc={founderHero}
                  alt="Luxury Lifestyle" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Visionary</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Luxury Real Estate Leader</h4>
                  <p className="text-zinc-400 text-sm">Founder & CEO</p>
                </div>
              </motion.div>

              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoAwardCeremony} 
                  fallbackSrc={founderHero}
                  alt="Award Ceremony" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Awards</span>
                  <h4 className="text-white text-lg font-semibold mb-1">International Business Awards</h4>
                  <p className="text-zinc-400 text-sm">Global Recognition</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* JOURNEY PHOTO GALLERY */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Visual Journey</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                From Lebanon <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">to Dubai</span>
              </h2>
              <p className="text-zinc-400 text-lg mt-6 max-w-2xl mx-auto">
                A visual chronicle of entrepreneurship, leadership, and the pursuit of excellence
              </p>
            </motion.div>

            {/* Photo Grid */}
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              {/* Photo 1 - Professional Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderProfessional} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Professional Portrait" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                  style={{ objectFit: "cover", objectPosition: "center 15%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Founder</h4>
                  <p className="text-zinc-400 text-sm">JBJ Global Real Estate, Dubai</p>
                </div>
              </motion.div>

              {/* Photo 2 - Office/Business */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderOffice} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Executive" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                  style={{ objectFit: "cover", objectPosition: "center 15%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2021-2024</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Head of Quality & Operations</h4>
                  <p className="text-zinc-400 text-sm">Luxury Transportation, Dubai Airport</p>
                </div>
              </motion.div>

              {/* Photo 3 - Office Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderOffice} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Executive Office" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                  style={{ objectFit: "cover", objectPosition: "center 15%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Leadership</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Executive Office</h4>
                  <p className="text-zinc-400 text-sm">Downtown Dubai Headquarters</p>
                </div>
              </motion.div>

              {/* Photo 4 - Premium Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderPremium} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Premium Portrait" 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                  style={{ objectFit: "cover", objectPosition: "center 15%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2020</span>
                  <h4 className="text-white text-lg font-semibold mb-1">New Beginnings</h4>
                  <p className="text-zinc-400 text-sm">Relocating to Dubai during COVID</p>
                </div>
              </motion.div>

              {/* Photo 5 - Red Carpet/Event */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderRedCarpet} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Event" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Events</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Industry Networking</h4>
                  <p className="text-zinc-400 text-sm">Building connections in luxury real estate</p>
                </div>
              </motion.div>

              {/* Photo 6 - Executive Portrait */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={ceoBusinessPortrait} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Executive" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2015 → 2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">The Journey Complete</h4>
                  <p className="text-zinc-400 text-sm">From Jane's Beauty to JBJ Global Real Estate</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Journey Summary */}
            <motion.div 
              className="mt-16 text-center max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-center">
                  <p className="text-gold text-3xl font-bold mb-1">2015</p>
                  <p className="text-zinc-500 text-sm">First Business</p>
                </div>
                <div className="hidden md:block w-16 h-px bg-gradient-to-r from-gold/50 to-gold/20" />
                <div className="text-center">
                  <p className="text-gold text-3xl font-bold mb-1">2020</p>
                  <p className="text-zinc-500 text-sm">Dubai Relocation</p>
                </div>
                <div className="hidden md:block w-16 h-px bg-gradient-to-r from-gold/20 to-gold/50" />
                <div className="text-center">
                  <p className="text-gold text-3xl font-bold mb-1">2025</p>
                  <p className="text-zinc-500 text-sm">JBJ Global Real Estate</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CAREER TIMELINE - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div className="text-center mb-12" variants={fadeInUp}>
                <span className="text-gold text-sm uppercase tracking-[0.4em] drop-shadow-sm">Journey</span>
                <div className="w-32 mx-auto mt-4 mb-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <h2 
                  className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Career <span className="text-gold">Timeline</span>
                </h2>
              </motion.div>

              <div className="max-w-4xl mx-auto relative">
                {/* Timeline line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/70 via-gold/50 to-gold/70" />
                
                {careerTimeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    className={`relative flex items-start gap-8 mb-8 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                    variants={fadeInUp}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-gold rounded-full border-4 border-white shadow-lg shadow-gold/30 z-10" />
                    
                    {/* Year badge - mobile */}
                    <div className="md:hidden pl-16 flex items-center gap-4 mb-4">
                      <span className="text-gold font-bold text-xl">{item.year}</span>
                    </div>
                    
                    {/* Content card - Champagne Style */}
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'} pl-16 md:pl-0`}>
                      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-5 hover:border-gold transition-colors shadow-sm">
                        <span className="hidden md:inline-block text-gold font-bold text-xl mb-2">{item.year}</span>
                        <h4 className="text-black text-lg font-semibold mb-2">{item.title}</h4>
                        <p className="text-zinc-600 text-sm mb-3">{item.description}</p>
                        <div className={`flex items-center gap-2 text-zinc-500 text-xs ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      </div>
                    </div>
                    
                    {/* Spacer for desktop alternating layout */}
                    <div className="hidden md:block flex-1" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRESS KIT REMOVED - No downloadable assets for public users */}

      {/* FOUNDER QUOTE - "AS PER JANE" - 3-Layer System */}
      <section className="py-16 md:py-24 bg-black relative">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-4 sm:p-6 shadow-lg">
            {/* Champagne Inner Card */}
            <motion.div 
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-8 md:p-12 shadow-sm max-w-4xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              {/* Elegant quote marks */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center border border-gold/40">
                  <span className="text-gold text-3xl font-serif leading-none">"</span>
                </div>
              </div>
              
              <blockquote 
                className="text-black text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-8 italic"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Excellence is not a destination—it is the standard by which every decision is measured. 
                We do not chase trends; we establish precedents.
              </blockquote>
              
              {/* Divider */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/50" />
                <Star className="w-4 h-4 text-gold fill-gold/50" />
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/50" />
              </div>
              
              {/* Attribution */}
              <div className="flex flex-col items-center gap-1">
                <p className="text-gold font-semibold text-base">
                  Jane Abou Jaoude
                </p>
                <p className="text-zinc-600 text-xs uppercase tracking-[0.15em]">
                  Founder & CEO
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOUNDER STATS - Highlights - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <span className="inline-block px-5 py-2 bg-black border border-gold/30 rounded-full text-xs uppercase tracking-[0.2em] font-semibold shadow-sm mb-4">
                <span className="text-gold">Track</span>
                <span className="text-white"> Record</span>
              </span>
              <GoldLine className="w-32 mx-auto mb-8" />
              <h2 
                className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-gold">Highlights</span>
              </h2>
            </motion.div>

            {/* Stats - 4 Cards */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-500 group text-center shadow-sm"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <Calendar className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-gold text-3xl md:text-4xl font-bold mb-1">12+</p>
                  <p className="text-black text-sm md:text-base font-medium">Years Experience</p>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-500 group text-center shadow-sm"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-gold text-3xl md:text-4xl font-bold mb-1">1M+</p>
                  <p className="text-black text-sm md:text-base font-medium">Followers</p>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-500 group text-center shadow-sm"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-gold text-3xl md:text-4xl font-bold mb-1">2,800+</p>
                  <p className="text-black text-sm md:text-base font-medium">Brokers Trained</p>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold transition-all duration-500 group text-center shadow-sm"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <Building2 className="w-6 h-6 text-gold" />
                  </div>
                  <p className="text-gold text-3xl md:text-4xl font-bold mb-1">495+</p>
                  <p className="text-black text-sm md:text-base font-medium">Team Managed</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VISION FOR THE FUTURE */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-black via-zinc-950/30 to-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Looking Ahead</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Vision for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Future</span>
              </h2>
            </motion.div>

            <motion.div 
              className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {/* Innovation Card */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 hover:border-gold/40 transition-all duration-500 group"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                  <Gem className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-white text-xl font-bold mb-4">Technology & Innovation</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Building the first global real estate platform of its kind with AI-powered tools, free resources, and cutting-edge technology to empower brokers, buyers, and sellers worldwide.
                </p>
              </motion.div>

              {/* Expansion Card */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 hover:border-gold/40 transition-all duration-500 group"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-white text-xl font-bold mb-4">Global Expansion</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Establishing JBJ Global Real Estate as a leading name across the Middle East, Europe, and beyond—while maintaining the founder-led standards and personalized service that define our brand.
                </p>
              </motion.div>

              {/* Training Card */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 hover:border-gold/40 transition-all duration-500 group"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-white text-xl font-bold mb-4">Broker Excellence</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Scaling our broker training programs to reach 10,000+ professionals, providing world-class education, tools, and mentorship to elevate the industry standard.
                </p>
              </motion.div>

              {/* Legacy Card */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 hover:border-gold/40 transition-all duration-500 group"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                  <Award className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-white text-xl font-bold mb-4">Building Legacy</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Creating an organization designed to endure for generations—built on values of accountability, discretion, and unwavering commitment to excellence.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LEADERSHIP PHILOSOPHY - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black relative">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Philosophy</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Leadership <span className="text-gold">Philosophy</span>
              </h2>
            </motion.div>

            {/* Pearl Cards Grid */}
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {philosophyItems.map((item, index) => (
                <motion.div 
                  key={item.title}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-8 hover:border-gold transition-all duration-500 text-center shadow-sm"
                  variants={fadeInUp}
                >
                  <div className="w-14 h-14 mx-auto mb-6 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h4 className="text-gold text-lg font-semibold uppercase tracking-wider mb-3">
                    {item.title}
                  </h4>
                  <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PULL-QUOTE BLOCK - WE CREATE | WE ELEVATE | WE LEAD - 3-Layer System */}
      <section className="py-20 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-4 sm:p-6 shadow-lg">
            {/* Champagne Inner Card */}
            <motion.div 
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-8 md:p-12 lg:p-16 shadow-sm max-w-5xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <div className="text-center">
                {/* Quote Icon */}
                <div className="w-16 h-16 mx-auto mb-8 bg-black rounded-xl flex items-center justify-center border border-gold/40 shadow-lg">
                  <span className="text-gold text-4xl font-serif leading-none">"</span>
                </div>
                
                {/* Quote Text */}
                <blockquote 
                  className="text-black text-2xl md:text-4xl lg:text-5xl font-light mb-10 leading-tight tracking-tight"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  We <span className="text-gold font-medium">Create</span> | We <span className="text-gold font-medium">Elevate</span> | We <span className="text-gold font-medium">Lead</span>
                </blockquote>
                
                {/* Elegant Divider */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="w-24 h-px bg-gradient-to-r from-transparent to-gold/50" />
                  <div className="w-2 h-2 bg-gold/60 rounded-full" />
                  <div className="w-24 h-px bg-gradient-to-l from-transparent to-gold/50" />
                </div>
                
                {/* Founder Attribution */}
                <div className="flex flex-col items-center gap-4">
                  {/* Avatar with gold ring */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-gold via-[#C4A962] to-gold shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                      <SafeImage 
                        src={founderProfessional} 
                        fallbackSrc={founderHero} 
                        alt="Jane Abou Jaoude" 
                        className="w-full h-full"
                        style={{ objectFit: "cover", objectPosition: "center 15%" }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gold text-xl md:text-2xl font-semibold tracking-wide mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>Jane Abou Jaoude</p>
                    <p className="text-zinc-600 text-sm uppercase tracking-[0.2em] font-medium">Founder & CEO</p>
                    <p className="text-black text-sm font-semibold tracking-wide mt-2">JBJ GLOBAL REAL ESTATE</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* LIFESTYLE GALLERY - 3-Layer System */}
      <section className="py-24 md:py-32 bg-black">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          {/* Active Champagne Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <span className="text-gold text-sm uppercase tracking-[0.4em]">International</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-black text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Global <span className="text-gold">Presence</span>
              </h2>
            </motion.div>
            
            {/* Pearl Cards Grid */}
            <motion.div 
              className="grid grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {/* Professional portrait */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-2 shadow-sm group"
                variants={scaleIn}
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <SafeImage 
                    src={founderProfessional} 
                    fallbackSrc={founderHero}
                    alt="Jane Abou Jaoude - Professional Portrait"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>
              
              {/* Red carpet photo */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-2 shadow-sm group"
                variants={scaleIn}
              >
                <div className="aspect-[3/4] rounded-lg overflow-hidden">
                  <SafeImage 
                    src={founderRedCarpet} 
                    fallbackSrc={founderHero}
                    alt="Jane Abou Jaoude - Red Carpet Event" 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - 3-Layer System: Black > Active Champagne > Pearl - Smaller 3rd layer */}
      <section className="py-16 sm:py-20 bg-black relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
          <div className="max-w-[1100px] mx-auto">
            {/* OUTER CARD - Active Champagne Layer - Larger padding */}
            <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              {/* INNER CARD - Champagne Layer - Smaller */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                {/* Badge */}
                <motion.div 
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full text-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 shadow-lg shadow-gold/20"
                  variants={fadeInUp}
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold" />
                  Get in Touch
                </motion.div>
                
                <motion.h2 
                  className="text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  variants={fadeInUp}
                >
                  Connect with <span className="text-gold">JBJ Global Real Estate</span>
                </motion.h2>
                
                <motion.p 
                  className="text-zinc-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-10"
                  variants={fadeInUp}
                >
                  For property inquiries, partnership discussions, collaboration, or career opportunities, we welcome your correspondence.
                </motion.p>

                <motion.div 
                  className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-10"
                  variants={fadeInUp}
                >
                  {/* Primary Button - Connect */}
                  <Link 
                    to="/contact"
                    className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
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
                      <span className="text-black group-hover:text-gold transition-colors">Connect</span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gold group-hover:text-black transition-colors relative z-10" />
                  </Link>

                  {/* Secondary Buttons */}
                  <a 
                    href="mailto:Contact@JBJ.ae"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                  >
                    Partnership <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a 
                    href="mailto:Contact@JBJ.ae"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                  >
                    Collaboration <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a 
                    href="mailto:Contact@JBJ.ae"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                  >
                    Careers <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </motion.div>

                {/* Contact Info */}
                <motion.div 
                  className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
                  variants={fadeInUp}
                >
                  <a 
                    href={getEmailUrl()} 
                    className="hover:text-gold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black border border-gold/40 rounded-full flex items-center justify-center group-hover:border-gold group-hover:scale-110 transition-all">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    </div>
                    <span className="text-zinc-700 text-sm sm:text-base">{CONTACT_INFO.emailCapitalized}</span>
                  </a>
                  <a 
                    href={getCallUrl()} 
                    className="hover:text-gold transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black border border-gold/40 rounded-full flex items-center justify-center group-hover:border-gold group-hover:scale-110 transition-all">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                    </div>
                    <span className="text-zinc-700 text-sm sm:text-base">{CONTACT_INFO.phone}</span>
                  </a>
                  <a 
                    href={getWhatsAppUrl()} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-600 transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black border border-green-500/40 rounded-full flex items-center justify-center group-hover:border-green-500 group-hover:scale-110 transition-all">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    </div>
                    <span className="text-zinc-700 text-sm sm:text-base">WhatsApp</span>
                  </a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default Founder;
