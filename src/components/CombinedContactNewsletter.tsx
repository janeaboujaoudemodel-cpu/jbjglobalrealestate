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
    <section id="ready-to-get-started" className={`py-8 sm:py-12 md:py-16 bg-[#FDFBF7] ${className}`}>
      <div className="w-full px-4 md:px-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#FFFDF8] via-[#F7F2EA] to-[#EFE6D6] p-6 md:p-10 border border-[#B89555]/45 shadow-[0_20px_60px_-30px_rgba(184,149,85,0.45)]">
          {/* Corner gold flourishes */}
          <span aria-hidden className="pointer-events-none absolute top-0 left-0 h-10 w-10 border-t border-l border-[#B89555]/70 rounded-tl-2xl" />
          <span aria-hidden className="pointer-events-none absolute top-0 right-0 h-10 w-10 border-t border-r border-[#B89555]/70 rounded-tr-2xl" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-10 w-10 border-b border-l border-[#B89555]/70 rounded-bl-2xl" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-10 w-10 border-b border-r border-[#B89555]/70 rounded-br-2xl" />

          {/* Header */}
          <div className="relative text-center mb-8">
            <span
              data-allow-dark-cta data-no-contrast-guard
              className="allow-white inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold mb-4 bg-[#102540] text-white shadow-sm border border-[#B89555]/60"
              style={{ color: "#FFFFFF" }}
            >
              <span className="allow-white" style={{ color: "#FFFFFF" }}>Get in touch</span>
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-[0.14em] text-[#1A1A1A]">
              {title}
            </h2>
            <div className="mx-auto mt-2 mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-[#B89555]/70" />
              <span className="text-[#B89555] text-xs tracking-[0.4em]">✦</span>
              <span className="h-px w-12 bg-[#B89555]/70" />
            </div>
            <p className="text-[#1A1A1A]/75 text-sm md:text-base max-w-xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Contact Cards — white surfaces, blue icons */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.label === "WhatsApp" ? "_blank" : undefined}
                rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                className="group flex flex-row sm:flex-col items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white hover:bg-[#FDFBF7] transition-all duration-300"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FDFBF7] flex items-center justify-center flex-shrink-0">
                  <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#102540]" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs uppercase tracking-wider text-[#102540]/70 font-medium mb-0.5">{card.label}</p>
                  <p className="text-sm font-semibold text-[#102540]">{card.value}</p>
                </div>
              </a>
            ))}
          </div>


          {/* Divider — gold */}
          <div className="relative flex items-center gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex-1 h-px bg-[#B89555]/35" />
            <span className="text-[#B89555] text-sm">✦</span>
            <div className="flex-1 h-px bg-[#B89555]/35" />
          </div>

          {/* Newsletter Section */}
          <div className="relative max-w-lg mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-bold mb-3 uppercase tracking-[0.12em] text-[#1A1A1A]">
              ✦ Stay in the Loop ✦
            </h3>
            <p className="text-[#1A1A1A]/75 text-sm md:text-base mb-5">
              Be the first to access new listings, market updates, and personalized brokerage guidance.
            </p>
            <NewsletterBrevo variant="compact" source="combined_cta" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombinedContactNewsletter;
