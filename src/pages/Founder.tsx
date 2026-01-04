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
      description: "The principal investment and advisory arm of the JJ Holding Group. Specializing in UAE real estate with a structured approach to wealth preservation and capital growth for discerning investors worldwide.",
      image: founderOffice,
      tagline: "Real Estate Investment",
      url: "https://jjglobalcapital.com"
    },
    {
      icon: Gem,
      name: "Maison Jane",
      description: "A private luxury lifestyle brand rooted in the founder's philosophy of refined living. Curating exclusive experiences in beauty, wellness, and personal services for select clientele.",
      image: founderJetInterior,
      tagline: "Luxury Lifestyle",
      url: "https://maisonjane.ae"
    },
    {
      icon: Film,
      name: "JJ Media Group",
      description: "The strategic communications and media division overseeing brand identity, digital presence, and influence architecture across the group's portfolio of ventures.",
      image: founderRedCarpet,
      tagline: "Media & Communications",
      url: "https://jjmediagroup.ae"
    },
    {
      icon: Award,
      name: "JJ Fashion House",
      description: "A creative atelier extending the founder's aesthetic vision into fashion and design. Developing exclusive collections and collaborations that reflect institutional taste and timeless elegance.",
      image: founderAwardStage,
      tagline: "Fashion & Design",
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
              <p className="text-zinc-300 text-xl md:text-2xl lg:text-3xl mb-8 font-light">
                JJ Holding Group
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

      {/* INTRODUCTION - FOUNDER POSITIONING */}
      <section className="py-24 md:py-40 border-t border-gold/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/50 to-black" />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-gold/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-gold/5 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="mb-10" variants={fadeInUp}>
              <span className="inline-block text-gold text-sm uppercase tracking-[0.4em] mb-4">Leadership</span>
              <GoldLine className="w-32 mx-auto" />
            </motion.div>
            
            <motion.p 
              className="text-white text-2xl md:text-4xl lg:text-5xl leading-relaxed mb-10 font-light"
              variants={fadeInUp}
            >
              JJ Holding Group is a <span className="text-gold font-medium">founder-led</span>, multi-division holding built on unwavering standards, discretion, and long-term vision.
            </motion.p>
            
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto"
              variants={fadeInUp}
            >
              Every entity within the group reflects a deliberate approach to business—where quality supersedes quantity, and reputation is earned through consistent excellence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* THE FOUNDER - EDITORIAL LAYOUT */}
      <section className="py-24 md:py-40 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Text Content */}
            <motion.div className="lg:col-span-5 lg:sticky lg:top-32" variants={fadeInUp}>
              <div className="mb-10">
                <span className="text-gold text-sm uppercase tracking-[0.4em]">The Founder</span>
                <GoldLine className="w-24 mt-4" />
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-10"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Jane Abou
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Jaoude</span>
              </h2>
              
              <div className="space-y-6 text-zinc-400 leading-relaxed">
                <p className="text-lg md:text-xl text-zinc-300">
                  Jane Abou Jaoude serves as Founder and Chairwoman of JJ Holding Group. Her leadership is characterized by a composed, deliberate approach—where decisions are made with long-term positioning in mind.
                </p>
                <p className="text-base md:text-lg">
                  With experience spanning business advisory, media, and luxury sectors, she has built a group of companies that reflect her standards: institutional in governance, refined in execution, and international in scope.
                </p>
                <p className="text-base md:text-lg">
                  Based in Dubai, UAE, Jane leads with a philosophy rooted in accountability and discretion. Her approach prioritizes substance over visibility, building organizations designed to endure rather than simply expand.
                </p>
              </div>
              
              <div className="mt-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold to-[#C4A962] rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-white font-medium">Award-Winning Leadership</p>
                  <p className="text-zinc-500 text-sm">Recognized Excellence</p>
                </div>
              </div>
            </motion.div>
            
            {/* Photo Gallery */}
            <motion.div className="lg:col-span-7" variants={fadeInUp}>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Main large photo - smart crop from top */}
                <motion.div 
                  className="col-span-2 aspect-[16/10] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80 group"
                  variants={scaleIn}
                >
                  <SafeImage 
                    src={founderProfessional} 
                    fallbackSrc={founderHero}
                    alt="Jane Abou Jaoude - Professional Portrait" 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                  />
                </motion.div>
                
                {/* Two smaller photos - smart crop from top */}
                <motion.div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl group"
                  variants={scaleIn}
                >
                  <SafeImage 
                    src={founderJetBoarding} 
                    fallbackSrc={founderHero}
                    alt="Jane Abou Jaoude - International Travel" 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                  />
                </motion.div>
                <motion.div 
                  className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl group"
                  variants={scaleIn}
                >
                  <SafeImage 
                    src={founderOffice} 
                    fallbackSrc={founderHero}
                    alt="Jane Abou Jaoude - Office" 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                  />
                </motion.div>
              </div>
            </motion.div>
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
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-10"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                JJ Holding
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Group</span>
              </h2>
              
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-6">
                JJ Holding Group serves as the strategic umbrella for all entities under the founder's direction. Established to create a cohesive structure for ventures across distinct but complementary sectors.
              </p>
              <p className="text-zinc-500 leading-relaxed">
                The group's governance remains founder-led, ensuring that strategic decisions align with the long-term vision rather than short-term market pressures.
              </p>
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
          <motion.div 
            className="text-center mb-20 md:mb-24"
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
                {/* Background Image with better overlay */}
                <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-700">
                  <SafeImage 
                    src={division.image} 
                    fallbackSrc={founderHero}
                    alt={division.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-black/80" />
                </div>
                
                {/* Visit Website Button */}
                <a 
                  href={division.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-gold/30 text-gold text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold hover:text-black"
                >
                  Visit Website
                  <ArrowUpRight className="w-3 h-3" />
                </a>
                
                {/* Content */}
                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/30 group-hover:border-gold/60 group-hover:scale-110 transition-all duration-500 flex-shrink-0 shadow-lg shadow-gold/10">
                      <division.icon className="w-8 h-8 md:w-10 md:h-10 text-gold" />
                    </div>
                    <div>
                      <span className="text-gold/70 text-xs uppercase tracking-[0.2em] mb-1 block">{division.tagline}</span>
                      <h3 className="text-white text-2xl md:text-3xl font-bold group-hover:text-gold transition-colors duration-300">
                        {division.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
                    {division.description}
                  </p>
                </div>
                
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/10 to-transparent" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gold/5 to-transparent" />
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

      {/* PULL-QUOTE BLOCK - CINEMATIC */}
      <section className="py-24 md:py-40 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <SafeImage 
            src={founderDark} 
            fallbackSrc={founderHero}
            alt="Jane Abou Jaoude" 
            className="w-full h-full object-cover object-top opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/98 to-black" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="flex items-start gap-8 md:gap-12">
              <div className="w-1.5 md:w-2 h-40 md:h-48 bg-gradient-to-b from-gold via-gold/60 to-transparent flex-shrink-0 rounded-full" />
              <div>
                <blockquote className="text-white text-2xl md:text-4xl lg:text-5xl italic leading-relaxed font-light mb-10">
                  "We Create | We Elevate | We Lead"
                </blockquote>
                <footer className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold/60 shadow-lg shadow-gold/20">
                    <SafeImage src={founderProfessional} fallbackSrc={founderHero} alt="Jane Abou Jaoude" className="w-full h-full object-cover object-[center_15%] scale-125" />
                  </div>
                  <div>
                    <p className="text-gold text-lg font-medium">Jane Abou Jaoude</p>
                    <p className="text-zinc-500">Founder & Chairwoman</p>
                  </div>
                </footer>
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
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div 
              className="col-span-2 row-span-2 aspect-square md:aspect-auto rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl group"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderJetInterior} 
                fallbackSrc={founderHero}
                alt="Private Aviation" 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
              />
            </motion.div>
            {[founderOffice, founderProfessional, founderJetBoarding, founderJetInterior].map((img, i) => (
              <motion.div 
                key={i}
                className="aspect-square rounded-2xl overflow-hidden border border-zinc-800 group"
                variants={scaleIn}
              >
                <SafeImage 
                  src={img} 
                  fallbackSrc={founderHero}
                  alt="Lifestyle" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LOOKING AHEAD */}
      <section className="py-24 md:py-40 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div className="mb-10">
                <span className="text-gold text-sm uppercase tracking-[0.4em]">Vision</span>
                <GoldLine className="w-24 mt-4" />
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-10"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Looking <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Ahead</span>
              </h2>
              
              <div className="space-y-6 text-zinc-400 leading-relaxed text-lg md:text-xl">
                <p>
                  JJ Holding Group continues to expand its presence across strategic sectors, guided by the same principles that established its foundation.
                </p>
                <p className="text-zinc-500 text-base md:text-lg">
                  Future initiatives will deepen existing capabilities while exploring complementary opportunities in emerging markets.
                </p>
                <p className="text-zinc-500 text-base md:text-lg">
                  JJ Global Capital remains committed to serving discerning investors with access to the UAE's most compelling real estate opportunities.
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 gap-4 md:gap-6"
              variants={staggerContainer}
            >
              <motion.div 
                className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl group"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderOffice} 
                  fallbackSrc={founderHero}
                  alt="Leadership" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                />
              </motion.div>
              <motion.div 
                className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl mt-8 group"
                variants={scaleIn}
              >
                <SafeImage 
                  src={founderProfessional} 
                  fallbackSrc={founderHero}
                  alt="Future Vision" 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA - JJ GLOBAL CAPITAL */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950/50 to-black border-t border-gold/10 relative overflow-hidden">
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
              className="flex flex-wrap justify-center gap-4 md:gap-5 mb-10"
              variants={fadeInUp}
            >
              <Link 
                to="/contact"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30 hover:shadow-gold/40 hover:scale-105"
              >
                Connect <ArrowUpRight className="w-5 h-5" />
              </Link>
              <a 
                href="mailto:media@jjglobalcapital.com"
                className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-800 hover:border-gold/30 transition-all"
              >
                Media <Mail className="w-5 h-5" />
              </a>
              <a 
                href="mailto:partnerships@jjglobalcapital.com"
                className="inline-flex items-center gap-3 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 hover:border-gold/30 transition-all"
              >
                Partnership <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjglobalcapital.com"
                className="inline-flex items-center gap-3 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 hover:border-gold/30 transition-all"
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
              className="flex flex-wrap justify-center gap-4 md:gap-5 mb-10"
              variants={fadeInUp}
            >
              <a 
                href="mailto:inquiries@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30 hover:shadow-gold/40 hover:scale-105"
              >
                Connect <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:media@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-800 hover:border-gold/30 transition-all"
              >
                Media <Mail className="w-5 h-5" />
              </a>
              <a 
                href="mailto:partnerships@jjholdinggroup.com"
                className="inline-flex items-center gap-3 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 hover:border-gold/30 transition-all"
              >
                Partnership <ExternalLink className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjholdinggroup.com"
                className="inline-flex items-center gap-3 border border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 hover:border-gold/30 transition-all"
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

            <motion.div 
              className="pt-10 mt-10 border-t border-zinc-800"
              variants={fadeInUp}
            >
              <a 
                href="https://jjholdinggroup.com" 
                className="text-gold hover:underline inline-flex items-center gap-2 text-sm tracking-wide"
              >
                Visit JJ Holding Group <ExternalLink className="w-4 h-4" />
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
