/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to talk?" section with WhatsApp, Call, Contact buttons
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

const CTABand = () => {
  const { t } = useLanguage();

  const actions = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      href: getWhatsAppUrl(),
      color: "bg-[#25D366] hover:bg-[#20BD5A]",
      textColor: "text-white",
      external: true,
    },
    {
      id: "call",
      label: t('cta.callNow', 'Call Now'),
      icon: Phone,
      href: getCallUrl(),
      color: "bg-gold hover:bg-gold-dark",
      textColor: "text-black",
      external: true,
    },
    {
      id: "contact",
      label: t('cta.contactForm', 'Contact Form'),
      icon: Mail,
      href: "/contact",
      color: "bg-black hover:bg-zinc-800",
      textColor: "text-white",
      external: false,
    },
  ];

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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {actions.map((action, index) => {
              const ButtonContent = (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-full ${action.color} ${action.textColor} font-medium text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg min-w-[160px]`}
                  onClick={() => {
                    // Track event
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', `home_${action.id}_click`);
                    }
                  }}
                >
                  <action.icon className="w-5 h-5" />
                  <span>{action.label}</span>
                </motion.button>
              );

              if (action.external) {
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ButtonContent}
                  </a>
                );
              }

              return (
                <Link key={action.id} to={action.href}>
                  {ButtonContent}
                </Link>
              );
            })}
          </div>

          {/* Phone Number Display */}
          <p className="mt-6 text-zinc-500 text-sm">
            {t('cta.orCall', 'Or call us directly at')}{' '}
            <a 
              href={getCallUrl()} 
              className="text-gold hover:underline font-medium"
            >
              {CONTACT_INFO.phone}
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABand;
