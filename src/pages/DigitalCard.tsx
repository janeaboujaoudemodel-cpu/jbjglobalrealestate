import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Phone, Mail, Globe, Share2, Download, MessageCircle, Video, 
  PhoneCall, X, MapPin, Building2, Linkedin, Instagram, 
  Calendar, Briefcase, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import CEO photo - same as used in team/leadership
import janePhoto from '@/assets/ceo/jane-ceo-private-jet.jpg';

// Contact info constants - LOCKED
const CONTACT_INFO = {
  name: "Jane Bou Jaoude",
  nameArabic: "جاين بو جودة",
  title: "Founder & CEO",
  company: "JBJ Global Real Estate LLC",
  email: "contact@jbj.ae",
  phone: "+971 56 591 1000",
  phoneClean: "+971565911000",
  whatsapp: "+971565911000",
  website: "https://jbj.ae",
  location: "Dubai, United Arab Emirates",
  linkedin: "https://linkedin.com/company/jbjglobalrealestate",
  instagram: "https://instagram.com/jbjglobalrealestate",
};

// Generate vCard content
const generateVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:${CONTACT_INFO.name}
N:Bou Jaoude;Jane;;;
ORG:${CONTACT_INFO.company}
TITLE:${CONTACT_INFO.title}
TEL;TYPE=CELL,VOICE:${CONTACT_INFO.phone}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:${CONTACT_INFO.website}
ADR;TYPE=WORK:;;Dubai;;UAE;;
NOTE:Founder & CEO of JBJ Global Real Estate LLC - Licensed Dubai Property Brokerage. Investor-led real estate advisory, market intelligence, and end-to-end property execution across the UAE.
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

// Native share
const handleShare = async () => {
  const shareData = {
    title: `${CONTACT_INFO.name} - ${CONTACT_INFO.title}`,
    text: `Connect with ${CONTACT_INFO.name}, ${CONTACT_INFO.title} at ${CONTACT_INFO.company}`,
    url: window.location.href,
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or error
    }
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
};

const DigitalCard = () => {
  const [showCallOptions, setShowCallOptions] = useState(false);

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

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start px-4 py-8 sm:py-12">
      {/* Profile Photo Section - On Black Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6"
      >
        {/* Glowing ring effect */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#C5A028] to-[#B8960F] opacity-40 blur-lg" />
        
        {/* Photo frame with gold border */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-[4px] bg-gradient-to-br from-[#D4AF37] via-[#C5A028] to-[#B8960F]">
          <div className="w-full h-full rounded-full overflow-hidden bg-black">
            <img
              src={janePhoto}
              alt={`${CONTACT_INFO.name} - ${CONTACT_INFO.title}`}
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 30%" }}
            />
          </div>
        </div>

        {/* Verified badge */}
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960F] flex items-center justify-center shadow-lg border-2 border-black">
          <Star className="w-5 h-5 text-black fill-black" />
        </div>
      </motion.div>

      {/* Name on Black Background */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-6"
      >
        <Link to="/founder" className="group">
          <h1 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-[#D4AF37] transition-colors">
            {CONTACT_INFO.name}
          </h1>
          <p className="text-lg sm:text-xl text-[#D4AF37] font-arabic mt-1">
            {CONTACT_INFO.nameArabic}
          </p>
        </Link>
      </motion.div>

      {/* Main Content Card - Active Champagne Layer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] p-1 shadow-2xl"
      >
        {/* Inner Card - Locked Champagne */}
        <div className="rounded-[22px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-6 sm:p-8">
          
          {/* Title & Company */}
          <div className="text-center mb-6 pb-6 border-b border-[#D4AF37]/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#B8960F]/10 border border-[#D4AF37]/30 mb-3">
              <Briefcase className="w-4 h-4 text-[#C5A028]" />
              <span className="text-sm font-semibold text-black">{CONTACT_INFO.title}</span>
            </div>
            <Link 
              to="/about"
              className="flex items-center justify-center gap-2 text-[#C5A028] hover:text-[#D4AF37] transition-colors group"
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
          <div className="text-center mb-6 pb-6 border-b border-[#D4AF37]/20">
            <p className="text-sm sm:text-base text-black/80 leading-relaxed">
              A licensed Dubai brokerage delivering <span className="font-semibold text-black">investor-led real estate advisory</span>, market intelligence, and end-to-end property execution across the UAE.
            </p>
          </div>

          {/* Video Introduction */}
          <div className="mb-6 pb-6 border-b border-[#D4AF37]/20">
            <h3 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#C5A028]" />
              Company Introduction
            </h3>
            <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-video border-2 border-[#D4AF37]/20">
              <iframe
                className="w-full h-full"
                src="about:blank"
                data-src="https://www.youtube.com/embed/VIDEO_ID"
                title="Company Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* Placeholder overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960F] flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Video className="w-6 h-6 text-black" />
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
              className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#B8960F] text-black font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] border-2 border-[#D4AF37]"
              style={{ boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)' }}
            >
              <Download className="w-5 h-5" />
              <span>Save to Contacts</span>
            </button>

            {/* Call - Shows all options */}
            <button
              onClick={() => setShowCallOptions(true)}
              className="w-full flex items-center justify-between py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:to-[#F5F0E6] transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center border border-[#D4AF37]/30 group-hover:from-[#D4AF37] group-hover:to-[#B8960F] transition-all">
                  <Phone className="w-5 h-5 text-[#C5A028] group-hover:text-black transition-colors" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold">Call</span>
                  <span className="text-xs text-black/50">{CONTACT_INFO.phone}</span>
                </div>
              </div>
              <span className="text-[#C5A028] text-sm">Tap for options</span>
            </button>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, "")}?text=${encodeURIComponent("Hi Jane, I connected via your digital business card.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/30 group-hover:bg-[#25D366] transition-all">
                <MessageCircle className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <span className="block font-semibold">WhatsApp</span>
                <span className="text-xs text-black/50">Send a message</span>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent("Inquiry via Digital Business Card")}`}
              className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:to-[#F5F0E6] transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center border border-[#D4AF37]/30 group-hover:from-[#D4AF37] group-hover:to-[#B8960F] transition-all">
                <Mail className="w-5 h-5 text-[#C5A028] group-hover:text-black transition-colors" />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Email</span>
                <span className="text-xs text-black/50">{CONTACT_INFO.email}</span>
              </div>
            </a>

            {/* Website */}
            <Link
              to="/"
              className="w-full flex items-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:to-[#F5F0E6] transition-all active:scale-[0.98] group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center border border-[#D4AF37]/30 group-hover:from-[#D4AF37] group-hover:to-[#B8960F] transition-all">
                <Globe className="w-5 h-5 text-[#C5A028] group-hover:text-black transition-colors" />
              </div>
              <div className="text-left">
                <span className="block font-semibold">Website</span>
                <span className="text-xs text-black/50">jbj.ae</span>
              </div>
            </Link>

            {/* Social Links Row */}
            <div className="flex gap-3 pt-2">
              <a
                href={CONTACT_INFO.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#0A66C2] hover:bg-[#0A66C2]/5 transition-all active:scale-[0.98] group"
              >
                <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                <span className="text-sm">LinkedIn</span>
              </a>
              <a
                href={CONTACT_INFO.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#E4405F] hover:bg-[#E4405F]/5 transition-all active:scale-[0.98] group"
              >
                <Instagram className="w-5 h-5 text-[#E4405F]" />
                <span className="text-sm">Instagram</span>
              </a>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl bg-black/5 border border-black/10 text-black/70 font-medium hover:bg-black/10 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share this Card</span>
            </button>
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
          Powered by <span className="text-[#D4AF37]/60">JBJ Global Real Estate</span>
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
              className="w-full max-w-sm bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#D4AF37]/20 bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8]">
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
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-md transition-all group"
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
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-md transition-all group"
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
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-md transition-all group"
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
                <a
                  href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#25D366] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-black">WhatsApp</p>
                    <p className="text-sm text-black/60">Voice or video call</p>
                  </div>
                </a>

                {/* Send SMS */}
                <a
                  href={`sms:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-md transition-all group"
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
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E8E93] to-[#636366] flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-black">Copy Number</p>
                    <p className="text-sm text-black/60">{CONTACT_INFO.phone}</p>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <div className="p-3 pt-0">
                <button
                  onClick={() => setShowCallOptions(false)}
                  className="w-full py-4 rounded-2xl bg-white border border-[#D4AF37]/20 text-black font-semibold hover:bg-black/5 transition-colors"
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
