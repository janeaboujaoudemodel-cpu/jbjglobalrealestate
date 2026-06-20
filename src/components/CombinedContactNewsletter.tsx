/**
 * CombinedContactNewsletter Component
 * Combines "Connect With Our Team" + "Stay in the Loop" into one premium container
 */

import { Phone, Mail, MessageCircle } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { NewsletterBrevo } from "@/components/marketing/NewsletterBrevo";

interface CombinedContactNewsletterProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const CombinedContactNewsletter = ({
  title = "Ready to Get Started?",
  subtitle = "Connect with our expert team for personalized guidance.",
  className = "",
}: CombinedContactNewsletterProps) => {
  const contactCards = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: CONTACT_INFO.phone,
      href: getWhatsAppUrl(),
    },
    {
      icon: Phone,
      label: "Call Us",
      value: CONTACT_INFO.phone,
      href: getCallUrl(),
    },
    {
      icon: Mail,
      label: "Email",
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
    },
  ];


  return (
    <section id="ready-to-get-started" className={`py-6 sm:py-8 md:py-10 bg-[#FDFBF7] ${className}`}>
      <div className="w-full px-4 md:px-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#FFFDF8] via-[#F7F2EA] to-[#EFE6D6] p-5 md:p-7 border border-[#B89555]/40 shadow-[0_12px_40px_-24px_rgba(184,149,85,0.40)] max-w-4xl mx-auto">
          {/* Header */}
          <div className="relative text-center mb-5">
            <span
              data-no-contrast-guard
              className="jj-text-emerald inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold mb-3 bg-[#E8F2EC] border border-[#064E3B]/30"
            >
              <span className="jj-text-emerald">Get in touch</span>
            </span>
            <h2 data-no-contrast-guard className="jj-title-emerald text-xl md:text-2xl font-bold mb-2 uppercase tracking-[0.14em]">
              {title}
            </h2>
            <div className="mx-auto mt-1 mb-2 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-[#047857]/50" />
              <span className="jj-text-emerald text-[10px] tracking-[0.4em]">✦</span>
              <span className="h-px w-8 bg-[#047857]/50" />
            </div>
            <p className="text-[#1A1A1A]/75 text-xs md:text-sm max-w-lg mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Contact Cards — white surfaces, emerald icons */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto mb-5">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.label === "WhatsApp" ? "_blank" : undefined}
                rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                className="group flex flex-row sm:flex-col items-center gap-2 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-white hover:bg-[#F7FAF8] transition-all duration-300"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E8F2EC] border border-[#064E3B]/30 flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-4 h-4 sm:w-5 sm:h-5 jj-icon-emerald" />
                </div>
                <div className="text-left sm:text-center">
                  <p data-no-contrast-guard className="jj-text-emerald text-[10px] uppercase tracking-wider font-semibold mb-0.5">{card.label}</p>
                  <p className="text-xs sm:text-sm font-semibold text-[#0A0A0A]">{card.value}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Divider — emerald hairline */}
          <div className="relative flex items-center gap-3 max-w-2xl mx-auto mb-5">
            <div className="flex-1 h-px bg-[#047857]/30" />
            <span className="jj-text-emerald text-xs">✦</span>
            <div className="flex-1 h-px bg-[#047857]/30" />
          </div>

          {/* Newsletter Section */}
          <div className="relative max-w-md mx-auto text-center">
            <h3 data-no-contrast-guard className="jj-title-emerald text-base md:text-lg font-bold mb-2 uppercase tracking-[0.12em]">
              Stay in the Loop
            </h3>
            <p className="text-[#1A1A1A]/75 text-xs md:text-sm mb-4">
              Be the first to access new listings, market updates, and personalized guidance.
            </p>
            <NewsletterBrevo variant="compact" source="combined_cta" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombinedContactNewsletter;
