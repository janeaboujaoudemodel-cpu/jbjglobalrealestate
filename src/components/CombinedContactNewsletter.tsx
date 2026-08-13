/**
 * CombinedContactNewsletter — full-width emerald-ombre band with white text
 * and icons. No gold/champagne card behind it. Used for the
 * "Ready to Get Started" / "Get in touch" / "Stay in the Loop" block.
 */

import { Phone, Mail, MessageCircle } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { NewsletterBrevo } from "@/components/marketing/NewsletterBrevo";
import ContentTrack from "@/components/layout/ContentTrack";

interface CombinedContactNewsletterProps {
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
  fitContainer?: boolean;
}

const CombinedContactNewsletter = ({
  title = "Ready to Get Started?",
  subtitle = "Connect with our expert team for personalized guidance.",
  className = "",
  id = "ready-to-get-started",
  fitContainer = false,
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

  const body = (
    <div
      data-ink-emerald
      data-surface="emerald"
      data-emerald="true"
      className={`jj-loop-block relative w-full px-4 py-8 sm:px-8 md:py-10 ${fitContainer ? "max-w-none" : "max-w-6xl mx-auto"}`}
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
        <h2 data-no-contrast-guard className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-[0.14em]" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
          {title}
        </h2>
        <div className="mx-auto mt-1 mb-2 flex items-center justify-center gap-2">
          <span className="jj-loop-divider h-px w-12" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="jj-loop-divider h-px w-12" />
        </div>
        <p data-no-contrast-guard className="text-xs md:text-sm max-w-lg mx-auto" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
          {subtitle}
        </p>
      </div>

      {/* Contact tiles — premium rectangular emerald, white icons/text */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto mb-6">
        {contactCards.map((card) => (
          <a
            key={card.label}
            href={card.href}
            target={card.label === "WhatsApp" ? "_blank" : undefined}
            rel={card.label === "WhatsApp" ? "noopener noreferrer" : undefined}
            data-surface="emerald"
            data-emerald-ok="button"
            data-no-contrast-guard
            className="jj-emerald-metallic jj-ready-cta-metallic group flex min-h-[96px] sm:min-h-[132px] flex-col items-center justify-start sm:justify-center gap-1.5 sm:gap-2.5 px-2 py-3.5 sm:px-5 sm:py-6 rounded-xl text-center"
            style={{ color: '#FFFFFF' }}
          >
            <span
              className="inline-flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full border"
              style={{ borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.10)' }}
            >
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.2} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            </span>
            <div className="min-w-0 w-full">
              <p className="text-[8.5px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.2em] font-semibold mb-0.5 sm:mb-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{card.label}</p>
              <p
                className="font-semibold whitespace-nowrap"
                style={{
                  color: '#FFFFFF',
                  WebkitTextFillColor: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                  overflowWrap: 'normal',
                  fontSize: 'clamp(8.5px, 2.55vw, 16px)',
                  lineHeight: 1.25,
                }}
              >
                {String(card.value).replace(/ /g, '\u00A0')}
              </p>
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
        <h3 data-no-contrast-guard className="text-base md:text-lg font-bold mb-2 uppercase tracking-[0.14em]" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
          Get the Edge — Listings Before the Market
        </h3>
        <p data-no-contrast-guard className="text-xs md:text-sm mb-4" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
          New launches, off-market deals, market moves &amp; insider insights — straight to your inbox.
        </p>
        <NewsletterBrevo variant="compact" source="combined_cta" />
      </div>
    </div>
  );

  return (
    <section
      id={id}
      data-no-section-frame
      data-surface="emerald"
      data-emerald="true"
      className={`jj-newsletter-emerald w-full border-0 shadow-none overflow-hidden ${fitContainer ? "p-0" : "py-12 md:py-20"} ${className}`}
    >
      {fitContainer ? body : <ContentTrack>{body}</ContentTrack>}
    </section>
  );
};

export default CombinedContactNewsletter;
