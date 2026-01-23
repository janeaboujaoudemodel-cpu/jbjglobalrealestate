import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Globe, Share2, Download, MessageCircle, Video, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import CEO photo - same as used in team/leadership
import janePhoto from '@/assets/ceo/jane-ceo-private-jet.jpg';

// Contact info constants
const CONTACT_INFO = {
  name: "Jane Bou Jaoude",
  nameArabic: "جاين بو جودة",
  title: "Founder & CEO",
  company: "JBJ Global Real Estate LLC",
  email: "jane@jbj.ae",
  phone: "+971 4 123 4567",
  phoneClean: "+97141234567",
  whatsapp: "+971501234567",
  website: "https://jbj.ae",
};

// Generate vCard content
const generateVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:${CONTACT_INFO.name}
N:Bou Jaoude;Jane;;;
ORG:${CONTACT_INFO.company}
TITLE:${CONTACT_INFO.title}
TEL;TYPE=WORK,VOICE:${CONTACT_INFO.phone}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:${CONTACT_INFO.website}
NOTE:Founder & CEO of JBJ Global Real Estate LLC - Dubai Property Brokerage
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
    text: `Contact ${CONTACT_INFO.name}, ${CONTACT_INFO.title} at ${CONTACT_INFO.company}`,
    url: window.location.href,
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or error
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href);
  }
};

const DigitalCard = () => {
  const [showCallOptions, setShowCallOptions] = useState(false);

  // Set noindex meta tag
  useEffect(() => {
    // Set page title
    document.title = `${CONTACT_INFO.name} - Digital Business Card`;
    
    // Add noindex meta
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", "noindex, nofollow");

    return () => {
      // Cleanup: remove noindex on unmount
      metaRobots?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        {/* Profile Image - Circular with gold border */}
        <div className="relative mx-auto mb-6 w-32 h-32 sm:w-40 sm:h-40">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#C5A028] to-[#B8960F] p-[3px]">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img
                src={janePhoto}
                alt={`${CONTACT_INFO.name} - ${CONTACT_INFO.title}`}
                className="w-full h-full object-cover object-top scale-125"
                style={{ objectPosition: "center 20%" }}
              />
            </div>
          </div>
        </div>

        {/* Name - Bilingual, clickable */}
        <Link
          to="/founder"
          className="inline-block group"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-black group-hover:text-[#C5A028] transition-colors">
            {CONTACT_INFO.name}
          </h1>
          <p className="text-lg sm:text-xl text-black/70 font-arabic mt-1 group-hover:text-[#C5A028] transition-colors">
            {CONTACT_INFO.nameArabic}
          </p>
        </Link>

        {/* Title */}
        <p className="text-base sm:text-lg text-black/80 mt-3 font-medium">
          {CONTACT_INFO.title}
        </p>

        {/* Company - clickable */}
        <Link
          to="/about"
          className="text-sm sm:text-base text-[#C5A028] hover:text-[#D4AF37] transition-colors mt-1 inline-block"
        >
          {CONTACT_INFO.company}
        </Link>
      </motion.div>

      {/* Professional Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-md text-center mb-8 px-4"
      >
        <p className="text-sm sm:text-base text-black/70 leading-relaxed">
          Founder & CEO of JBJ Global Real Estate LLC. A licensed Dubai brokerage delivering investor-led real estate advisory, market intelligence, and end-to-end property execution across the UAE.
        </p>
      </motion.div>

      {/* Video Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md mb-8 px-4"
      >
        <div className="relative rounded-2xl overflow-hidden bg-black/5 aspect-video shadow-lg border border-[#D4AF37]/20">
          {/* YouTube Placeholder - Replace VIDEO_ID with actual YouTube ID */}
          <iframe
            className="w-full h-full"
            src="about:blank"
            data-src="https://www.youtube.com/embed/VIDEO_ID"
            title="Company Introduction"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* Placeholder overlay until video is provided */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <Video className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/80 text-sm">Video Coming Soon</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-black/50 mt-2">Company Introduction</p>
      </motion.div>

      {/* Contact Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md px-4 space-y-3"
      >
        {/* Save Contact */}
        <button
          onClick={downloadVCard}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A028] to-[#B8960F] text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Download className="w-5 h-5" />
          <span>Save Contact</span>
        </button>

        {/* Call Button - Opens options */}
        <button
          onClick={() => setShowCallOptions(true)}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] transition-all active:scale-[0.98]"
        >
          <Phone className="w-5 h-5 text-[#C5A028]" />
          <span>Call</span>
        </button>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, "")}?text=${encodeURIComponent("Hi Jane, I came from your digital business card.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] transition-all active:scale-[0.98]"
        >
          <MessageCircle className="w-5 h-5 text-[#25D366]" />
          <span>WhatsApp</span>
        </a>

        {/* Email */}
        <a
          href={`mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent("Contact via Digital Business Card")}`}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] transition-all active:scale-[0.98]"
        >
          <Mail className="w-5 h-5 text-[#C5A028]" />
          <span>Email</span>
        </a>

        {/* Website */}
        <Link
          to="/"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] transition-all active:scale-[0.98]"
        >
          <Globe className="w-5 h-5 text-[#C5A028]" />
          <span>Website</span>
        </Link>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-white border-2 border-[#D4AF37]/30 text-black font-medium shadow-md hover:shadow-lg hover:border-[#D4AF37] transition-all active:scale-[0.98]"
        >
          <Share2 className="w-5 h-5 text-[#C5A028]" />
          <span>Share</span>
        </button>
      </motion.div>

      {/* Powered by */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-10 text-center"
      >
        <p className="text-xs text-black/40">
          Powered by JBJ Global Real Estate
        </p>
      </motion.div>

      {/* Call Options Modal */}
      <AnimatePresence>
        {showCallOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCallOptions(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-black">Call Options</h3>
                <button
                  onClick={() => setShowCallOptions(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-black/60" />
                </button>
              </div>
              <div className="p-2 space-y-1">
                {/* Mobile Call */}
                <a
                  href={`tel:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5 text-[#34C759]" />
                  </div>
                  <div>
                    <p className="font-medium text-black">Mobile Call</p>
                    <p className="text-sm text-black/60">{CONTACT_INFO.phone}</p>
                  </div>
                </a>

                {/* FaceTime (iOS) */}
                <a
                  href={`facetime:${CONTACT_INFO.phoneClean}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-[#34C759]" />
                  </div>
                  <div>
                    <p className="font-medium text-black">FaceTime</p>
                    <p className="text-sm text-black/60">iOS devices only</p>
                  </div>
                </a>

                {/* WhatsApp Call */}
                <a
                  href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\+/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <p className="font-medium text-black">WhatsApp Call</p>
                    <p className="text-sm text-black/60">Voice or video</p>
                  </div>
                </a>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCallOptions(false)}
                  className="w-full py-3 text-center text-black/60 font-medium hover:text-black transition-colors"
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
