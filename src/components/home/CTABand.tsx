/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to Get Started?" section with WhatsApp, Call, Email + Save Contact below
 */

import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { toast } from "sonner";

// Social links for vCard
const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/company/jbj-global-real-estate/",
  instagram: "https://www.instagram.com/jbj.global/",
  tiktok: "https://www.tiktok.com/@jbj.global",
  website: "https://JBJ.AE",
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
  toast.success("Contact saved!");
};

const CTABand = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 md:py-16 bg-black">
      <div className="jj-layer-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Heading */}
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Ready to <span className="text-gold">Get Started?</span>
          </h2>

          {/* Subtext */}
          <p className="text-zinc-600 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Connect with our expert team.
          </p>

          {/* Action Buttons - Row with WhatsApp, Call, Email */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {/* WhatsApp - Green accent */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'home_whatsapp_click');
                }
              }}
            >
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0 }}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#25D366]/50 hover:border-[#25D366] text-black"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                <span>WhatsApp</span>
              </motion.button>
            </a>

            {/* Call Now - Direct call, champagne style */}
            <a
              href={getCallUrl()}
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'home_call_click');
                }
              }}
            >
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:border-gold text-black"
              >
                <Phone className="w-5 h-5 text-gold" />
                <span>{t('cta.callNow', 'Call Now')}</span>
              </motion.button>
            </a>

            {/* Email - Blue icon matching Call Now style */}
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'home_email_click');
                }
              }}
            >
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:border-gold text-black"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Email</span>
              </motion.button>
            </a>
          </div>

          {/* Save Contact - On separate line below */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 }}
            onClick={() => {
              downloadVCard();
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'home_save_contact_click');
              }
            }}
            className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-black border-2 border-gold/50 hover:border-gold text-white hover:bg-zinc-900 mx-auto"
          >
            <Download className="w-5 h-5 text-gold" />
            <span>Save Contact</span>
          </motion.button>

          {/* Preferred Email Box */}
          <div className="mt-8 pt-6 border-t border-gold/20">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Preferred Email</p>
            <a 
              href={`mailto:${CONTACT_INFO.email}`}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 rounded-xl hover:border-gold transition-all hover:shadow-lg hover:shadow-gold/20 group"
            >
              <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600/20 transition-colors">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="block text-black font-semibold">{CONTACT_INFO.email}</span>
                <span className="block text-zinc-500 text-xs">Click to send email</span>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABand;
