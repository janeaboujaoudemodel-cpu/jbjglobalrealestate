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
    <section id="ready-to-get-started" className={`py-4 sm:py-5 md:py-6 bg-[#FDFBF7] ${className}`}>
      <div className="w-full px-4 md:px-6">
        <div
          data-ink-emerald
          data-no-contrast-guard
          className="jj-emerald-card jj-loop-block relative rounded-2xl px-4 md:px-5 pt-4 md:pt-5 pb-6 md:pb-7 max-w-3xl mx-auto"
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

          {/* Contact tiles — premium rectangular emerald, white icons/text */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto mb-5">
            {contactCards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                target={card.label === "WhatsApp" ? "_blank" : undefined}
                rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
                data-surface="emerald"
                data-emerald-ok="button"
                data-no-contrast-guard
                className="group flex flex-row items-center justify-center gap-2.5 px-4 py-3 rounded-md transition-all duration-200 hover:brightness-110"
                style={{
                  backgroundImage: "var(--jj-emerald-ombre)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: "0 10px 24px -14px rgba(6,78,59,0.85), inset 0 1px 0 rgba(255,255,255,0.10)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" strokeWidth={2.2} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <div className="min-w-0 text-left">
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-0.5">{card.label}</p>
                  <p className="text-xs sm:text-sm font-semibold">{card.value}</p>
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
            <span
              data-no-contrast-guard
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-[0.22em] font-semibold mb-3 border"
              style={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.35)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              Stay in the Loop
            </span>
            <h3 className="text-base md:text-lg font-bold mb-2 uppercase tracking-[0.14em]" style={{ color: "#FFFFFF" }}>
              Get the Inside Track — Listings Before the Market
            </h3>
            <p className="text-xs md:text-sm mb-4" style={{ color: "rgba(255,255,255,0.88)" }}>
              Off-market launches, price moves, and concierge intel — curated weekly, never spammy.
            </p>

            <NewsletterBrevo variant="compact" source="combined_cta" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CombinedContactNewsletter;
