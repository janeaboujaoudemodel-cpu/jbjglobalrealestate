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
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#F7F2EA] to-[#EFE6D6] p-6 md:p-10">
          {/* Header */}
          <div className="relative text-center mb-8">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold mb-4 bg-white text-[#102540] shadow-sm"
            >
              <span className="text-[#102540]">Get in touch</span>
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-[0.1em] text-[#1A1A1A]">
              {title}
            </h2>
            <p className="text-[#1A1A1A]/75 text-sm md:text-base max-w-xl mx-auto">
              {subtitle}
            </p>
            <div className="mx-auto mt-4 h-px w-16 bg-[#B89555]/70" />
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
