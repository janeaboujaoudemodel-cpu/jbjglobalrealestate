import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, Phone, MessageSquare } from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

interface GuideCTAProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  primaryAction?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  showContactOptions?: boolean;
  variant?: "default" | "compact" | "full";
}

/**
 * Champagne CTA band used at the end of every guide page.
 * - Full-bleed champagne band (no black bg)
 * - Locked CTA primitives only (.jj-cta-champagne / .jj-cta-dark)
 * - Phone/WhatsApp use navy dark CTA with white icons (allow-white)
 */
export const GuideCTA = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  showContactOptions = true,
  variant = "default",
}: GuideCTAProps) => {
  return (
    <section className="jj-band jj-band--surface py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`bg-[#F7F2EA] border border-[#B89555]/40 rounded-2xl ${
              variant === "compact" ? "p-6" : "p-8 md:p-12"
            } text-center`}
          >
            {Icon && (
              <div className="w-14 h-14 bg-[#EFE6D6] border border-[#B89555]/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-7 h-7 text-[#1A1A1A]" />
              </div>
            )}

            <h3
              className={`font-bold text-[#1A1A1A] mb-4 ${
                variant === "compact" ? "text-xl" : "text-2xl md:text-3xl"
              }`}
            >
              {title}
            </h3>

            <p className="text-[#1A1A1A]/75 mb-8 max-w-xl mx-auto">
              {description}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {primaryAction && (
                <a
                  href={primaryAction.href}
                  data-cta="guide-primary"
                  className="jj-cta-champagne inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-sm font-semibold"
                >
                  {primaryAction.icon && (
                    <primaryAction.icon className="w-4 h-4" />
                  )}
                  <span>{primaryAction.label}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}

              {showContactOptions && (
                <>
                  <a
                    href={getWhatsAppUrl()}
                    data-cta="guide-whatsapp"
                    className="jj-cta-dark allow-white inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={getCallUrl()}
                    data-cta="guide-call"
                    className="jj-cta-dark allow-white inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{CONTACT_INFO.phone}</span>
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default GuideCTA;
