/**
 * CombinedContactNewsletter — emerald-ombre card with white text and white
 * icons. No gold borders, no light-green outlines. Used for the
 * "Ready to Get Started" / "Get in touch" / "Stay in the Loop" block.
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
        <div
          data-ink-emerald
          data-no-contrast-guard
          className="jj-emerald-card jj-loop-block relative rounded-2xl p-5 md:p-7 max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="relative text-center mb-5">
            <span
              data-no-contrast-guard
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold mb-3 border"
              style={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              Get in touch
            </span>
            <h2 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-[0.14em]" style={{ color: "#FFFFFF" }}>
              {title}
            </h2>
            <div className="mx-auto mt-1 mb-2 flex items-center justify-center gap-2">
              <span className="jj-loop-divider h-px w-12" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              <span className="jj-loop-divider h-px w-12" />
            </div>
            <p className="text-xs md:text-sm max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.88)" }}>
              {subtitle}
            </p>
          </div>

          {/* Contact cards — translucent white tiles on emerald, white icons/text */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto mb-5">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.label === "WhatsApp" ? "_blank" : undefined}
                rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                data-no-contrast-guard
                className="group flex flex-row sm:flex-col items-center gap-2 sm:gap-2 p-2.5 sm:p-3 rounded-xl transition-all duration-300 hover:brightness-110"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#FFFFFF",
                }}
              >
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.30)",
                  }}
                >
                  <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: "#FFFFFF" }}>{card.label}</p>
                  <p className="text-xs sm:text-sm font-semibold" style={{ color: "#FFFFFF" }}>{card.value}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 max-w-2xl mx-auto mb-5">
            <div className="jj-loop-divider flex-1 h-px" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            <div className="jj-loop-divider flex-1 h-px" />
          </div>

          {/* Newsletter */}
          <div className="relative max-w-md mx-auto text-center">
            <h3 className="text-base md:text-lg font-bold mb-2 uppercase tracking-[0.12em]" style={{ color: "#FFFFFF" }}>
              Stay in the Loop
            </h3>
            <p className="text-xs md:text-sm mb-4" style={{ color: "rgba(255,255,255,0.88)" }}>
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
