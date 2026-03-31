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
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      icon: Phone,
      label: "Call Us",
      value: CONTACT_INFO.phone,
      href: getCallUrl(),
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
    {
      icon: Mail,
      label: "Email",
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <section id="ready-to-get-started" className={`py-8 sm:py-12 md:py-16 bg-white ${className}`}>
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-[0.1em] text-black"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.label === "WhatsApp" ? "_blank" : undefined}
                rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                className="group flex flex-row sm:flex-col items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-0.5">{card.label}</p>
                  <p className="text-sm font-semibold text-black group-hover:text-gray-700 transition-colors">{card.value}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-300 text-sm">✦</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Newsletter Section */}
          <div className="max-w-lg mx-auto text-center">
            <h3
              className="text-xl md:text-2xl font-bold mb-3 uppercase tracking-[0.12em] text-black"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              ✦ Stay in the Loop ✦
            </h3>
            <p className="text-gray-500 text-sm md:text-base mb-5">
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
