import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, TrendingUp, Building2, Sparkles } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * ModePortalBanner — mode-aware portal CTA strip.
 *
 * Visual inverse of <VerificationBanner />:
 *   - Champagne/mother-of-pearl background (full-bleed)
 *   - Navy (#102540) text + icon (inverted tone)
 *   - Navy CTA pill with white label + white arrow (same shape, padding,
 *     radius, shadow as the Get Verified champagne pill — only contrast flips)
 *
 * Sits flush directly under <VerificationBanner /> so the two read as one
 * paired block. Mode swaps live with the user's selected mode.
 */
const MODE_CONFIG = {
  broker: {
    icon: Briefcase,
    eyebrow: "Broker Portal",
    title: "Your Broker Portal",
    copy: "CRM, lead pipeline, deal registration, commissions & JBJ Academy — all wired to your account.",
    cta: "Open Broker Portal",
    href: "/broker/portal",
  },
  investor: {
    icon: TrendingUp,
    eyebrow: "Investor Portal",
    title: "Your Investor Portal",
    copy: "Curated listings, ROI tools, market intelligence & private off-market opportunities.",
    cta: "Open Investor Portal",
    href: "/investor-dashboard",
  },
  developer: {
    icon: Building2,
    eyebrow: "Developer Portal",
    title: "Your Developer Portal",
    copy: "Submit projects, manage launches, brief our sales floor & track listing approvals in real time.",
    cta: "Open Developer Portal",
    href: "/developers-portal",
  },
} as const;

export default function ModePortalBanner() {
  const { mode } = useUserModeContext();
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      data-surface="champagne"
      className="relative overflow-hidden bg-gradient-to-r from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA]"
    >
      {/* Subtle navy sheen overlay — opposite of gold sheen on Get Verified */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background:
            "radial-gradient(900px 220px at 12% 50%, rgba(16,37,64,0.55), transparent 60%), radial-gradient(700px 200px at 92% 50%, rgba(16,37,64,0.45), transparent 65%)",
        }}
      />
      {/* Top + bottom champagne hairlines */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
          {/* Mode icon tile — cream tile, navy icon, gold hairline */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FDFBF7] border border-[#B89555]/55 flex items-center justify-center"
          >
            <Icon className="w-5 h-5" style={{ color: "#102540", stroke: "#102540" }} strokeWidth={2.2} />
          </div>

          {/* Text — navy eyebrow + title, ink body */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <Sparkles className="w-3 h-3" style={{ color: "#102540", stroke: "#102540" }} />
              <span
                className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#102540" }}
              >
                {cfg.eyebrow}
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium leading-snug" style={{ color: "#1A1A1A" }}>
              <span className="font-semibold" style={{ color: "#102540" }}>{cfg.title}.</span>{" "}
              <span style={{ color: "rgba(26,26,26,0.78)" }}>{cfg.copy}</span>
            </p>
          </div>

          {/* CTA — navy pill, white label + white arrow.
              Same dimensions/shadow/hover-lift as the champagne Get Verified pill. */}
          <Link
            to={cfg.href}
            className="jj-cta-dark group relative flex-shrink-0 h-11 min-w-[220px] px-6 text-sm font-semibold tracking-wide rounded-md shadow-[0_2px_10px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap border border-[#B89555]/70 bg-[#102540] hover:bg-[#1a3d63]"
            data-surface="navy"
            data-cta="dark"
            data-allow-dark-cta
            data-no-contrast-guard
            aria-label={cfg.cta}
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <span
              className="allow-white relative z-10 font-semibold"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              {cfg.cta}
            </span>
            <ArrowRight
              className="allow-white relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2.5}
              style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
