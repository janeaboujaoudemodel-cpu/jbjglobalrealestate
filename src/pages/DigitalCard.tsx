import { useEffect, useState } from "react";
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

// Contact info constants - LOCKED (from BRAND_LOCK)
// CASING RULE: JBJ.AE, Contact@JBJ.AE - EXACTLY as specified
const CONTACT_INFO = {
  // LOCKED: English name
  name: "Jane Bou Jaoude",
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
  phone: "+971 56 591 1000",
  phoneClean: "+971565911000",
  whatsapp: "+971565911000",
  // LOCKED: Website as JBJ.AE (display), https://jbj.ae (link)
  website: "https://jbj.ae",
  websiteDisplay: "JBJ.AE",
  location: "Dubai, United Arab Emirates",
  // Social links - Company
  linkedinCompany: "https://linkedin.com/company/jbjglobalrealestate",
  instagramCompany: "https://instagram.com/jbj.ae",
  facebookCompany: "https://facebook.com/jbjglobalrealestate",
  tiktokCompany: "https://tiktok.com/@jbj.ae",
  // Social links - Personal (same icons as company)
  linkedinPersonal: "https://linkedin.com/in/janeboujaoude",
  instagramPersonal: "https://instagram.com/janeboujaoude_",
  facebookPersonal: "https://facebook.com/janeboujaoude",
  tiktokPersonal: "https://tiktok.com/@janeboujaoude",
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

// Generate vCard content - FIXED with correct name and clean data
const generateVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:${CONTACT_INFO.name}
N:Bou Jaoude;Jane;;;
ORG:${CONTACT_INFO.company}
TITLE:${CONTACT_INFO.title}
TEL;TYPE=CELL,VOICE:${CONTACT_INFO.phone}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:${CONTACT_INFO.websiteDisplay}
ADR;TYPE=WORK:;;Dubai;;UAE;;
NOTE:Founder & CEO of JBJ Global Real Estate LLC - Licensed Dubai Property Brokerage
END:VCARD`;
};

// Download vCard
const downloadVCard = () => {
  const vcard = generateVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Jane-Bou-Jaoude.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Fast WhatsApp redirect - uses direct protocol
const openWhatsApp = () => {
  const message = encodeURIComponent("Hi Jane, I connected via your digital business card.");
  const whatsappUrl = `whatsapp://send?phone=${CONTACT_INFO.whatsapp.replace(/\+/g, "")}&text=${message}`;
  
  // Try native first, fallback to web
  window.location.href = whatsappUrl;
  
  // Fallback after short delay if native doesn't work
  setTimeout(() => {
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, "")}?text=${message}`, "_blank");
  }, 300);
};

const DigitalCard = () => {
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set noindex meta tag
  useEffect(() => {
    document.title = `${CONTACT_INFO.name} - Digital Business Card`;
    
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", "noindex, nofollow");

    return () => {
      metaRobots?.remove();
    };
  }, []);

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-start px-4 py-8 sm:py-12">
      
      {/* Main Card Container - Photo is INSIDE the card, centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card Body - Active Champagne Layer */}
        <div 
          className="rounded-3xl p-1 shadow-2xl"
          style={{ 
            background: GOLD.activeBackground,
            boxShadow: `0 20px 60px rgba(200, 167, 102, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2)`
          }}
        >
          {/* Inner Card - Locked Champagne */}
          <div 
            className="rounded-[22px] p-6 sm:p-8"
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
                  <div className="w-full h-full rounded-full overflow-hidden bg-black">
                    {/* FIXED: objectPosition to show full head, not cropped */}
                    <img
                      src={janePhoto}
                      alt={`${CONTACT_INFO.name} - ${CONTACT_INFO.title}`}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "center 35%" }}
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

            {/* Video Introduction */}
            <div 
              className="mb-6 pb-6"
              style={{ borderBottom: `1px solid ${GOLD.primary}33` }}
            >
              <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                <Video className="w-4 h-4" style={{ color: GOLD.primary }} />
                Company Introduction
              </h3>
              <div 
                className="relative rounded-2xl overflow-hidden bg-black/5 aspect-video"
                style={{ border: `2px solid ${GOLD.primary}40` }}
              >
                <iframe
                  className="w-full h-full"
                  src="about:blank"
                  data-src="https://www.youtube.com/embed/VIDEO_ID"
                  title="Company Introduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Placeholder overlay - Using Active Champagne for icon bg, NOT YELLOW */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60">
                  <div className="text-center">
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg"
                      style={{ background: GOLD.activeBackground, border: `2px solid ${GOLD.primary}` }}
                    >
                      <Video className="w-6 h-6" style={{ color: GOLD.primary }} />
                    </div>
                    <p className="text-white/70 text-xs">Video Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="space-y-3">
              {/* Save Contact - Primary Gold Button */}
              <button
                onClick={downloadVCard}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl text-black font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                style={{ 
                  background: GOLD.gradient,
                  border: `2px solid ${GOLD.primary}`,
                  boxShadow: `0 4px 14px ${GOLD.primary}60`
                }}
              >
                <Download className="w-5 h-5" />
                <span>Save to Contacts</span>
              </button>

              {/* Call - Shows all options */}
              <button
                onClick={() => setShowCallOptions(true)}
                className="w-full flex items-center justify-between py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
                style={{ border: `2px solid ${GOLD.primary}50` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD.primary;
                  e.currentTarget.style.background = "linear-gradient(135deg, #FDFBF7, #F5F0E6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                  e.currentTarget.style.background = "white";
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{ 
                      background: "linear-gradient(135deg, #F5EBD7, #E8DCC8)",
                      border: `1px solid ${GOLD.primary}50`
                    }}
                  >
                    <Phone className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold">Call</span>
                    <span className="text-xs text-black/50">{CONTACT_INFO.phone}</span>
                  </div>
                </div>
                <span className="text-sm" style={{ color: GOLD.primary }}>Tap for options</span>
              </button>

              {/* WhatsApp - Fast redirect */}
              <button
                onClick={openWhatsApp}
                className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
                style={{ border: `2px solid ${GOLD.primary}50` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    background: "linear-gradient(135deg, #25D36620, #25D36610)",
                    border: "1px solid #25D36650"
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">WhatsApp</span>
                  <span className="text-xs text-black/50">Send a message</span>
                </div>
              </button>

              {/* Email - Clickable with mailto: */}
              <a
                href={`mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent("Inquiry via Digital Business Card")}`}
                className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
                style={{ border: `2px solid ${GOLD.primary}50` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                }}
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
                className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white text-black font-medium shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
                style={{ border: `2px solid ${GOLD.primary}50` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = GOLD.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                }}
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
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaLinkedinIn className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.instagramCompany}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaInstagram className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.tiktokCompany}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaTiktok className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.facebookCompany}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
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
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaLinkedinIn className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.instagramPersonal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaInstagram className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.facebookPersonal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaFacebookF className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                  <a
                    href={CONTACT_INFO.tiktokPersonal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    style={{ 
                      background: "white",
                      border: `2px solid ${GOLD.primary}50`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD.gradient;
                      e.currentTarget.style.borderColor = GOLD.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = `${GOLD.primary}50`;
                    }}
                  >
                    <FaTiktok className="w-5 h-5" style={{ color: GOLD.primary }} />
                  </a>
                </div>
              </div>

              {/* Share Button - Opens share options modal */}
              <button
                onClick={() => setShowShareOptions(true)}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-black/5 border border-black/10 text-black/70 font-medium hover:bg-black/10 transition-all active:scale-[0.98] mt-4"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share this Card</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Powered by */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-white/30">
          Powered by <span style={{ color: `${GOLD.primary}99` }}>JBJ Global Real Estate</span>
        </p>
      </motion.div>

      {/* Call Options Modal - Full iOS-style options */}
      <AnimatePresence>
        {showCallOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCallOptions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
            >
              {/* Header */}
              <div 
                className="p-5"
                style={{ 
                  borderBottom: `1px solid ${GOLD.primary}33`,
                  background: "linear-gradient(135deg, #F5EBD7, #E8DCC8)"
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-black text-lg">Contact Options</h3>
                    <p className="text-sm text-black/60">{CONTACT_INFO.phone}</p>
                  </div>
                  <button
                    onClick={() => setShowCallOptions(false)}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-black/60" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-3 space-y-2">
                {/* Mobile Call */}
                <a
                  href={`tel:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34C759] to-[#30B350] flex items-center justify-center shadow-md">
                    <PhoneCall className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Mobile Call</p>
                    <p className="text-sm text-black/60">Direct phone call</p>
                  </div>
                </a>

                {/* FaceTime Audio */}
                <a
                  href={`facetime-audio:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34C759] to-[#30B350] flex items-center justify-center shadow-md">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">FaceTime Audio</p>
                    <p className="text-sm text-black/60">iOS voice call</p>
                  </div>
                </a>

                {/* FaceTime Video */}
                <a
                  href={`facetime:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#34C759] to-[#30B350] flex items-center justify-center shadow-md">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">FaceTime Video</p>
                    <p className="text-sm text-black/60">iOS video call</p>
                  </div>
                </a>

                {/* WhatsApp Call */}
                <button
                  onClick={() => {
                    setShowCallOptions(false);
                    openWhatsApp();
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">WhatsApp</p>
                    <p className="text-sm text-black/60">Voice or video call</p>
                  </div>
                </button>

                {/* Send SMS */}
                <a
                  href={`sms:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#0056B3] flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Send SMS</p>
                    <p className="text-sm text-black/60">Text message</p>
                  </div>
                </a>

                {/* Copy Number */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTACT_INFO.phone);
                    setShowCallOptions(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = GOLD.primary}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = `${GOLD.primary}33`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E8E93] to-[#636366] flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Copy Number</p>
                    <p className="text-sm text-black/60">{CONTACT_INFO.phone}</p>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="p-3 pt-0">
                <button
                  onClick={() => setShowCallOptions(false)}
                  className="w-full py-4 rounded-2xl bg-white text-black font-semibold hover:bg-black/5 transition-colors"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Options Modal */}
      <AnimatePresence>
        {showShareOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowShareOptions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
            >
              {/* Header */}
              <div 
                className="p-5"
                style={{ 
                  borderBottom: `1px solid ${GOLD.primary}33`,
                  background: GOLD.activeBackground
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-black text-lg">Share This Card</h3>
                    <p className="text-sm text-black/60">Choose how to share</p>
                  </div>
                  <button
                    onClick={() => setShowShareOptions(false)}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-black/60" />
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div className="p-3 space-y-2">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: GOLD.activeBackground, border: `2px solid ${GOLD.primary}` }}
                  >
                    {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" style={{ color: GOLD.primary }} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">{copied ? "Copied!" : "Copy Link"}</p>
                    <p className="text-sm text-black/60">Copy card link to clipboard</p>
                  </div>
                </button>

                {/* Email */}
                <button
                  onClick={shareViaEmail}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: GOLD.activeBackground, border: `2px solid ${GOLD.primary}` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: GOLD.primary }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Share via Email</p>
                    <p className="text-sm text-black/60">Send in an email</p>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Share via WhatsApp</p>
                    <p className="text-sm text-black/60">Send to a contact</p>
                  </div>
                </button>

                {/* Instagram */}
                <button
                  onClick={shareViaInstagram}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shadow-md">
                    <FaInstagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Share via Instagram</p>
                    <p className="text-sm text-black/60">Copy link & open Instagram</p>
                  </div>
                </button>

                {/* Snapchat */}
                <button
                  onClick={shareViaSnapchat}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white transition-all hover:shadow-md text-left"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFFC00] flex items-center justify-center shadow-md">
                    <FaSnapchatGhost className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">Share via Snapchat</p>
                    <p className="text-sm text-black/60">Send to Snapchat</p>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="p-3 pt-0">
                <button
                  onClick={() => setShowShareOptions(false)}
                  className="w-full py-4 rounded-2xl bg-white text-black font-semibold hover:bg-black/5 transition-colors"
                  style={{ border: `1px solid ${GOLD.primary}33` }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalCard;
