/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to talk?" section with WhatsApp, Call, Save Contact buttons
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { toast } from "sonner";

// Generate vCard for saving contact
const generateVCard = (): string => {
  return `BEGIN:VCARD
VERSION:3.0
FN:JBJ Global Real Estate
ORG:JBJ Global Real Estate LLC
TEL;TYPE=CELL,VOICE:${CONTACT_INFO.phone}
EMAIL;TYPE=WORK:${CONTACT_INFO.email}
URL:https://jbj.ae
ADR;TYPE=WORK:;;Dubai;;UAE;;
NOTE:Dubai's Premium Real Estate Brokerage - RERA Licensed
END:VCARD`;
};

const downloadVCard = () => {
  const vcard = generateVCard();
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
    <section className="py-16 md:py-24 bg-black">
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
            {t('cta.readyToTalk', 'Ready to Talk?')}
          </h2>

          {/* Subtext */}
          <p className="text-zinc-600 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            {t('cta.subtitle', 'Get a shortlist, a rental option, a valuation, or a management quote—today.')}
          </p>

          {/* Action Buttons - Premium champagne styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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

            {/* Save Contact - Download vCard */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={() => {
                downloadVCard();
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'home_save_contact_click');
                }
              }}
              className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[180px] bg-black border-2 border-gold/50 hover:border-gold text-white hover:bg-zinc-900"
            >
              <Download className="w-5 h-5 text-gold" />
              <span>Save Contact</span>
            </motion.button>
          </div>

          {/* Contact Form Link */}
          <p className="mt-6 text-zinc-600 text-sm">
            Prefer email?{' '}
            <Link 
              to="/contact" 
              className="text-gold hover:underline font-medium"
            >
              Use our contact form
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABand;
