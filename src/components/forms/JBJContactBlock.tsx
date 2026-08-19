import { Mail, Phone, MessageCircle, Sparkles, type LucideIcon } from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";

/**
 * Generalised "Questions? Contact us" premium glass block.
 * Use this in any public lead-capture form instead of an inline
 * "Email us at…" footer line. Channels are prop-driven so each
 * form can tune the wording while keeping the visual contract.
 */
export type JBJContactChannel = {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  tag: string;
};

interface JBJContactBlockProps {
  title?: string;
  description?: string;
  eyebrow?: string;
  channels?: readonly JBJContactChannel[];
  className?: string;
}

const DEFAULT_CHANNELS: readonly JBJContactChannel[] = [
  {
    icon: Mail,
    label: "Email us",
    value: "hello@JBJ.ae",
    href: "mailto:hello@JBJ.ae",
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
    label: "Live concierge",
    value: "JBJ Concierge",
    href: "/concierge",
    tag: "Instant · 24/7",
  },
] as const;

export default function JBJContactBlock({
  title = "Questions before you continue?",
  description = "Reach our team directly — by email, phone, or our live concierge.",
  eyebrow = "Talk to us",
  channels = DEFAULT_CHANNELS,
  className = "",
}: JBJContactBlockProps) {
  return (
    <section className={`mt-10 relative ${className}`}>
      <div
        className="relative overflow-hidden rounded-[28px] border border-[#B89555]/55
                   bg-[linear-gradient(135deg,rgba(253,251,247,0.96),rgba(247,242,234,0.85))]
                   shadow-[0_30px_70px_-40px_rgba(10,10,10,0.45)]
                   backdrop-blur-xl px-6 sm:px-10 py-10"
      >
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#0A0A0A]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#B89555]/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B89555]/60 bg-[#FDFBF7]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#0A0A0A]">
              <Sparkles className="w-3 h-3" /> {eyebrow}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-[#1A1A1A]/70 mt-1 max-w-2xl">
            {description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            {channels.map(({ icon: Icon, label, value, href, tag }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
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
                  <div
                    data-allow-dark-cta
                    data-no-contrast-guard
                    className="grid place-items-center h-10 w-10 rounded-xl bg-[#0A0A0A] border border-[#B89555]/60 shadow-[0_6px_14px_-8px_rgba(10,10,10,0.55)] transition-transform duration-300 group-hover:scale-105"
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
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
