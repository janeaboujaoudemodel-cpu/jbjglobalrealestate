import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Gem, Film, Mail, Phone, ExternalLink, Award, Globe, Users, TrendingUp, Star, MessageCircle, Calendar, MapPin, Mic, Video, Newspaper, BookOpen, Download } from "lucide-react";
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
      year: "2014",
      title: "Janine's Beauty — Early Business Chapter",
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
      title: "Founded JJ Global Capital",
      description: "Founded JJ Global Capital as a Dubai-based real estate brokerage.",
      location: "Dubai, UAE"
    },
  ];

  // Note: Speaking engagements and media appearances are only added once verified

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
            alt="Jane Abou Jaoude - Founder & CEO"
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
                Founder & CEO
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
                Founder & CEO • JJ Global Capital
              </p>
              <p className="text-zinc-400 text-sm md:text-base mb-8">
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
                    alt="Jane Abou Jaoude - Founder & CEO" 
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
                Founder · JJ Global Capital
              </p>
              
              <div className="space-y-6 text-zinc-300 leading-relaxed max-w-2xl">
                <p className="text-xl md:text-2xl font-light text-white/90">
                  Born August 25, 1998, in Lebanon. Fluent in French and Arabic, with self-taught English and Spanish. Active on social media since 2012 with 1M+ followers across platforms.
                </p>
                <p className="text-lg">
                  At 16, Jane launched Janine's Beauty (beauty services) and began selling products via importing and shipping from China. With 12+ years of sales, customer experience, and business development expertise, she relocated to Dubai in 2020 to pursue real estate.
                </p>
                <p className="text-lg text-zinc-400">
                  Her career includes working with DAMAC in 2021, leading quality and operations at Al-Ghazal Transportation Company (495+ team), and developing brokerage business divisions from 2022–2024. In 2025, she founded JJ Global Capital as a Dubai-based real estate brokerage.
                </p>
              </div>
              
              {/* Accolades row - All 3 on same line */}
              <div className="mt-12 grid grid-cols-3 gap-4 md:gap-6">
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
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DETAILED BIOGRAPHY */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-black via-zinc-950/30 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Biography</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                The Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Story</span>
              </h2>
            </motion.div>

            <motion.div 
              className="max-w-4xl mx-auto space-y-8 text-zinc-300 leading-relaxed"
              variants={fadeInUp}
            >
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  Origins & Early Entrepreneurship
                </h3>
                <p className="text-lg mb-4">
                  Jane Abou Jaoude was born on August 25, 1998, in Lebanon. Fluent in French and Arabic from childhood, she later taught herself English and Spanish—developing a global perspective from an early age.
                </p>
                <p className="text-lg mb-4 text-zinc-400">
                  At 16, Jane launched Janine's Beauty in 2014, offering beauty services while also selling products via importing and shipping from China. Active on social media since 2012, she built a following that now exceeds 1M+ across platforms.
                </p>
                <p className="text-lg text-zinc-400">
                  With 12+ years of experience in sales, customer experience, and business development, these early ventures taught her the fundamentals of service excellence and client relationships.
                </p>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  The Dubai Chapter
                </h3>
                <p className="text-lg mb-4">
                  In 2020, Jane relocated to Dubai and began building her career and network in the UAE. She started her real estate career with DAMAC in 2021, gaining valuable exposure to the Dubai property market.
                </p>
                <p className="text-lg mb-4 text-zinc-400">
                  From 2021–2022, she served as Head of Quality & Operations at Al-Ghazal Transportation Company, a luxury B2B transportation and hospitality services provider. Managing teams of 495+ employees, she trained coordinators and drivers while implementing service standards and KPIs.
                </p>
                <p className="text-lg text-zinc-400">
                  This corporate leadership experience provided invaluable insights into operations management, team building, and institutional standards—skills that would later define JJ Global Capital's approach to excellence.
                </p>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Brokerage Training & Development
                </h3>
                <p className="text-lg mb-4">
                  From 2022–2024, Jane worked with a brokerage company to develop the business across divisions including marketing, projects, sales, objection handling, and training brokers and teams. She has trained 2,800+ brokers through her intensive programs.
                </p>
                <p className="text-lg mb-4 text-zinc-400">
                  In 2025–2026, she worked with Sobha Realty, supporting real estate growth through structured sales and client experience systems.
                </p>
                <p className="text-lg text-zinc-400">
                  In 2025, Jane founded JJ Global Capital as a Dubai-based real estate brokerage specializing in property sales, leasing, and holiday homes across the UAE.
                </p>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <Award className="w-6 h-6" />
                  Leadership Philosophy
                </h3>
                <p className="text-lg mb-4">
                  Jane's approach to business emphasizes quality over quantity, discretion over publicity, and long-term value over short-term gains.
                </p>
                <p className="text-lg text-zinc-400">
                  Her leadership philosophy has become a model for founder-led enterprises in the region. Today, JJ Global Capital 
                  serves UAE-based and international clients seeking premium property solutions in the Emirates.
                </p>
              </div>
            </motion.div>
          </motion.div>
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
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Founder</h4>
                  <p className="text-zinc-400 text-sm">JJ Global Capital, Dubai</p>
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
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2021-2024</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Head of Quality & Operations</h4>
                  <p className="text-zinc-400 text-sm">Luxury Transportation, Dubai Airport</p>
                </div>
              </motion.div>

              {/* Photo 3 - Industry Event */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderAwardStage} 
                  fallbackSrc={founderHero}
                  alt="Jane Abou Jaoude - Industry Event" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">Events</span>
                  <h4 className="text-white text-lg font-semibold mb-1">Industry Event</h4>
                  <p className="text-zinc-400 text-sm">Networking in real estate</p>
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
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
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

              {/* Photo 6 - JJ Flags */}
              <motion.div 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-800 hover:border-gold/40 transition-all duration-500"
                variants={scaleIn}
              >
                <SafeImage 
                  src={jjFlags} 
                  fallbackSrc={founderHero}
                  alt="JJ Global Capital" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-[0.2em] mb-2 block">2014 → 2025</span>
                  <h4 className="text-white text-lg font-semibold mb-1">The Journey Complete</h4>
                  <p className="text-zinc-400 text-sm">From James Beauty to JJ Global Capital</p>
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
                  <p className="text-gold text-3xl font-bold mb-1">2014</p>
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
                  <p className="text-zinc-500 text-sm">JJ Global Capital</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CAREER TIMELINE */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Journey</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Timeline</span>
              </h2>
            </motion.div>

            <div className="max-w-4xl mx-auto relative">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/50 via-gold/30 to-gold/50" />
              
              {careerTimeline.map((item, index) => (
                <motion.div
                  key={item.year}
                  className={`relative flex items-start gap-8 mb-12 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                  variants={fadeInUp}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-gold rounded-full border-4 border-black shadow-lg shadow-gold/30 z-10" />
                  
                  {/* Year badge - mobile */}
                  <div className="md:hidden pl-16 flex items-center gap-4 mb-4">
                    <span className="text-gold font-bold text-xl">{item.year}</span>
                  </div>
                  
                  {/* Content card */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'} pl-16 md:pl-0`}>
                    <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-6 hover:border-gold/30 transition-colors">
                      <span className="hidden md:inline-block text-gold font-bold text-xl mb-2">{item.year}</span>
                      <h4 className="text-white text-lg font-semibold mb-2">{item.title}</h4>
                      <p className="text-zinc-400 text-sm mb-3">{item.description}</p>
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
      </section>

      {/* PRESS KIT CTA - Simple verified link */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center"
          >
            <span className="text-gold text-sm uppercase tracking-[0.4em] mb-6 block">Media Resources</span>
            <GoldLine className="w-32 mx-auto mb-8" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Press <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Kit</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Download official photos, logos, and brand assets for media use
            </p>
            <Link
              to="/press-kit"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30"
            >
              <Download className="w-5 h-5" />
              Download Press Kit
            </Link>
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
              <p className="text-gold/70 text-xs uppercase tracking-[0.15em]">
                & Visionary Woman
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOUNDER STATS - Highlights */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 relative overflow-hidden">
        {/* Premium pattern background */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #A8925A 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        </div>
        
        {/* Gold gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="text-gold text-sm uppercase tracking-[0.4em]">Track Record</span>
            <GoldLine className="w-32 mx-auto mt-4 mb-8" />
            <h2 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Highlights</span>
            </h2>
          </motion.div>

          {/* Stats - 4 Chips */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { label: "Active since 2012", icon: Calendar },
                { label: "1M+ Followers (All Platforms)", icon: Users },
                { label: "2,800+ Brokers Trained", icon: Award },
                { label: "495+ Team Managed (Operations)", icon: Building2 },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black border border-zinc-800 rounded-3xl p-8 md:p-10 hover:border-gold/40 transition-all duration-500 group relative overflow-hidden text-center"
                  variants={fadeInUp}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/20 group-hover:border-gold/50 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-gold/5">
                      <stat.icon className="w-6 h-6 text-gold" />
                    </div>
                    <p className="text-white text-sm md:text-base font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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
                    <p className="text-zinc-300 text-sm uppercase tracking-[0.25em] font-medium">Founder & CEO</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-white text-base font-semibold tracking-wide">JJ Global Capital</p>
                      <p className="text-zinc-400 text-xs">Real Estate Brokerage | Dubai, UAE</p>
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
            {/* Industry event photo - Full height premium display */}
            <motion.div 
              className="aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 group relative"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderAwardStage} 
                fallbackSrc={founderHero}
                alt="Jane Abou Jaoude - Industry Event"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
              />
              {/* Premium overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Gold corner accents */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gold/50 rounded-tl-xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gold/50 rounded-br-xl" />
            </motion.div>
            
            {/* Red carpet photo - Full height premium display */}
            <motion.div 
              className="aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 group relative"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderRedCarpet} 
                fallbackSrc={founderHero}
                alt="Jane Abou Jaoude - Red Carpet Event" 
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
              For daily requests, partnership discussions, collaboration, or investment inquiries, we welcome your correspondence.
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
                Partnership <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:collaboration@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Collaboration <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Careers <ArrowUpRight className="w-5 h-5" />
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
                href={`mailto:${CONTACT_INFO.privacyEmail}`} 
                className="hover:text-gold transition-colors flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center group-hover:border-gold/50 group-hover:scale-110 transition-all">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <span className="text-zinc-300">{CONTACT_INFO.privacyEmail}</span>
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


      <Footer />
    </div>
  );
};

export default Founder;
