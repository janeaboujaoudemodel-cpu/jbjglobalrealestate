import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Phone, Mail, Globe, Share2, Download, MessageCircle, Video, 
  PhoneCall, X, MapPin, Building2, 
  Calendar, Briefcase, Star, Copy, Check
} from "lucide-react";
import { FaLinkedinIn, FaInstagram, FaTiktok, FaFacebookF, FaSnapchatGhost } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Import CEO photo - same as used in team/leadership
import janePhoto from '@/assets/ceo/jane-ceo-private-jet.jpg';

// Lazy-load company intro video path (avoid blocking initial render)
const jbjIntroVideo = new URL('@/assets/videos/jbj-company-intro.mp4', import.meta.url).href;

// Import logo for video poster
import jbjMonogramLightTransparent from '@/assets/jbj-monogram-light-transparent.png';

// Contact info constants - LOCKED (from BRAND_LOCK)
// CASING RULE: JBJ.AE, Contact@JBJ.AE - EXACTLY as specified
const CONTACT_INFO = {
  // LOCKED: English name
  name: "Jane bou Jaoude",
  // LOCKED: Arabic name (exact spelling from founder)
  nameArabic: "جاين بو جودة",
  // LOCKED: English title
  title: "Founder & CEO",
  // LOCKED: Arabic title (feminine form with diacritics)
  titleArabic: "ٱلْمُؤَسِّسَةُ وَٱلرَّئِيسَةُ ٱلتَّنْفِيذِيَّةُ",
  company: "JBJ Global Real Estate LLC",
  // LOCKED: Exact casing - Contact@JBJ.AE
  email: "Contact@JBJ.AE",
  emailDisplay: "Contact@JBJ.AE",
  // Company phone
  phoneCompany: "+971 56 591 1000",
  phoneCompanyClean: "+971565911000",
  whatsappCompany: "971565911000",
  // Personal phone
  phonePersonal: "+971 54 716 7107",
  phonePersonalClean: "+971547167107",
  whatsappPersonal: "971547167107",
  // LOCKED: Website as JBJ.AE (display), https://jbj.ae (link)
  website: "https://jbj.ae",
  websiteDisplay: "JBJ.AE",
  location: "Dubai, United Arab Emirates",
  // Social links - Company
  linkedinCompany: "https://www.linkedin.com/company/jbj-global-real-estate/",
  instagramCompany: "https://www.instagram.com/jbj.ae?igsh=NGs2b2cwNnNhb2Vl",
  facebookCompany: "https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr",
  tiktokCompany: "https://www.tiktok.com/@jbj.ae",
  // Social links - Personal (same icons as company)
  linkedinPersonal: "https://www.linkedin.com/in/jane-abou-jaoude-4079201a3?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  instagramPersonal: "https://www.instagram.com/janeboujaoude_?igsh=MWdxNmY4NnFtbnhxZQ==",
  facebookPersonal: "https://www.facebook.com/share/17iiumemGc/?mibextid=wwXIfr",
  tiktokPersonal: "https://www.tiktok.com/@janeboujaoude",
};

// Luxury gold color - LOCKED (Active Champagne, NO YELLOW)
const GOLD = {
  primary: "#C8A766",
  light: "#D4B87A",
  dark: "#A8925A",
  gradient: "linear-gradient(135deg, #C8A766, #D4B87A, #C8A766)",
  // Active Champagne background for icons (NO YELLOW)
  activeBackground: "linear-gradient(135deg, #F5EBD7, #E8DCC8, #D4C4A8)",
};

// Generate Company vCard
const generateCompanyVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:JBJ Global Real Estate
ORG:${CONTACT_INFO.company}
TITLE:Premium Real Estate Brokerage
TEL;TYPE=WORK,VOICE:${CONTACT_INFO.phoneCompany}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:${CONTACT_INFO.websiteDisplay}
ADR;TYPE=WORK:;;Dubai;;UAE;;
X-SOCIALPROFILE;TYPE=linkedin:${CONTACT_INFO.linkedinCompany}
X-SOCIALPROFILE;TYPE=instagram:${CONTACT_INFO.instagramCompany}
X-SOCIALPROFILE;TYPE=tiktok:${CONTACT_INFO.tiktokCompany}
NOTE:Licensed Dubai Real Estate Brokerage - Premium Property Services
END:VCARD`;
};

// Generate Personal vCard
const generatePersonalVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:${CONTACT_INFO.name}
N:Bou Jaoude;Jane;;;
ORG:${CONTACT_INFO.company}
TITLE:${CONTACT_INFO.title}
TEL;TYPE=CELL,VOICE:${CONTACT_INFO.phonePersonal}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:${CONTACT_INFO.websiteDisplay}
ADR;TYPE=WORK:;;Dubai;;UAE;;
X-SOCIALPROFILE;TYPE=linkedin:${CONTACT_INFO.linkedinPersonal}
X-SOCIALPROFILE;TYPE=instagram:${CONTACT_INFO.instagramPersonal}
X-SOCIALPROFILE;TYPE=tiktok:${CONTACT_INFO.tiktokPersonal}
NOTE:Founder & CEO of JBJ Global Real Estate LLC - Licensed Dubai Property Brokerage
END:VCARD`;
};

// Download Company vCard
const downloadCompanyVCard = () => {
  const vcard = generateCompanyVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "JBJ-Global-Real-Estate.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("Company contact saved!");
};

// Download Personal vCard
const downloadPersonalVCard = () => {
  const vcard = generatePersonalVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Jane-Bou-Jaoude.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("Personal contact saved!");
};

// Fast WhatsApp redirect - uses direct protocol
const openWhatsApp = (phone: string) => {
  const message = encodeURIComponent("Hi Jane, I connected via your digital business card.");
  const whatsappUrl = `whatsapp://send?phone=${phone}&text=${message}`;
  
  // Try native first, fallback to web
  window.location.href = whatsappUrl;
  
  // Fallback after short delay if native doesn't work
  setTimeout(() => {
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  }, 300);
};

const DigitalCard = () => {
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Set noindex meta tag - only for this page, preserve existing global tags
  useEffect(() => {
    document.title = `${CONTACT_INFO.name} - Digital Business Card`;
    
    // Track if we created these tags
    let createdRobots = false;
    let createdGooglebot = false;
    let previousRobotsContent: string | null = null;
    let previousGooglebotContent: string | null = null;
    
    // Handle robots meta tag
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (metaRobots) {
      previousRobotsContent = metaRobots.getAttribute("content");
    } else {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
      createdRobots = true;
    }
    metaRobots.setAttribute("content", "noindex, nofollow, noarchive, nosnippet");

    // Handle googlebot meta tag
    let metaGooglebot = document.querySelector('meta[name="googlebot"]') as HTMLMetaElement | null;
    if (metaGooglebot) {
      previousGooglebotContent = metaGooglebot.getAttribute("content");
    } else {
      metaGooglebot = document.createElement("meta");
      metaGooglebot.setAttribute("name", "googlebot");
      document.head.appendChild(metaGooglebot);
      createdGooglebot = true;
    }
    metaGooglebot.setAttribute("content", "noindex, nofollow");

    return () => {
      // Only remove if we created them, otherwise restore previous content
      if (createdRobots && metaRobots) {
        metaRobots.remove();
      } else if (metaRobots && previousRobotsContent !== null) {
        metaRobots.setAttribute("content", previousRobotsContent);
      }
      
      if (createdGooglebot && metaGooglebot) {
        metaGooglebot.remove();
      } else if (metaGooglebot && previousGooglebotContent !== null) {
        metaGooglebot.setAttribute("content", previousGooglebotContent);
      }
    };
  }, []);

  // Handle video end - freeze on first frame (logo visible)
  const handleVideoEnd = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  // Share functions
  const cardUrl = window.location.href;
  const shareText = `Connect with ${CONTACT_INFO.name}, ${CONTACT_INFO.title} at ${CONTACT_INFO.company}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`${CONTACT_INFO.name} - Digital Business Card`);
    const body = encodeURIComponent(`${shareText}\n\n${cardUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`${shareText}\n${cardUrl}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareViaInstagram = () => {
    // Instagram doesn't have direct share URL, copy to clipboard and open
    navigator.clipboard.writeText(cardUrl);
    toast.success("Link copied! Open Instagram to share.");
    window.open("https://instagram.com", "_blank");
  };

  const shareViaSnapchat = () => {
    // Snapchat share
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(cardUrl)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start px-4 py-8 sm:py-12 lg:py-16">
      
      {/* Main Card Container - RESPONSIVE: phone = narrow card, tablet/desktop = wider layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl"
      >
        {/* Card Body - Active Champagne Layer */}
        <div 
          className="rounded-3xl p-1 shadow-2xl"
          style={{ 
            background: GOLD.activeBackground,
            boxShadow: `0 20px 60px rgba(200, 167, 102, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)`
          }}
        >
          {/* Inner Card - Locked Champagne - RESPONSIVE LAYOUT */}
          <div 
            className="rounded-[22px] p-6 sm:p-8 lg:p-10 xl:p-12"
            style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
          >
            {/* Profile Photo - CENTERED INSIDE the card, NOT cropping head */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              {/* Photo container */}
              <div className="relative">
                {/* Glowing ring effect - GOLD only */}
                <div 
                  className="absolute -inset-3 rounded-full opacity-40 blur-xl"
                  style={{ background: GOLD.gradient }}
                />
                
                {/* Photo frame with gold border */}
                <div 
                  className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[4px]"
                  style={{ background: GOLD.gradient }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #EDE4D3, #D4C4A8)' }}>
                    {/* FIXED: objectPosition top to show full head/hairline without cropping */}
                    <img
                      src={janePhoto}
                      alt={`${CONTACT_INFO.name} - ${CONTACT_INFO.title}`}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "center top" }}
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>
                </div>

                {/* Verified badge - GOLD */}
                <div 
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  style={{ background: GOLD.gradient }}
                >
                  <Star className="w-4 h-4 text-black fill-black" />
                </div>
              </div>
            </motion.div>

            {/* Name Section - Inside the card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <Link to="/founder" className="group inline-block">
                <h1 className="text-2xl sm:text-3xl font-bold text-black group-hover:text-[#C8A766] transition-colors">
                  {CONTACT_INFO.name}
                </h1>
                <p 
                  className="text-xl sm:text-2xl font-arabic mt-2 font-semibold"
                  style={{ color: GOLD.primary }}
                >
                  {CONTACT_INFO.nameArabic}
                </p>
              </Link>
            </motion.div>
          
            {/* Title & Company */}
            <div 
              className="text-center mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                style={{ 
                  background: GOLD.activeBackground,
                  border: `2px solid ${GOLD.primary}50`
                }}
              >
                <Briefcase className="w-4 h-4" style={{ color: GOLD.primary }} />
                <span className="text-sm font-semibold text-black">{CONTACT_INFO.title}</span>
              </div>
              <Link 
                to="/about"
                className="flex items-center justify-center gap-2 transition-colors group"
                style={{ color: GOLD.primary }}
              >
                <Building2 className="w-4 h-4" />
                <span className="font-medium group-hover:underline">{CONTACT_INFO.company}</span>
              </Link>
              <div className="flex items-center justify-center gap-2 mt-2 text-black/60">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{CONTACT_INFO.location}</span>
              </div>
            </div>

            {/* Professional Intro */}
            <div 
              className="text-center mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <p className="text-sm sm:text-base text-black/80 leading-relaxed">
                A licensed Dubai brokerage delivering <span className="font-semibold text-black">investor-led real estate advisory</span>, market intelligence, and end-to-end property execution across the UAE.
              </p>
            </div>

            {/* Video Introduction - Self-hosted MP4 for fast loading */}
            <div 
              className="mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" style={{ color: GOLD.primary }} />
                Company Introduction
              </h3>
              <div 
                className="relative rounded-2xl overflow-hidden bg-black aspect-video"
                style={{ border: `2px solid ${GOLD.primary}40` }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  controls
                  poster={jbjMonogramLightTransparent}
                  preload="none"
                  onEnded={handleVideoEnd}
                  playsInline
                >
                  <source src={jbjIntroVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* COMPANY CONTACT SECTION */}
            <div 
              className="mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <h3 className="text-xs font-semibold text-black/50 mb-3 uppercase tracking-wider text-center">
                Company Line
              </h3>
              
              {/* Company Phone Display */}
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-black">{CONTACT_INFO.phoneCompany}</p>
              </div>

              {/* Company Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {/* Call Company */}
                <a
                  href={`tel:${CONTACT_INFO.phoneCompanyClean}`}
                  className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <Phone className="w-4 h-4" style={{ color: GOLD.primary }} />
                  <span className="text-sm">Call</span>
                </a>

                {/* WhatsApp Company */}
                <button
                  onClick={() => openWhatsApp(CONTACT_INFO.whatsappCompany)}
                  className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  style={{ border: `2px solid #25D36650` }}
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span className="text-sm">WhatsApp</span>
                </button>
              </div>

              {/* Save Company Contact */}
              <button
                onClick={downloadCompanyVCard}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-black font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                style={{ 
                  background: GOLD.gradient,
                  border: `2px solid ${GOLD.primary}`,
                }}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Save Company Contact</span>
              </button>
            </div>

            {/* PERSONAL CONTACT SECTION */}
            <div 
              className="mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <h3 className="text-xs font-semibold text-black/50 mb-3 uppercase tracking-wider text-center">
                Personal Line
              </h3>
              
              {/* Personal Phone Display */}
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-black">{CONTACT_INFO.phonePersonal}</p>
              </div>

              {/* Personal Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {/* Call Personal */}
                <a
                  href={`tel:${CONTACT_INFO.phonePersonalClean}`}
                  className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <Phone className="w-4 h-4" style={{ color: GOLD.primary }} />
                  <span className="text-sm">Call</span>
                </a>

                {/* WhatsApp Personal */}
                <button
                  onClick={() => openWhatsApp(CONTACT_INFO.whatsappPersonal)}
                  className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                  style={{ border: `2px solid #25D36650` }}
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span className="text-sm">WhatsApp</span>
                </button>
              </div>

              {/* Save Personal Contact */}
              <button
                onClick={downloadPersonalVCard}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-black font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                style={{ 
                  background: GOLD.gradient,
                  border: `2px solid ${GOLD.primary}`,
                }}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Save Personal Contact</span>
              </button>
            </div>

            {/* Email - Clickable with mailto: */}
            <a
              href={`mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent("Inquiry via Digital Business Card")}`}
              className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group mb-3"
              style={{ border: `2px solid ${GOLD.primary}50` }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ 
                  background: GOLD.activeBackground,
                  border: `1px solid ${GOLD.primary}50`
                }}
              >
                <Mail className="w-5 h-5" style={{ color: GOLD.primary }} />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Send Email</span>
                <span className="text-xs text-black/50">{CONTACT_INFO.emailDisplay}</span>
              </div>
            </a>

            {/* Website */}
            <a
              href={CONTACT_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group mb-3"
              style={{ border: `2px solid ${GOLD.primary}50` }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{ 
                  background: GOLD.activeBackground,
                  border: `1px solid ${GOLD.primary}50`
                }}
              >
                <Globe className="w-5 h-5" style={{ color: GOLD.primary }} />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Website</span>
                <span className="text-xs text-black/50">{CONTACT_INFO.websiteDisplay}</span>
              </div>
            </a>

            {/* Social Links Section */}
            <div 
              className="pt-4 mt-4"
              style={{ borderTop: `1px solid ${GOLD.primary}33` }}
            >
              <p className="text-xs text-black/50 text-center mb-3 uppercase tracking-wider font-medium">Connect With Us</p>
              
              {/* Company Socials */}
              <p className="text-xs text-black/40 text-center mb-2">JBJ Global Real Estate</p>
              <div className="flex justify-center gap-3 mb-4">
                <a
                  href={CONTACT_INFO.linkedinCompany}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaLinkedinIn className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.instagramCompany}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaInstagram className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.tiktokCompany}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaTiktok className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.facebookCompany}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaFacebookF className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
              </div>

              {/* Personal Socials - Same icons as company: LinkedIn, Instagram, Facebook, TikTok */}
              <p className="text-xs text-black/40 text-center mb-2">Jane Bou Jaoude</p>
              <div className="flex justify-center gap-3">
                <a
                  href={CONTACT_INFO.linkedinPersonal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaLinkedinIn className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.instagramPersonal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaInstagram className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.facebookPersonal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaFacebookF className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
                <a
                  href={CONTACT_INFO.tiktokPersonal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaTiktok className="w-5 h-5" style={{ color: GOLD.primary }} />
                </a>
              </div>
            </div>

            {/* Share Card Button */}
            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${GOLD.primary}33` }}>
              <button
                onClick={() => setShowShareOptions(true)}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-black text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                style={{ border: `2px solid ${GOLD.primary}` }}
              >
                <Share2 className="w-5 h-5" style={{ color: GOLD.primary }} />
                <span>Share This Card</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share Options Modal */}
      <AnimatePresence>
        {showShareOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowShareOptions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black">Share This Card</h3>
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" style={{ color: GOLD.primary }} />}
                  <span className="font-medium text-black">{copied ? "Copied!" : "Copy Link"}</span>
                </button>

                {/* Share via WhatsApp */}
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  <span className="font-medium text-black">Share via WhatsApp</span>
                </button>

                {/* Share via Email */}
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <Mail className="w-5 h-5" style={{ color: GOLD.primary }} />
                  <span className="font-medium text-black">Share via Email</span>
                </button>

                {/* Share via Instagram */}
                <button
                  onClick={shareViaInstagram}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaInstagram className="w-5 h-5" style={{ color: GOLD.primary }} />
                  <span className="font-medium text-black">Share via Instagram</span>
                </button>

                {/* Share via Snapchat */}
                <button
                  onClick={shareViaSnapchat}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <FaSnapchatGhost className="w-5 h-5" style={{ color: "#FFFC00" }} />
                  <span className="font-medium text-black">Share via Snapchat</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Options Modal - Simplified (no longer needed since we have direct call buttons) */}
      <AnimatePresence>
        {showCallOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCallOptions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black">Choose a Line</h3>
                <button
                  onClick={() => setShowCallOptions(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Company Line */}
                <a
                  href={`tel:${CONTACT_INFO.phoneCompanyClean}`}
                  onClick={() => setShowCallOptions(false)}
                  className="w-full flex items-center gap-3 py-4 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: GOLD.activeBackground, border: `1px solid ${GOLD.primary}50` }}
                  >
                    <Building2 className="w-6 h-6" style={{ color: GOLD.primary }} />
                  </div>
                  <div>
                    <span className="block font-semibold text-black">Company Line</span>
                    <span className="text-sm text-black/60">{CONTACT_INFO.phoneCompany}</span>
                  </div>
                </a>

                {/* Personal Line */}
                <a
                  href={`tel:${CONTACT_INFO.phonePersonalClean}`}
                  onClick={() => setShowCallOptions(false)}
                  className="w-full flex items-center gap-3 py-4 px-4 rounded-xl bg-white shadow-md hover:shadow-lg transition-all"
                  style={{ border: `2px solid ${GOLD.primary}50` }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: GOLD.activeBackground, border: `1px solid ${GOLD.primary}50` }}
                  >
                    <PhoneCall className="w-6 h-6" style={{ color: GOLD.primary }} />
                  </div>
                  <div>
                    <span className="block font-semibold text-black">Personal Line</span>
                    <span className="text-sm text-black/60">{CONTACT_INFO.phonePersonal}</span>
                  </div>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalCard;
