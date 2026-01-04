import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import WhyDubaiSection from "@/components/WhyDubaiSection";
import ServicesSection from "@/components/ServicesSection";
import { Sparkles, ArrowUpRight, Building2, ClipboardCheck, Volume2, VolumeX, MessageCircle, Phone, ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import dubaiHeroVideo from "@/assets/dubai-hero-video.mp4";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

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

// Premium logo component
const JJLogoHero = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center">
      <span className="text-[#A8925A] font-extralight text-5xl md:text-6xl lg:text-7xl" style={{ fontFamily: "Poppins, sans-serif" }}>J</span>
      <span className="text-white/90 mx-3 md:mx-4 font-thin text-6xl md:text-7xl lg:text-8xl leading-none" style={{ transform: 'scaleY(1.5)' }}>|</span>
      <span className="text-[#A8925A] font-extralight text-5xl md:text-6xl lg:text-7xl" style={{ fontFamily: "Poppins, sans-serif" }}>J</span>
    </div>
    <span className="text-white font-light text-sm md:text-base lg:text-lg tracking-[0.4em] mt-3" style={{ fontFamily: "Poppins, sans-serif" }}>
      GLOBAL CAPITAL
    </span>
  </div>
);

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
            <JJLogoHero />
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
            className="flex flex-wrap justify-center gap-4"
            variants={fadeInUp}
          >
            <Link to="/properties">
              <Button 
                className="bg-[#A8925A] hover:bg-[#A8925A]/90 text-black font-semibold px-8 py-6 text-base shadow-lg shadow-[#A8925A]/20"
              >
                Explore Properties
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/founder">
              <Button 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base backdrop-blur-sm"
              >
                Meet the Founder
              </Button>
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