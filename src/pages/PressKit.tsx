import { useState, useEffect } from "react";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { FounderContent } from "@/components/FounderContent";
import { motion } from "framer-motion";
import {
  FileText,
  User,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  Shield,
  Lock,
  MessageCircle,
  Share2,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { COMPANY_STATS, CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
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
import heroVideo from "@/assets/videos/press-kit-hero.mp4";

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
  const [phoneActionsOpen, setPhoneActionsOpen] = useState(false);

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
    <div className="min-h-screen bg-[#1A1A1A] select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
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
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#EFE6D6]/5 rounded-full blur-3xl z-[1]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#EFE6D6]/5 rounded-full blur-3xl z-[1]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span
              className="inline-block text-[#1A1A1A] text-xs uppercase tracking-[0.4em] mb-6"
              variants={fadeInUp}
            >
              Media Resources
            </motion.span>
            <motion.h1 
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
              variants={fadeInUp}
            >
              Press <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Kit</span>
            </motion.h1>
            <motion.p 
              className="text-[#1A1A1A]/70 text-lg md:text-xl max-w-2xl mx-auto mb-6"
              variants={fadeInUp}
            >
              Official media resources for JBJ Global Real Estate
            </motion.p>
            
            {/* Protected content notice */}
            <motion.div 
              className="inline-flex items-center gap-2 bg-[#FDFBF7]/80 border border-[#B89555]/30 rounded-full px-5 py-2"
              variants={fadeInUp}
            >
              <Lock className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A]/70 text-sm">Protected Content • Contact for Access</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FounderContent>
      {/* Quick Bio Section - Premium White/Gold Style */}
      <section className="py-16 border-y border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div 
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-3xl p-8 md:p-12 shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#1A1A1A] rounded-xl flex items-center justify-center border border-[#B89555]/30">
                    <FileText className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-[#1A1A1A] text-xl font-semibold">Official Biography</h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Short bio for press releases</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-[#1A1A1A]/10 border border-[#B89555]/30 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3 text-[#1A1A1A]" />
                  <span className="text-xs text-[#1A1A1A]/70">Protected</span>
                </div>
              </div>
              
              <p className="text-[#1A1A1A]/70 leading-relaxed">
                <span className="text-[#1A1A1A] font-semibold">Jane Bou Jaoude (جاين بو جودة)</span> is the Founder & CEO of JBJ GLOBAL REAL ESTATE, 
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
      </FounderContent>

      <FounderContent>
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
                <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em] mb-4 block">Founder Photos</span>
                <h2 
                  className="text-white text-3xl md:text-4xl font-bold"
                >
                  Jane Bou Jaoude <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Headshots</span>
                </h2>
              </div>
              <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-lg px-4 py-2 shadow-sm hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
                <p className="text-[#1A1A1A]/70 text-sm">
                  <Mail className="w-4 h-4 inline mr-2 text-[#1A1A1A]" />
                  For media inquiries: <span className="text-[#1A1A1A] font-medium">media@JBJ.ae</span>
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
                  className="group bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl overflow-hidden hover:border-[#B89555]/60 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300"
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
                    <div className="absolute top-4 right-4 bg-[#1A1A1A]/80 backdrop-blur-sm text-[#1A1A1A] text-xs px-3 py-1 rounded-full border border-[#B89555]/30 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Protected
                    </div>
                    
                    {/* Hover overlay with contact message */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#1A1A1A]/70">
                      <div className="text-center px-4">
                        <Shield className="w-8 h-8 text-[#1A1A1A] mx-auto mb-2" />
                        <p className="text-white text-sm font-medium mb-1">Protected Content</p>
                        <p className="text-[#1A1A1A]/70 text-xs">Contact media@JBJ.ae for access</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="text-[#1A1A1A] font-semibold mb-1">{asset.name}</h4>
                    <p className="text-[#1A1A1A]/70 text-sm">{asset.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
      </FounderContent>


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
              <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em] mb-4 block">Quick Reference</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold"
              >
                Company <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Fact Sheet</span>
              </h2>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              {/* Company Info - Champagne Card */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h4 className="text-[#1A1A1A] text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Information
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Company Name</span>
                    <span className="text-[#1A1A1A] font-medium">JBJ GLOBAL REAL ESTATE</span>
                  </div>
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Founded</span>
                    <span className="text-[#1A1A1A] font-medium">2025</span>
                  </div>
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Headquarters</span>
                    <span className="text-[#1A1A1A] font-medium">Downtown Dubai, UAE</span>
                  </div>
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Industry</span>
                    <span className="text-[#1A1A1A] font-medium">Real Estate Brokerage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/70">Website</span>
                    <a href="https://jbj.ae" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] hover:underline flex items-center gap-1">
                      jbj.ae
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Key Metrics - Champagne Card */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h4 className="text-[#1A1A1A] text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Key Metrics
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Industry Experience</span>
                    <span className="text-[#1A1A1A] font-bold">12+ Years</span>
                  </div>
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Brokers Trained</span>
                    <span className="text-[#1A1A1A] font-bold">{`${COMPANY_STATS.brokersTrainedBy.end.toLocaleString()}${COMPANY_STATS.brokersTrainedBy.suffix}`}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#B89555]/20 pb-3">
                    <span className="text-[#1A1A1A]/70">Team Members</span>
                    <span className="text-[#1A1A1A] font-bold">10+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/70">Client Satisfaction</span>
                    <span className="text-[#1A1A1A] font-bold">98%</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Media Contact - Premium champagne Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-t border-[#B89555]/30">
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
              className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-3xl p-8 md:p-12 text-center shadow-lg"
              variants={fadeInUp}
            >
              <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em] mb-4 block">
                Press Inquiries
              </span>
              <h2
                className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-6"
              >
                Media <span className="text-[#1A1A1A]">Contact</span>
              </h2>
              <p className="text-[#1A1A1A]/70 text-lg mb-10">
                For press inquiries, interview requests, or additional assets, please contact our media relations team.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                  <a href="mailto:media@JBJ.ae" className="inline-flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span className="font-semibold">media@JBJ.ae</span>
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="dark"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => setPhoneActionsOpen(true)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    <span className="font-semibold">{CONTACT_INFO.phone}</span>
                  </span>
                </Button>
              </div>

              <Link
                to="/company-profile"
                className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-light transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Full Company Profile
              </Link>
            </motion.div>

            {/* Phone actions (Call / WhatsApp / Add Contact / Share) */}
            <AlertDialog open={phoneActionsOpen} onOpenChange={setPhoneActionsOpen}>
              <AlertDialogContent className="bg-[#FDFBF7] border border-[#B89555]/30">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#1A1A1A]">Contact Options</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#1A1A1A]/70">
                    Choose how you would like to contact JBJ GLOBAL REAL ESTATE.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid gap-3">
                  <Button asChild variant="dark" className="w-full">
                    <a href={getCallUrl()} className="inline-flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                  </Button>

                  <Button asChild variant="secondary" className="w-full">
                    <a
                      href={getWhatsAppUrl("Hi! I would like to connect with the team.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      const vcf = [
                        'BEGIN:VCARD',
                        'VERSION:3.0',
                        'FN:JBJ GLOBAL REAL ESTATE',
                        `TEL;TYPE=WORK,VOICE:${CONTACT_INFO.phone}`,
                        `EMAIL;TYPE=INTERNET:${CONTACT_INFO.emailCapitalized}`,
                        `URL:https://${CONTACT_INFO.domain}`,
                        'END:VCARD',
                      ].join('\n');

                      const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'JBJ_GLOBAL_REAL_ESTATE.vcf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);

                      toast.success('Contact card saved.');
                      setPhoneActionsOpen(false);
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add to Contacts
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={async () => {
                      try {
                        if (!navigator.share) {
                          toast.error('Sharing is not supported on this device.');
                          return;
                        }
                        await navigator.share({
                          title: 'JBJ GLOBAL REAL ESTATE',
                          text: `${CONTACT_INFO.phone} • ${CONTACT_INFO.emailCapitalized}`,
                          url: `${window.location.origin}/contact`,
                        });
                        setPhoneActionsOpen(false);
                      } catch {
                        // user cancelled
                      }
                    }}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </span>
                  </Button>

                  <Button type="button" variant="primary" className="w-full" onClick={() => setPhoneActionsOpen(false)}>
                    Close
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PressKit;
