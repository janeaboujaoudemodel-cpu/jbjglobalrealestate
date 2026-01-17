import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Image, 
  FileText, 
  User, 
  Building2, 
  Check,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  Copy
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
import founderAwardStage from "@/assets/founder-award-stage.jpeg";
import founderRedCarpet from "@/assets/founder-red-carpet.jpeg";
import founderSpeaking from "@/assets/founder-speaking.png";
// jjFlags removed - old company branding

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

// Decorative gold line component
const GoldLine = ({ className = "" }: { className?: string }) => (
  <div className={`h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent ${className}`} />
);

interface DownloadableAsset {
  id: string;
  name: string;
  description: string;
  image: string;
  category: "headshot" | "logo" | "brand";
  resolution?: string;
}

const founderHeadshots: DownloadableAsset[] = [
  {
    id: "headshot-professional",
    name: "Professional Portrait",
    description: "High-resolution professional headshot for press releases and articles",
    image: founderProfessional,
    category: "headshot",
    resolution: "High Resolution"
  },
  {
    id: "headshot-hero",
    name: "Hero Portrait",
    description: "Full-length portrait suitable for features and cover stories",
    image: founderHero,
    category: "headshot",
    resolution: "High Resolution"
  },
  {
    id: "headshot-premium",
    name: "Premium Portrait",
    description: "Elegant portrait for premium publications and profiles",
    image: founderPremium,
    category: "headshot",
    resolution: "High Resolution"
  },
  {
    id: "headshot-office",
    name: "Executive Portrait",
    description: "Professional office setting portrait for business publications",
    image: founderOffice,
    category: "headshot",
    resolution: "High Resolution"
  },
  {
    id: "headshot-speaking",
    name: "Speaking Engagement",
    description: "Portrait suitable for conference and speaking announcements",
    image: founderSpeaking,
    category: "headshot",
    resolution: "High Resolution"
  },
  {
    id: "headshot-event",
    name: "Event Portrait",
    description: "Red carpet and event photography for lifestyle features",
    image: founderRedCarpet,
    category: "headshot",
    resolution: "High Resolution"
  },
];

const brandAssets: DownloadableAsset[] = [
  {
    id: "founder-award",
    name: "Award Recognition",
    description: "Jane Abou Jaoude receiving industry recognition",
    image: founderAwardStage,
    category: "brand",
    resolution: "High Resolution"
  },
];

const PressKit = () => {
  const [downloadedItems, setDownloadedItems] = useState<Set<string>>(new Set());

  // Downloads disabled - photos are protected intellectual property
  const handleDownload = async (asset: DownloadableAsset) => {
    toast.error("Downloads are disabled. For media inquiries, please contact media@JBJ.ae");
  };

  const handleDownloadAll = async (assets: DownloadableAsset[], category: string) => {
    toast.error("Downloads are disabled. For media inquiries, please contact media@JBJ.ae");
  };

  const handleCopyBio = async () => {
    const bioText = `Jane Abou Jaoude is the Founder of JBJ GLOBAL REAL ESTATE, a Dubai-based real estate brokerage. Born August 25, 1998, in Lebanon, she founded her first business—Jane's Beauty—at age 16 in 2015 while still studying. Fluent in French, English, Arabic, and Spanish, Jane relocated to Dubai in 2020. She has experience in corporate operations, hospitality quality management, and real estate brokerage. She founded JBJ GLOBAL REAL ESTATE in 2025.`;
    
    try {
      await navigator.clipboard.writeText(bioText);
      toast.success("Biography copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        
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
              className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Download high-resolution photos, logos, and brand assets for media use
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Quick Bio Section */}
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
              className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-3xl p-8 md:p-12"
              variants={fadeInUp}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/30">
                    <FileText className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-semibold">Official Biography</h3>
                    <p className="text-zinc-500 text-sm">Short bio for press releases</p>
                  </div>
                </div>
                <Button
                  onClick={handleCopyBio}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              
              <p className="text-zinc-300 leading-relaxed">
                <span className="text-gold font-semibold">Jane Abou Jaoude</span> is the Founder of JBJ GLOBAL REAL ESTATE, 
                a Dubai-based real estate brokerage. 
                Born August 25, 1998, in Lebanon, she founded her first business—Jane's Beauty—at age 16 in 2015 while still studying. 
                Fluent in French, English, Arabic, and Spanish, Jane relocated to Dubai in 2020. 
                She has experience in corporate operations, hospitality quality management, and real estate brokerage. 
                She founded JBJ GLOBAL REAL ESTATE in 2025.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Founder Headshots */}
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
              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2">
                <p className="text-zinc-400 text-sm">
                  <Mail className="w-4 h-4 inline mr-2" />
                  For media inquiries: <span className="text-gold">media@JBJ.ae</span>
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
                  className="group bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-gold/40 transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img 
                      src={asset.image} 
                      alt={asset.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Protected overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60">
                      <div className="text-center px-4">
                        <p className="text-white text-sm font-medium mb-1">Protected Content</p>
                        <p className="text-zinc-400 text-xs">For media inquiries, use the contact form</p>
                      </div>
                    </div>
                    
                    {/* Resolution badge */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-gold text-xs px-3 py-1 rounded-full border border-gold/30">
                      {asset.resolution}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="text-white font-semibold mb-1">{asset.name}</h4>
                    <p className="text-zinc-500 text-sm">{asset.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Assets & Logos */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4" variants={fadeInUp}>
              <div>
                <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Brand Assets</span>
                <h2 
                  className="text-white text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Logos & <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Brand Imagery</span>
                </h2>
              </div>
              <Button
                onClick={() => handleDownloadAll(brandAssets, "brand assets")}
                className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All Brand Assets
              </Button>
            </motion.div>

            {/* Logo Display */}
            <motion.div className="mb-12" variants={fadeInUp}>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Dark Logo */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-8 md:p-12 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-6">For Light Backgrounds</p>
                  <div className="flex justify-center mb-6">
                    <div className="transform scale-150">
                      <JJLogoImage variant="light" size="lg" showText={false} />
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm mb-4">Primary logo with gold accents</p>
                  <p className="text-zinc-600 text-xs">SVG format available on request</p>
                </div>

                {/* Light Logo */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-6">For Dark Backgrounds</p>
                  <div className="flex justify-center items-center mb-6 h-20">
                    <span className="text-3xl font-light tracking-[0.3em] text-[#A8925A]" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JBJ
                    </span>
                    <div className="ml-4 flex flex-col items-start">
                      <span className="text-zinc-800 text-sm font-semibold tracking-[0.2em]">GLOBAL</span>
                      <span className="text-zinc-800 text-sm font-semibold tracking-[0.2em]">REAL ESTATE</span>
                    </div>
                  </div>
                  <p className="text-zinc-600 text-sm mb-4">Inverted logo for light backgrounds</p>
                  <p className="text-zinc-400 text-xs">SVG format available on request</p>
                </div>
              </div>
            </motion.div>

            {/* Brand Images */}
            <motion.div 
              className="grid md:grid-cols-2 gap-6"
              variants={staggerContainer}
            >
              {brandAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  className="group bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl overflow-hidden hover:border-gold/40 transition-all duration-300"
                  variants={fadeInUp}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={asset.image} 
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        onClick={() => handleDownload(asset)}
                        className="bg-gold hover:bg-gold-light text-black font-semibold"
                      >
                        {downloadedItems.has(asset.id) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Downloaded
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-gold text-xs px-3 py-1 rounded-full border border-gold/30">
                      {asset.resolution}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="text-white font-semibold mb-1">{asset.name}</h4>
                    <p className="text-zinc-500 text-sm">{asset.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Company Fact Sheet */}
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
              {/* Company Info */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-8"
                variants={fadeInUp}
              >
                <h4 className="text-gold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Information
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500">Company Name</span>
                    <span className="text-white font-medium">JBJ GLOBAL REAL ESTATE</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500">Founded</span>
                    <span className="text-white font-medium">2025</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500">Headquarters</span>
                    <span className="text-white font-medium">Downtown Dubai, UAE</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800 pb-3">
                    <span className="text-zinc-500">Industry</span>
                    <span className="text-white font-medium">Real Estate Brokerage</span>
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

              {/* Key Metrics */}
              <motion.div 
                className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-800 rounded-2xl p-8"
                variants={fadeInUp}
              >
                <h4 className="text-gold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Key Metrics
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gold/30 pb-3">
                    <span className="text-zinc-500">Industry Experience</span>
                    <span className="text-gold font-bold">12+ Years</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/30 pb-3">
                    <span className="text-zinc-500">Brokers Trained</span>
                    <span className="text-gold font-bold">2,800+</span>
                  </div>
                  <div className="flex justify-between border-b border-gold/30 pb-3">
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

      {/* Media Contact */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-950/50 via-black to-zinc-950/50 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <span className="text-gold text-sm uppercase tracking-[0.3em] mb-4 block">Press Inquiries</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#C4A962]">Contact</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10">
                For press inquiries, interview requests, or additional assets, please contact our media relations team.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-10"
              variants={fadeInUp}
            >
              <a 
                href="mailto:contact@jbj.ae"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-gold to-[#C4A962] text-black font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/30"
              >
                <Mail className="w-5 h-5" />
                contact@jbj.ae
              </a>
              <a 
                href={getCallUrl()}
                className="inline-flex items-center gap-3 bg-zinc-900/80 border-2 border-zinc-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-zinc-800 hover:border-gold/50 transition-all duration-300"
              >
                <Phone className="w-5 h-5" />
                {CONTACT_INFO.phone}
              </a>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Link
                to="/company-profile"
                className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download Full Company Profile (PDF)
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