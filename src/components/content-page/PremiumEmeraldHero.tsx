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
  sm: "min-h-[44svh] md:min-h-[48svh]",
  md: "min-h-[52svh] md:min-h-[56svh]",
  lg: "min-h-[60svh] md:min-h-[64svh]",
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
      className={`jj-hero-fullscreen jj-mi-prada-hero relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden ${HEIGHTS[height]}`}
    >
      <div aria-hidden className="jj-mi-marble-depth pointer-events-none absolute inset-0" />
      <div aria-hidden className="jj-mi-gold-hairline pointer-events-none absolute inset-x-0 bottom-0 h-px" />
      <div aria-hidden className="jj-mi-marble-grain pointer-events-none absolute inset-0 mix-blend-overlay" />
      <div className="relative z-10 flex w-full items-center justify-center px-6 text-center">
        <motion.div
          className="mx-auto flex w-full max-w-[64rem] flex-col items-center justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div data-no-contrast-guard className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 mb-6 backdrop-blur-sm">
            <EyebrowIcon className="h-3.5 w-3.5 text-[#E8CF8A]" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#E8CF8A] font-medium">
              {eyebrow}
            </span>
          </div>
          <h1
            data-no-contrast-guard
            className="jj-mi-hero-title mx-auto max-w-[16ch] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white leading-[1.02] text-center"
            style={{ ...HEADING_FONT, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textAlign: "center" }}
          >
            {title}
          </h1>
          {subtitle && (
            <>
              <div aria-hidden className="jj-mi-title-rule my-8 h-px w-24" />
              <p
                data-no-contrast-guard
                className="jj-mi-hero-copy mx-auto max-w-[42rem] text-lg md:text-xl lg:text-2xl font-light text-[#E8CF8A] leading-relaxed"
                style={{ ...HEADING_FONT, color: "#E8CF8A", WebkitTextFillColor: "#E8CF8A" }}
              >
                {subtitle}
              </p>
            </>
          )}
          {meta && <div className="mt-12 flex w-full justify-center text-sm text-white/90">{meta}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export default PremiumEmeraldHero;
