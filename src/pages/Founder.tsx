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

  // Career Timeline
  const careerTimeline = [
    {
      year: "2012",
      title: "Early Career in Finance",
      description: "Began career in investment banking, developing expertise in wealth management and capital markets.",
      location: "Beirut, Lebanon"
    },
    {
      year: "2015",
      title: "Relocation to Dubai",
      description: "Moved to the UAE to pursue opportunities in the rapidly growing real estate and investment sector.",
      location: "Dubai, UAE"
    },
    {
      year: "2018",
      title: "Founded JJ Global Capital",
      description: "Established the flagship real estate investment advisory firm, focusing on premium property portfolios.",
      location: "Dubai, UAE"
    },
    {
      year: "2019",
      title: "Launched Maison Jane",
      description: "Expanded into luxury lifestyle and concierge services, catering to ultra-high-net-worth individuals.",
      location: "Dubai, UAE"
    },
    {
      year: "2020",
      title: "Established JJ Holding Group",
      description: "Consolidated all ventures under a unified holding structure, establishing institutional governance.",
      location: "Dubai, UAE"
    },
    {
      year: "2021",
      title: "JJ Media Group Launch",
      description: "Founded the media and communications division to manage brand identity across all ventures.",
      location: "Dubai, UAE"
    },
    {
      year: "2023",
      title: "International Expansion",
      description: "Extended operations to serve clients from 92+ countries, establishing global partnerships.",
      location: "Global"
    },
    {
      year: "2024",
      title: "AI-Powered Innovation",
      description: "Pioneered AI-driven investment tools and launched JJ Fashion House couture division.",
      location: "Dubai, UAE"
    },
  ];

  // Speaking Engagements
  const speakingEngagements = [
    {
      event: "Dubai Real Estate Summit",
      topic: "The Future of Luxury Real Estate Investment in the GCC",
      date: "November 2024",
      type: "Keynote Speaker"
    },
    {
      event: "Women in Business Forum",
      topic: "Building Institutions: A Founder's Journey",
      date: "September 2024",
      type: "Panel Discussion"
    },
    {
      event: "MENA Investment Conference",
      topic: "Wealth Preservation Strategies for Global Investors",
      date: "June 2024",
      type: "Keynote Speaker"
    },
    {
      event: "Emirates Business Leaders Summit",
      topic: "Founder-Led Governance in Modern Enterprises",
      date: "March 2024",
      type: "Featured Speaker"
    },
    {
      event: "Global Luxury Real Estate Forum",
      topic: "Excellence as a Standard: Redefining Client Experience",
      date: "January 2024",
      type: "Panel Moderator"
    },
    {
      event: "Arabian Business Awards",
      topic: "Entrepreneurship and Vision in the UAE",
      date: "December 2023",
      type: "Award Recipient & Speaker"
    },
  ];

  // Media Appearances
  const mediaAppearances = [
    {
      outlet: "Arabian Business",
      title: "Jane Abou Jaoude: The Visionary Behind JJ Global Capital",
      type: "Cover Feature",
      date: "October 2024",
      category: "Magazine"
    },
    {
      outlet: "Bloomberg Middle East",
      title: "UAE Real Estate: Investment Opportunities for 2025",
      type: "Interview",
      date: "September 2024",
      category: "TV"
    },
    {
      outlet: "Forbes Middle East",
      title: "50 Influential Business Women in the Arab World",
      type: "Feature Article",
      date: "August 2024",
      category: "Magazine"
    },
    {
      outlet: "Gulf News",
      title: "How JJ Holding Group is Shaping Dubai's Luxury Market",
      type: "Business Profile",
      date: "July 2024",
      category: "Newspaper"
    },
    {
      outlet: "Dubai Eye Radio",
      title: "The Art of Building a Multi-Division Enterprise",
      type: "Radio Interview",
      date: "May 2024",
      category: "Radio"
    },
    {
      outlet: "CNBC Arabia",
      title: "Real Estate Investment Trends in the UAE",
      type: "Expert Panel",
      date: "April 2024",
      category: "TV"
    },
    {
      outlet: "The National",
      title: "Founder-Led Companies: The New Standard of Excellence",
      type: "Op-Ed",
      date: "February 2024",
      category: "Newspaper"
    },
    {
      outlet: "Entrepreneur Middle East",
      title: "Building a Luxury Empire: The JJ Global Capital Story",
      type: "Cover Story",
      date: "January 2024",
      category: "Magazine"
    },
  ];

  const getMediaIcon = (category: string) => {
    switch (category) {
      case "TV": return Video;
      case "Radio": return Mic;
      case "Magazine": return BookOpen;
      case "Newspaper": return Newspaper;
      default: return Newspaper;
    }
  };

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
                  Early Life & Education
                </h3>
                <p className="text-lg mb-4">
                  Jane Abou Jaoude was born into a family that valued entrepreneurship, education, and excellence. 
                  Growing up in Lebanon, she developed an early appreciation for business and the art of building lasting relationships.
                </p>
                <p className="text-lg text-zinc-400">
                  Her academic journey led her to pursue studies in finance and business administration, where she graduated with honors. 
                  This foundation in financial principles would later prove instrumental in her approach to real estate investment and wealth management.
                </p>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  Professional Journey
                </h3>
                <p className="text-lg mb-4">
                  After beginning her career in investment banking, Jane quickly distinguished herself through her analytical acumen and 
                  client-centric approach. Her ability to identify high-value opportunities and structure complex deals earned her recognition 
                  among peers and clients alike.
                </p>
                <p className="text-lg mb-4 text-zinc-400">
                  In 2015, Jane relocated to Dubai, recognizing the emirate's potential as a global hub for investment and luxury. 
                  This strategic move positioned her at the intersection of East and West, where she could leverage her expertise 
                  to serve an international clientele.
                </p>
                <p className="text-lg text-zinc-400">
                  The founding of JJ Global Capital in 2018 marked the culmination of her vision—a boutique advisory firm that would 
                  set new standards in real estate investment. Within years, she expanded her portfolio to include Maison Jane, 
                  JJ Media Group, and JJ Fashion House, each reflecting her commitment to excellence across diverse sectors.
                </p>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12">
                <h3 className="text-gold text-xl font-semibold mb-6 flex items-center gap-3">
                  <Award className="w-6 h-6" />
                  Recognition & Achievements
                </h3>
                <p className="text-lg mb-4">
                  Jane's contributions to the UAE business landscape have been recognized through numerous awards and accolades. 
                  She has been featured in prestigious publications including Forbes Middle East, Arabian Business, and Entrepreneur Middle East.
                </p>
                <p className="text-lg text-zinc-400">
                  Her leadership philosophy—emphasizing quality over quantity, discretion over publicity, and long-term value over short-term gains—has 
                  become a model for founder-led enterprises in the region. Today, JJ Holding Group serves clients from over 92 countries, 
                  with a portfolio exceeding AED 2 billion.
                </p>
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

      {/* SPEAKING ENGAGEMENTS */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Thought Leadership</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Speaking <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Engagements</span>
              </h2>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              {speakingEngagements.map((engagement, index) => (
                <motion.div
                  key={engagement.event}
                  className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-6 hover:border-gold/40 transition-all duration-300 group"
                  variants={fadeInUp}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                      <Mic className="w-5 h-5 text-gold" />
                    </div>
                    <span className="text-gold/70 text-xs uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full">
                      {engagement.type}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">{engagement.event}</h4>
                  <p className="text-zinc-400 text-sm mb-4 leading-relaxed">"{engagement.topic}"</p>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    {engagement.date}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MEDIA APPEARANCES */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.4em]">Press & Media</span>
              <GoldLine className="w-32 mx-auto mt-4 mb-8" />
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Appearances</span>
              </h2>
              <p className="text-zinc-400 text-lg mt-6 max-w-2xl mx-auto">
                Featured across leading publications and broadcast media in the Middle East and beyond
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
              variants={staggerContainer}
            >
              {mediaAppearances.map((appearance, index) => {
                const MediaIcon = getMediaIcon(appearance.category);
                return (
                  <motion.div
                    key={`${appearance.outlet}-${appearance.date}`}
                    className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-6 hover:border-gold/40 transition-all duration-300 group flex gap-5"
                    variants={fadeInUp}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform flex-shrink-0">
                      <MediaIcon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-gold font-semibold">{appearance.outlet}</h4>
                        <span className="text-zinc-500 text-xs whitespace-nowrap">{appearance.date}</span>
                      </div>
                      <p className="text-white text-sm font-medium mb-2">"{appearance.title}"</p>
                      <span className="inline-block text-zinc-500 text-xs uppercase tracking-wider bg-zinc-800/50 px-2 py-1 rounded">
                        {appearance.type}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Press Kit Download */}
            <motion.div 
              className="text-center mt-16"
              variants={fadeInUp}
            >
              <Link
                to="/company-profile"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30"
              >
                <Download className="w-5 h-5" />
                Download Press Kit
              </Link>
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
              <p className="text-gold/70 text-xs uppercase tracking-[0.15em]">
                & Visionary Woman
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
            {/* Award stage photo - Full height premium display */}
            <motion.div 
              className="aspect-[3/4] rounded-3xl overflow-hidden border border-gold/20 shadow-2xl shadow-gold/10 group relative"
              variants={scaleIn}
            >
              <SafeImage 
                src={founderAwardStage} 
                fallbackSrc={founderHero}
                alt="Jane Abou Jaoude - Industry Recognition" 
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
                Partnership <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:collaboration@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Collaboration <ArrowUpRight className="w-5 h-5" />
              </a>
              <a 
                href="mailto:careers@jjholdinggroup.com"
                className="inline-flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-700 text-white font-semibold px-10 py-4 rounded-2xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                Careers <ArrowUpRight className="w-5 h-5" />
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
