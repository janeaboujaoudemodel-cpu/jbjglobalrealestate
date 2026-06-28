import { Mail, Phone, MessageCircle, Sparkles } from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";
import IconTile from "@/components/ui/icon-tile";

/**
 * Premium glassmorphism contact block for the Careers page.
 * Replaces the small "Questions? Contact us at…" footer line.
 */
export default function CareersContactBlock() {
  const channels = [
    {
      icon: Mail,
      label: "Email Careers",
      value: "careers@JBJ.ae",
      href: "mailto:careers@JBJ.ae",
      tag: "Replies within 24h",
    },
    {
      icon: Phone,
      label: "Contact us",
      value: CONTACT_INFO.phone,
      href: `tel:${CONTACT_INFO.phoneRaw}`,
      tag: "Mon–Sat · 9:00–18:00 GST",
    },
    {
      icon: MessageCircle,
      label: "Chat with Jessica",
      value: "Live HR Concierge",
      href: "/hr-agent",
      tag: "Instant · 24/7",
    },
  ] as const;

  return (
    <section className="mt-10 relative">
      <div
        className="relative overflow-hidden rounded-[28px] border border-[#B89555]/55
                   bg-[linear-gradient(135deg,rgba(253,251,247,0.96),rgba(247,242,234,0.85))]
                   shadow-[0_30px_70px_-40px_rgba(10,10,10,0.45)]
                   backdrop-blur-xl px-6 sm:px-10 py-10"
      >
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#0A0A0A]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#B89555]/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span
              data-surface="emerald"
              data-allow-dark-cta
              data-no-contrast-guard
              className="jj-cta-emerald jj-pill-emerald-metallic allow-white inline-flex items-center gap-1.5 rounded-full border border-[#B89555]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> Talk to us
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
            Questions before you apply?
          </h3>
          <p className="text-sm sm:text-base text-[#1A1A1A]/70 mt-1 max-w-2xl">
            Reach our recruitment team directly — by email, phone, or our live HR concierge Jessica.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            {channels.map(({ icon: Icon, label, value, href, tag }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("/") ? undefined : undefined}
                className="group relative overflow-hidden rounded-2xl border border-[#B89555]/45
                           bg-[#FDFBF7]/85 backdrop-blur-md p-4 sm:p-5
                           shadow-[0_10px_28px_-22px_rgba(184,149,85,0.45)]
                           transition-all duration-300
                           hover:-translate-y-1 hover:border-[#B89555]
                           hover:shadow-[0_22px_46px_-22px_rgba(184,149,85,0.55)]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/50"
              >
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
                <div className="flex items-start gap-3">
                  <IconTile
                    icon={Icon}
                    tone="navy"
                    size="md"
                    className="shadow-[0_6px_14px_-8px_rgba(10,10,10,0.55)] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]/70">
                      {label}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-[#1A1A1A] truncate">
                      {value}
                    </p>
                    <p className="text-[11px] text-[#1A1A1A]/60 mt-0.5">{tag}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
