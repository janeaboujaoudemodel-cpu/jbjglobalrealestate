import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import ServicesSection from "@/components/ServicesSection";
import { Sparkles, ArrowUpRight, Building2, ClipboardCheck, Volume2, VolumeX, MessageCircle, Phone, ChevronDown, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import dubaiHeroVideo from "@/assets/dubai-hero-video.mp4";
import founderProfessional from "@/assets/founder-professional.jpeg";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { JJLogo } from "@/components/JJLogo";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const Index = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const quickLinks = [
    { href: "/properties?status=off-plan", label: "Off-Plan Properties", icon: Building2, description: "New launches & pre-construction" },
    { href: "/properties?status=ready", label: "Ready to Move", icon: ClipboardCheck, description: "Immediate handover properties" },
    { href: "/quiz", label: "AI Home Finder", icon: Sparkles, description: "Personalized recommendations" },
  ];

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* HERO SECTION - FULL CINEMATIC */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Video Background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover scale-105"
          >
            <source src={dubaiHeroVideo} type="video/mp4" />
          </video>
          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          className="absolute top-24 right-6 md:top-28 md:right-8 z-20 w-12 h-12 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 group"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white/70 group-hover:text-[#A8925A] transition-colors" />
          ) : (
            <Volume2 className="w-5 h-5 text-white/70 group-hover:text-[#A8925A] transition-colors" />
          )}
        </button>

        {/* Hero Content - Centered */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Premium Logo */}
          <motion.div className="mb-8" variants={fadeInUp}>
            <JJLogo size="lg" />
          </motion.div>

          {/* Main Tagline */}
          <motion.p 
            className="text-zinc-300 text-lg md:text-xl lg:text-2xl font-light tracking-wide mb-6 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            A founder-led advisory group specializing in UAE and Dubai real estate
          </motion.p>

          {/* Sub-tagline */}
          <motion.p 
            className="text-zinc-500 text-sm md:text-base max-w-2xl mx-auto mb-10"
            variants={fadeInUp}
          >
            Investment advisory • Legal services • Design & Build • Luxury concierge
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col items-center gap-4"
            variants={fadeInUp}
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/properties">
                <Button 
                  className="bg-[#A8925A] hover:bg-[#A8925A]/90 text-black font-semibold px-8 py-6 text-base shadow-lg shadow-[#A8925A]/20"
                >
                  Explore Properties
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base backdrop-blur-sm"
                >
                  Contact Us
                </Button>
              </a>
            </div>
            
            {/* AI Home Finder CTA */}
            <Link to="/quiz" className="mt-4">
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 border border-purple-500/40 rounded-xl px-6 py-3 transition-all shadow-lg shadow-purple-500/20 group">
                <Sparkles className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Let AI Find Your Home</p>
                  <p className="text-purple-200/80 text-xs">Get Your Free Test Now</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/40 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-[0.3em]">Discover</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </div>

      {/* FOUNDER SECTION - Meet The Leadership */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Founder Image */}
            <motion.div 
              className="relative order-2 lg:order-1"
              variants={fadeInUp}
            >
              <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none">
                {/* Decorative frame */}
                <div className="absolute -inset-4 border border-[#A8925A]/20 rounded-3xl" />
                <div className="absolute -inset-2 bg-gradient-to-br from-[#A8925A]/10 to-transparent rounded-2xl" />
                
                {/* Image container with smart crop - show from top */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80">
                  <img 
                    src={founderProfessional} 
                    alt="Jane Abou Jaoude - Founder & Chairwoman" 
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                {/* Name badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-[#A8925A]/30 rounded-xl p-4">
                  <p className="text-[#A8925A] text-xs uppercase tracking-[0.2em] mb-1">Founder & Chairwoman</p>
                  <h3 className="text-white text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Jane Abou Jaoude
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div className="order-1 lg:order-2" variants={fadeInUp}>
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 text-[#A8925A] text-sm uppercase tracking-[0.3em]">
                  <User className="w-4 h-4" />
                  Leadership
                </span>
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A8925A] to-[#C4A962]">Founder</span>
              </h2>
              
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-6">
                JJ Holding Group is a founder-led, multi-division holding built on unwavering standards, discretion, and long-term vision.
              </p>
              
              <p className="text-zinc-500 text-base md:text-lg leading-relaxed mb-8">
                Jane Abou Jaoude leads with a philosophy rooted in accountability and discretion, building organizations designed to endure rather than simply expand.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-[#A8925A] text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>4</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Divisions</p>
                </div>
                <div className="text-center">
                  <p className="text-[#A8925A] text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>12+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Years</p>
                </div>
                <div className="text-center">
                  <p className="text-[#A8925A] text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>92+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Countries</p>
                </div>
              </div>
              
              <Link to="/founder">
                <Button className="bg-[#A8925A] hover:bg-[#A8925A]/90 text-black font-semibold px-8 py-6 text-base">
                  Learn More About Our Founder
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI PROPERTY MATCHMAKER CTA */}
      <div className="container mx-auto px-4 py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <Link to="/quiz" className="block">
            <div className="w-full bg-gradient-to-r from-purple-950 via-purple-900 to-black hover:from-purple-900 hover:via-purple-800 hover:to-zinc-900 rounded-3xl p-8 md:p-12 transition-all duration-500 shadow-2xl shadow-purple-900/30 hover:shadow-purple-800/40 group cursor-pointer border border-purple-800/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-purple-300 text-xs uppercase tracking-[0.2em] mb-2">Exclusive by JJ Global Capital</p>
                    <h3 className="text-white text-2xl md:text-3xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Let AI Choose Your Home
                    </h3>
                    <p className="text-purple-200/70 text-base">
                      Complimentary • #1 AI Property Matchmaker in the World
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-purple-600 hover:bg-purple-500 rounded-xl px-8 py-4 transition-colors shadow-lg group-hover:scale-105">
                  <span className="text-white font-semibold text-lg">Start Free</span>
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* QUICK LINKS - Property Search Entry Points */}
      <div className="container mx-auto px-4 pb-16">
        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {quickLinks.map((link) => (
            <motion.div key={link.href} variants={fadeInUp}>
              <Link to={link.href}>
                <div className="group bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-[#A8925A]/30 rounded-2xl p-8 transition-all duration-300">
                  <div className="w-14 h-14 bg-[#A8925A]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#A8925A]/20 transition-colors">
                    <link.icon className="w-7 h-7 text-[#A8925A]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2 group-hover:text-[#A8925A] transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-zinc-500 text-sm">{link.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Why Dubai Section */}
      <WhyDubaiSection />

      {/* Services Section */}
      <ServicesSection />

      {/* Contact CTA Section */}
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center py-20 border-t border-zinc-800"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <span className="inline-block text-[#A8925A] text-xs uppercase tracking-[0.3em] mb-4">Get Started</span>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Invest?
          </h3>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
            Connect with our investment advisors for personalized guidance on UAE real estate opportunities
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#A8925A] hover:bg-[#A8925A]/90 text-black font-semibold px-8 py-6 h-auto text-base">
                <ArrowUpRight className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </a>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white px-8 py-6 h-auto text-base">
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </a>
            <a href={getCallUrl()}>
              <Button variant="outline" className="border-[#A8925A]/50 text-[#A8925A] hover:bg-[#A8925A] hover:text-black px-8 py-6 h-auto text-base">
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </Button>
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </section>
  );
};

export default Index;
