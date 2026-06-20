import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, TrendingUp, Building2, Sparkles } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * ModePortalBanner — mode-aware portal CTA strip.
 *
 * Visual inverse of <VerificationBanner />:
 *   - Champagne/mother-of-pearl background (full-bleed)
 *   - Navy (#0A0A0A) text + icon (inverted tone)
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
  const cfg =
    (mode && MODE_CONFIG[mode as keyof typeof MODE_CONFIG]) || MODE_CONFIG.investor;
  const Icon = cfg?.icon ?? Briefcase;
  if (!cfg) return null;


  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      data-ink-emerald
      data-on-dark
      data-no-contrast-guard
      className="allow-white relative overflow-hidden"
      style={{
        /* Reverse direction from <VerificationBanner /> so the two
           stacked emerald bands don't visually merge — light → deep. */
        backgroundImage:
          "linear-gradient(135deg, #0A6B53 0%, #13A078 55%, #064E3B 100%)",
      }}
    >
      {/* Top + bottom emerald hairlines (no gold). */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#34D399]/55 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#34D399]/55 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
          {/* Mode icon tile — translucent white tile, white icon */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/15 border border-white/40 flex items-center justify-center"
          >
            <Icon className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
          </div>

          {/* Text — white on lighter emerald */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              <span
                className="allow-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#FFFFFF" }}
              >
                {cfg.eyebrow}
              </span>
            </div>
            <p className="allow-white text-sm sm:text-base font-medium leading-snug" style={{ color: "#FFFFFF" }}>
              <span className="allow-white font-semibold" style={{ color: "#FFFFFF" }}>{cfg.title}.</span>{" "}
              <span className="allow-white" style={{ color: "rgba(255,255,255,0.88)" }}>{cfg.copy}</span>
            </p>
          </div>

          {/* CTA — deep emerald-to-black pill, white label, gold hairline. */}
          <Link
            to={cfg.href}
            className="group relative flex-shrink-0 h-11 min-w-[220px] px-6 text-sm font-semibold tracking-wide rounded-md hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap border border-[#B89555]/60"
            data-cta="dark"
            data-allow-dark-cta
            data-no-contrast-guard
            aria-label={cfg.cta}
            style={{
              backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #0A0A0A 100%)",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              boxShadow: "0 6px 18px -6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.20)",
            }}
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
