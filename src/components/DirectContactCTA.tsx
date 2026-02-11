/**
 * DirectContactCTA Component - Standardized Contact Section for ALL Pages
 * Features: WhatsApp, Call, Email buttons + Save Contact with full vCard
 * 
 * 🔒 LOCKED COMPONENT - This component is used globally across all pages.
 * DO NOT MODIFY without reviewing impact on all service, guide, and hub pages.
 * Any changes must maintain the same props interface and visual consistency.
 */

import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Download, Share2 } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { toast } from "sonner";
import { FaLinkedinIn, FaInstagram, FaGlobe, FaTiktok } from "react-icons/fa";
import { useLanguage } from "@/contexts/LanguageContext";

// Social links
const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/jbj-global-real-estate/",
  instagram: "https://www.instagram.com/jbj.global/",
  tiktok: "https://www.tiktok.com/@jbj.global",
  website: "https://jbj.ae",
};

// Generate comprehensive vCard with all contact details
const generateComprehensiveVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
N:;JBJ Global Real Estate;;;
FN:JBJ Global Real Estate
ORG:JBJ Global Real Estate L.L.C S.O.C.
TITLE:Premium Real Estate Brokerage
TEL;TYPE=CELL,VOICE:${CONTACT_INFO.phone}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
EMAIL;TYPE=WORK:${CONTACT_INFO.supportEmail}
URL:${SOCIAL_LINKS.website}
URL;TYPE=LINKEDIN:${SOCIAL_LINKS.linkedin}
URL;TYPE=INSTAGRAM:${SOCIAL_LINKS.instagram}
ADR;TYPE=WORK:;;Downtown Dubai;Dubai;;UAE
NOTE:Dubai's Premium Real Estate Brokerage - RERA Licensed. Founded by Jane Bou Jaoude.
PHOTO;VALUE=uri:https://jbj.ae/logo.png
X-SOCIALPROFILE;TYPE=linkedin:${SOCIAL_LINKS.linkedin}
X-SOCIALPROFILE;TYPE=instagram:${SOCIAL_LINKS.instagram}
X-SOCIALPROFILE;TYPE=tiktok:${SOCIAL_LINKS.tiktok}
END:VCARD`;
};

const downloadVCard = () => {
  const vcard = generateComprehensiveVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "JBJ-Global-Real-Estate.vcf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("Contact saved! Open the file to add to your contacts.");
};

const shareContact = async () => {
  const shareData = {
    title: 'JBJ Global Real Estate',
    text: 'Premium Real Estate Brokerage in Dubai - Contact JBJ Global',
    url: SOCIAL_LINKS.website,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      toast.success("Shared successfully!");
    } catch (err) {
      // User cancelled or error
      console.log('Share cancelled');
    }
  } else {
    // Fallback: Copy link
    navigator.clipboard.writeText(SOCIAL_LINKS.website);
    toast.success("Link copied to clipboard!");
  }
};

interface DirectContactCTAProps {
  className?: string;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  titleSize?: 'standard' | 'premium';
  showSaveShare?: boolean;
}

const DirectContactCTA = ({
  className = "",
  showTitle = true,
  title,
  subtitle,
  titleSize = 'premium',
  showSaveShare = true,
}: DirectContactCTAProps) => {
  const { t } = useLanguage();
  const resolvedTitle = title || t('cta.connectWithTeam', 'Connect With Our Team');
  const resolvedSubtitle = subtitle || t('cta.connectSubtitle', 'Get in touch for inquiries, consultations, or personalized guidance.');
  return (
    <section className={`py-12 bg-black ${className}`}>
      <div className="mx-4 sm:mx-6 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-4 sm:p-6 md:p-8">
        
        {showTitle && (
          <>
            <h2 
              className={`text-center font-bold mb-3 ${
                titleSize === 'premium' 
                  ? 'text-3xl md:text-4xl lg:text-5xl' 
                  : 'text-2xl md:text-3xl'
              }`} 
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="text-black">{resolvedTitle.split(' ').slice(0, -1).join(' ')}</span>{" "}
              <span className="text-gold">{resolvedTitle.split(' ').slice(-1)[0]}</span>
            </h2>
            <p className="text-center text-zinc-600 text-sm md:text-base mb-8 max-w-2xl mx-auto">
              {resolvedSubtitle}
            </p>
          </>
        )}

        {/* Contact Buttons Grid - 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-2xl mx-auto mb-6">
          {/* WhatsApp */}
          <a 
            href={getWhatsAppUrl()}
            className="flex items-center gap-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-emerald-500/40 rounded-xl p-3 sm:p-5 transition-all duration-300 group hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:border-emerald-500"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/50 flex-shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-black font-semibold text-sm mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t('cta.whatsapp', 'WhatsApp')}
              </h3>
              <p className="text-emerald-600 text-xs sm:text-sm font-semibold">{CONTACT_INFO.phone}</p>
            </div>
          </a>

          {/* Call Us */}
          <a 
            href={getCallUrl()}
            className="flex items-center gap-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-blue-500/40 rounded-xl p-3 sm:p-5 transition-all duration-300 group hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:-translate-y-1 hover:border-blue-500"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/50 flex-shrink-0">
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-black font-semibold text-sm mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t('cta.callUs', 'Call Us')}
              </h3>
              <p className="text-blue-600 text-xs sm:text-sm font-semibold">{CONTACT_INFO.phone}</p>
            </div>
          </a>

          {/* Email Us */}
          <a 
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-3 sm:p-5 transition-all duration-300 group hover:shadow-[0_8px_25px_rgba(200,167,102,0.4)] hover:-translate-y-1 hover:border-gold"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gold/30 to-handover/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-gold/50 shadow-[0_0_15px_rgba(200,167,102,0.3)] flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.8)]" />
            </div>
            <div>
              <h3 className="text-black font-semibold text-sm mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t('cta.emailUs', 'Email Us')}
              </h3>
              <p className="text-gold text-xs sm:text-sm font-semibold">{CONTACT_INFO.email}</p>
            </div>
          </a>
        </div>

        {/* Save Contact & Share Buttons - Below the 3 buttons */}
        {showSaveShare && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            onClick={downloadVCard}
            className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[220px] bg-transparent border-2 border-gold/50 hover:border-black hover:bg-black/5 text-black"
          >
            <Download className="w-5 h-5 text-gold" />
            <span>{t('cta.saveContact', 'Save Contact')}</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={shareContact}
            className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-transparent border-2 border-gold/50 hover:border-black hover:bg-black/5 text-black"
          >
            <Share2 className="w-5 h-5 text-gold" />
            <span>{t('cta.share', 'Share')}</span>
          </motion.button>
        </div>
        )}

        {/* Social Links Display */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gold/20">
          <span className="text-zinc-500 text-xs uppercase tracking-wider">{t('cta.followUs', 'Follow Us:')}</span>
          <a 
            href={SOCIAL_LINKS.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-black/5 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold transition-all"
          >
            <FaLinkedinIn className="w-4 h-4 text-gold" />
          </a>
          <a 
            href={SOCIAL_LINKS.instagram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-black/5 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold transition-all"
          >
            <FaInstagram className="w-4 h-4 text-gold" />
          </a>
          <a 
            href={SOCIAL_LINKS.tiktok} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-black/5 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold transition-all"
          >
            <FaTiktok className="w-4 h-4 text-gold" />
          </a>
          <a 
            href={SOCIAL_LINKS.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-black/5 border border-gold/30 flex items-center justify-center hover:bg-gold/10 hover:border-gold transition-all"
          >
            <FaGlobe className="w-4 h-4 text-gold" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default DirectContactCTA;
