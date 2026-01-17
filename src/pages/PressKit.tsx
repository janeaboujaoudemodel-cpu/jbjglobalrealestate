import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  User, 
  Building2, 
  ExternalLink,
  Mail,
  Phone,
  Shield,
  Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { JJLogoImage } from "@/components/JJLogoImage";
import { CONTACT_INFO, COMPANY_STATS, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { toast } from "sonner";

// Import founder images
import founderProfessional from "@/assets/founder-professional.jpeg";
import founderHero from "@/assets/founder-hero.png";
import founderPremium from "@/assets/founder-premium.png";
import founderOffice from "@/assets/founder-office.jpeg";
import founderRedCarpet from "@/assets/founder-red-carpet.jpeg";
import founderSpeaking from "@/assets/founder-speaking.png";
import founderYacht from "@/assets/founder-yacht.jpeg";

// Hero video for press kit
import heroVideo from "@/assets/dubai-hero-video.mp4";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

interface FounderPhoto {
  id: string;
  name: string;
  description: string;
  image: string;
}

// Unique headshots only - no duplicates
const founderHeadshots: FounderPhoto[] = [
  {
    id: "headshot-professional",
    name: "Professional Portrait",
    description: "High-resolution professional headshot for press releases",
    image: founderProfessional,
  },
  {
    id: "headshot-hero",
    name: "Hero Portrait",
    description: "Full-length portrait for features and cover stories",
    image: founderHero,
  },
  {
    id: "headshot-premium",
    name: "Premium Portrait",
    description: "Elegant portrait for premium publications",
    image: founderPremium,
  },
  {
    id: "headshot-office",
    name: "Executive Portrait",
    description: "Professional office setting portrait",
    image: founderOffice,
  },
  {
    id: "headshot-speaking",
    name: "Speaking Engagement",
    description: "Portrait for conference announcements",
    image: founderSpeaking,
  },
  {
    id: "headshot-event",
    name: "Event Portrait",
    description: "Red carpet photography for lifestyle features",
    image: founderRedCarpet,
  },
];

const PressKit = () => {
  // Disable right-click and copy functionality
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Content is protected. For media inquiries, contact media@JBJ.ae");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Content is protected. For media inquiries, contact media@JBJ.ae");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, F12
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'p')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        toast.error("Content is protected. For media inquiries, contact media@JBJ.ae");
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      {/* Hero Section with Video */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-30"
            poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl z-[1]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl z-[1]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span
              className="inline-block text-gold text-xs uppercase tracking-[0.4em] mb-6"
              variants={fadeInUp}
            >
              Media Resources
            </motion.span>
            <motion.h1 
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Press <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Kit</span>
            </motion.h1>
            <motion.p 
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-6"
              variants={fadeInUp}
            >
              Official media resources for JBJ Global Real Estate
            </motion.p>
            
            {/* Protected content notice */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-zinc-900/80 border border-gold/30 rounded-full px-5 py-2"
              variants={fadeInUp}
            >
              <Lock className="w-4 h-4 text-gold" />
              <span className="text-zinc-300 text-sm">Protected Content • Contact for Access</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Bio Section - Premium White/Gold Style */}
      <section className="py-16 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div 
              className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-3xl p-8 md:p-12 shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center border border-gold/30">
                    <FileText className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-black text-xl font-semibold">Official Biography</h3>
                    <p className="text-zinc-500 text-sm">Short bio for press releases</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/10 border border-gold/30 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3 text-gold" />
                  <span className="text-xs text-zinc-600">Protected</span>
                </div>
              </div>
              
              <p className="text-zinc-700 leading-relaxed">
                <span className="text-gold font-semibold">Jane Abou Jaoude</span> is the Founder and CEO of JBJ GLOBAL REAL ESTATE, 
                a Dubai-based Real Estate brokerage. 
                Born August 25, 1998, in Lebanon, she founded her first business—Jane's Beauty—at age 16 in 2015 while still studying. 
                Fluent in French, English, Arabic, and Spanish, Jane relocated to Dubai in 2020. 
                She has experience in corporate operations, hospitality quality management, and Real Estate brokerage. 
                She founded JBJ GLOBAL REAL ESTATE in 2025.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Founder Headshots - White Cards on Black */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4" variants={fadeInUp}>
              <div>
                <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Founder Photos</span>
                <h2 
                  className="text-white text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Jane Abou Jaoude <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Headshots</span>
                </h2>
              </div>
              <div className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-lg px-4 py-2 shadow-sm">
                <p className="text-zinc-700 text-sm">
                  <Mail className="w-4 h-4 inline mr-2 text-gold" />
                  For media inquiries: <span className="text-gold font-medium">media@JBJ.ae</span>
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              {founderHeadshots.map((asset) => (
                <motion.div
                  key={asset.id}
                  className="group bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-2xl overflow-hidden hover:border-gold/60 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={asset.image} 
                      alt={asset.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      draggable="false"
                      onDragStart={(e) => e.preventDefault()}
                    />
                    {/* Protected overlay - always visible */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Protected badge */}
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-gold text-xs px-3 py-1 rounded-full border border-gold/30 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Protected
                    </div>
                    
                    {/* Hover overlay with contact message */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/70">
                      <div className="text-center px-4">
                        <Shield className="w-8 h-8 text-gold mx-auto mb-2" />
                        <p className="text-white text-sm font-medium mb-1">Protected Content</p>
                        <p className="text-zinc-400 text-xs">Contact media@JBJ.ae for access</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="text-black font-semibold mb-1">{asset.name}</h4>
                    <p className="text-zinc-500 text-sm">{asset.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Logo Display Section - White Cards */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Brand Assets</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Official <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Logos</span>
              </h2>
            </motion.div>

            {/* Logo Display */}
            <motion.div className="mb-12" variants={fadeInUp}>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Dark Logo on Light */}
                <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-2xl p-8 md:p-12 text-center shadow-lg">
                  <p className="text-zinc-600 text-xs uppercase tracking-wider mb-6">For Light Backgrounds</p>
                  <div className="flex justify-center mb-6">
                    <div className="transform scale-150">
                      <JJLogoImage variant="light" size="lg" showText={false} />
                    </div>
                  </div>
                  <p className="text-zinc-700 text-sm mb-4">Primary logo with gold accents</p>
                  <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                    <Lock className="w-3 h-3 text-gold" />
                    SVG format available on request
                  </div>
                </div>

                {/* Light Logo on Dark */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-6">For Dark Backgrounds</p>
                  <div className="flex justify-center items-center mb-6 h-20">
                    <span className="text-3xl font-light tracking-[0.3em] text-[#A8925A]" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JBJ
                    </span>
                    <div className="ml-4 flex flex-col items-start">
                      <span className="text-white text-sm font-semibold tracking-[0.2em]">GLOBAL</span>
                      <span className="text-white text-sm font-semibold tracking-[0.2em]">REAL ESTATE</span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm mb-4">Inverted logo for dark backgrounds</p>
                  <div className="flex items-center justify-center gap-2 text-zinc-600 text-xs">
                    <Lock className="w-3 h-3 text-gold" />
                    SVG format available on request
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Company Fact Sheet - White Cards */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Quick Reference</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Company <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Fact Sheet</span>
              </h2>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {/* Company Info - White Card */}
              <motion.div 
                className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h4 className="text-gold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Information
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Company Name</span>
                    <span className="text-black font-medium">JBJ GLOBAL REAL ESTATE</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Founded</span>
                    <span className="text-black font-medium">2025</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Headquarters</span>
                    <span className="text-black font-medium">Downtown Dubai, UAE</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Industry</span>
                    <span className="text-black font-medium">Real Estate Brokerage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Website</span>
                    <a href="https://jbj.ae" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline flex items-center gap-1">
                      jbj.ae
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Key Metrics - White Card */}
              <motion.div 
                className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h4 className="text-gold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Key Metrics
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Industry Experience</span>
                    <span className="text-gold font-bold">12+ Years</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Brokers Trained</span>
                    <span className="text-gold font-bold">2,800+</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/20 pb-3">
                    <span className="text-zinc-500">Team Members</span>
                    <span className="text-gold font-bold">10+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Client Satisfaction</span>
                    <span className="text-gold font-bold">98%</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Media Contact - Premium White/Gold Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            {/* Premium Contact Card */}
            <motion.div 
              className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-3xl p-8 md:p-12 text-center shadow-lg"
              variants={fadeInUp}
            >
              <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Press Inquiries</span>
              <h2 
                className="text-black text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Media <span className="text-gold">Contact</span>
              </h2>
              <p className="text-zinc-600 text-lg mb-10">
                For press inquiries, interview requests, or additional assets, please contact our media relations team.
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <a 
                  href="mailto:media@jbj.ae"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30"
                >
                  <Mail className="w-5 h-5" />
                  media@JBJ.ae
                </a>
                <a 
                  href={getCallUrl()}
                  className="inline-flex items-center gap-3 bg-black border-2 border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-900 hover:border-gold/50 transition-all duration-300"
                >
                  <Phone className="w-5 h-5" />
                  {CONTACT_INFO.phone}
                </a>
              </div>

              <Link
                to="/company-profile"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Full Company Profile
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PressKit;
