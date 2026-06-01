import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, TrendingUp, Building2, Sparkles } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * ModePortalBanner — thin, full-bleed, mode-aware portal CTA.
 *
 * Mirrors the visual structure of <VerificationBanner /> (navy #102540
 * full-edge bar, champagne CTA pill) so the homepage gains a second
 * matching attention strip. Content swaps live with the user's mode:
 *   investor  -> Investor Portal
 *   broker    -> Broker Portal
 *   developer -> Developer Portal
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
      data-surface="navy"
      data-allow-dark-cta
      className="surface-navy relative overflow-hidden bg-[#102540]"
    >
      {/* Subtle gold sheen overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          background:
            "radial-gradient(900px 220px at 12% 50%, rgba(184,149,85,0.55), transparent 60%), radial-gradient(700px 200px at 92% 50%, rgba(184,149,85,0.45), transparent 65%)",
        }}
      />
      {/* Top + bottom champagne hairlines */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/70 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
          {/* Mode icon tile */}
          <div
            data-surface="navy"
            data-allow-dark-cta
            className="surface-navy flex-shrink-0 w-10 h-10 rounded-lg bg-[#1a3d63] border border-white/20 flex items-center justify-center"
          >
            <Icon className="w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          </div>

          {/* Text */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
              <Sparkles className="w-3 h-3" style={{ color: "#B89555", stroke: "#B89555" }} />
              <span
                className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "#B89555" }}
              >
                {cfg.eyebrow}
              </span>
            </div>
            <p className="text-sm sm:text-base text-white/90 font-medium leading-snug">
              <span className="text-white font-semibold">{cfg.title}.</span>{" "}
              <span className="text-white/80">{cfg.copy}</span>
            </p>
          </div>

          {/* CTA — champagne pill matching Get Verified */}
          <Link
            to={cfg.href}
            className="jj-cta-champagne group relative flex-shrink-0 px-5 py-2.5 text-sm tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-transform duration-300 ease-out overflow-hidden inline-flex items-center gap-2"
            data-surface="champagne"
            data-cta="champagne"
            aria-label={cfg.cta}
            style={{ color: "#1A1A1A" }}
          >
            <span data-surface="champagne" className="relative z-10" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
              {cfg.cta}
            </span>
            <ArrowRight
              data-surface="champagne"
              className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2.5}
              style={{ color: "#1A1A1A", stroke: "#1A1A1A" }}
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
