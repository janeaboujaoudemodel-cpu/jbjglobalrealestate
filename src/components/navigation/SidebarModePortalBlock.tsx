import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, TrendingUp, Building2 } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * SidebarModePortalBlock — compact emerald portal CTA pinned at the top of
 * the vertical sidebar, directly above "AI Home Finder". Mode-aware.
 * Visual: same emerald-ombre family as the sidebar logo header, but smaller.
 */
const MODE_CONFIG = {
  broker: {
    icon: Briefcase,
    label: "Broker Portal",
    href: "/broker/portal",
  },
  investor: {
    icon: TrendingUp,
    label: "Investor Portal",
    href: "/investor-dashboard",
  },
  developer: {
    icon: Building2,
    label: "Developer Portal",
    href: "/developers-portal",
  },
} as const;

export default function SidebarModePortalBlock({ collapsed = false }: { collapsed?: boolean }) {
  const { mode } = useUserModeContext();
  const cfg = (mode && MODE_CONFIG[mode as keyof typeof MODE_CONFIG]) || MODE_CONFIG.investor;
  const Icon = cfg.icon;

  if (collapsed) {
    return (
      <Link
        to={cfg.href}
        aria-label={cfg.label}
        data-no-contrast-guard
        data-allow-dark-cta
        className="allow-white mx-auto my-1.5 w-9 h-9 flex items-center justify-center rounded-lg shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
        style={{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(255,255,255,0.20)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
      </Link>
    );
  }

  return (
    <div className="px-2.5 pt-2 pb-1">
      <Link
        to={cfg.href}
        data-no-contrast-guard
        data-allow-dark-cta
        className="allow-white group flex items-center gap-2 px-2.5 h-9 rounded-lg shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)] hover:brightness-110 transition-all"
        style={{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(255,255,255,0.20)" }}
      >
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.40)" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
        </span>
        <span
          className="flex-1 text-[11px] font-bold tracking-[0.06em] uppercase truncate"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          {cfg.label}
        </span>
        <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.5} />
      </Link>
    </div>
  );
}
