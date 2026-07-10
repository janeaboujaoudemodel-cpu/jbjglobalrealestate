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
  sm: "min-h-[100svh]",
  md: "min-h-[100svh]",
  lg: "min-h-[100svh]",
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
      className={`jj-hero-fullscreen relative flex items-center justify-center overflow-hidden ${HEIGHTS[height]}`}
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
      <div className="relative z-10 flex min-h-[100svh] w-full items-center justify-center px-6 py-20 text-center">
        <motion.div
          className="mx-auto flex w-full max-w-[54rem] flex-col items-center justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 mb-6 backdrop-blur-sm">
            <EyebrowIcon className="h-3.5 w-3.5 text-[#E8CF8A]" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#E8CF8A] font-medium">
              {eyebrow}
            </span>
          </div>
          <h1
            data-no-contrast-guard
            className="mx-auto max-w-[15ch] text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-[1.04] mb-5 text-center"
            style={{ ...HEADING_FONT, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textAlign: "center" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mx-auto max-w-[38rem] text-base sm:text-lg md:text-xl text-[#F7F2EA] leading-relaxed"
              style={{ ...HEADING_FONT, color: "#F7F2EA", WebkitTextFillColor: "#F7F2EA" }}
            >
              {subtitle}
            </p>
          )}
          {meta && <div className="mt-7 flex w-full justify-center text-sm text-white/90">{meta}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export default PremiumEmeraldHero;
