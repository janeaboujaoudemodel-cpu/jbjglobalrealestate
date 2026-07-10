/**
 * PremiumEmeraldHero — LOCKED per content-page-layout-standard.
 * Solid emerald ombre, centered title, NO stripe/pattern overlays.
 * Thin wrapper over the verified GuideHero for a unified API across
 * Guides / Insights / Services / Company / Legal / Help pages.
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, ShieldCheck } from "lucide-react";

interface PremiumEmeraldHeroProps {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: ReactNode;
  subtitle?: string;
  meta?: ReactNode;
  height?: "sm" | "md" | "lg";
}

const HEIGHTS: Record<NonNullable<PremiumEmeraldHeroProps["height"]>, string> = {
  sm: "py-14 md:py-16",
  md: "py-16 md:py-20 lg:py-24",
  lg: "py-20 md:py-28 lg:py-32",
};

const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
};

export function PremiumEmeraldHero({
  eyebrow,
  eyebrowIcon: EyebrowIcon = ShieldCheck,
  title,
  subtitle,
  meta,
  height = "md",
}: PremiumEmeraldHeroProps) {
  return (
    <section
      data-hero-dark
      data-surface="emerald"
      data-no-contrast-guard
      data-premium-emerald-hero
      className="relative overflow-hidden border-b border-[#B89555]/25"
      style={{
        background:
          "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000000 100%)",
      }}
    >
      {/* Soft radial glow only — NO stripe/grid/diagonal overlays (locked). */}
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(ellipse at 22% 22%, rgba(110,231,183,0.18), transparent 55%), radial-gradient(ellipse at 82% 78%, rgba(184,149,85,0.16), transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className={`relative z-10 max-w-4xl mx-auto px-6 text-center ${HEIGHTS[height]}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/45 bg-white/5 px-3.5 py-1.5 mb-6 backdrop-blur-sm">
            <EyebrowIcon className="h-3.5 w-3.5 text-[#E8CF8A]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#E8CF8A] font-medium">
              {eyebrow}
            </span>
          </div>
          <h1
            data-no-contrast-guard
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-[1.08] tracking-tight mb-5 text-center"
            style={{ ...HEADING_FONT, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textAlign: "center" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-base sm:text-lg md:text-xl text-[#E8CF8A] italic max-w-3xl mx-auto"
              style={HEADING_FONT}
            >
              {subtitle}
            </p>
          )}
          {meta && <div className="mt-6 text-sm text-white/75">{meta}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export default PremiumEmeraldHero;
