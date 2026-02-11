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
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500 shadow-lg shadow-emerald-500/20 hover:border-emerald-500/40 hover:shadow-none",
      shadowColor: "",
      valueColor: "text-gold group-hover:text-black",
    },
    {
      icon: Phone,
      label: "Call Us",
      value: CONTACT_INFO.phone,
      href: getCallUrl(),
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500 shadow-lg shadow-blue-500/20 hover:border-blue-500/40 hover:shadow-none",
      shadowColor: "",
      valueColor: "text-gold group-hover:text-black",
    },
    {
      icon: Mail,
      label: "Email",
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      iconBg: "bg-gold/20",
      iconColor: "text-gold",
      borderColor: "border-gold hover:border-gold/40",
      shadowColor: "shadow-lg shadow-gold/20 hover:shadow-none",
      valueColor: "text-gold group-hover:text-black",
    },
  ];

  return (
    <section className={`py-8 sm:py-12 md:py-16 bg-black ${className}`}>
      <div className="mx-4 sm:mx-6 md:mx-4 lg:mx-6 xl:mx-8 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-xl sm:rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-4 sm:p-6 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 uppercase tracking-[0.1em]"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {title}
          </h2>
          <p className="text-zinc-600 text-sm md:text-base max-w-xl mx-auto">
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
              className={`group flex flex-row sm:flex-col items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 bg-white/50 hover:shadow-lg transition-all duration-300 ${card.borderColor} ${card.shadowColor}`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.iconColor}`} />
              </div>
              <div className="text-left sm:text-center">
                <p className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-0.5">{card.label}</p>
                <p className={`text-sm font-semibold transition-colors ${card.valueColor}`}>{card.value}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-2xl mx-auto mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <span className="text-gold/60 text-sm">✦</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
        </div>

        {/* Newsletter Section */}
        <div className="max-w-lg mx-auto text-center">
          <h3
            className="text-xl md:text-2xl font-bold mb-3 uppercase tracking-[0.12em]"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: 'linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #D4AF37 50%, #333333 70%, #1a1a1a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ✦ Stay in the Loop ✦
          </h3>
          <p className="text-zinc-600 text-sm md:text-base mb-5">
            Be the first to access new listings, market updates, and personalized brokerage guidance.
          </p>
          <NewsletterBrevo variant="compact" source="combined_cta" />
        </div>
      </div>
    </section>
  );
};

export default CombinedContactNewsletter;
