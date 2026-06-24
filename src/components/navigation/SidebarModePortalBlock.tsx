import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Briefcase, TrendingUp, Building2 } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * SidebarModePortalBlock — compact mode-aware portal CTA pinned at the
 * top of the vertical sidebar. Follows the global sidebar hierarchy rule:
 * EMERALD only when the user is currently inside the portal route;
 * otherwise champagne with black text/icons.
 */
const MODE_CONFIG = {
  broker: {
    icon: Briefcase,
    label: "Broker Portal",
    href: "/broker/portal",
    matchPrefix: "/broker",
  },
  investor: {
    icon: TrendingUp,
    label: "Investor Portal",
    href: "/investor-dashboard",
    matchPrefix: "/investor",
  },
  developer: {
    icon: Building2,
    label: "Developer Portal",
    href: "/developers-portal",
    matchPrefix: "/developers-portal",
  },
} as const;

export default function SidebarModePortalBlock({ collapsed = false }: { collapsed?: boolean }) {
  const { mode } = useUserModeContext();
  const { pathname } = useLocation();
  const cfg = (mode && MODE_CONFIG[mode as keyof typeof MODE_CONFIG]) || MODE_CONFIG.investor;
  const Icon = cfg.icon;
  const active = pathname === cfg.href || pathname.startsWith(cfg.matchPrefix + "/") || pathname === cfg.matchPrefix;

  if (collapsed) {
    return (
      <Link
        to={cfg.href}
        aria-label={cfg.label}
        data-no-contrast-guard
        data-sidebar-mode-portal
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        className="mx-auto my-1.5 w-9 h-9 flex items-center justify-center rounded-lg transition-all"
      >
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </Link>
    );
  }

  return (
    <div className="pt-1 pb-3">
      <Link
        to={cfg.href}
        data-no-contrast-guard
        data-sidebar-mode-portal
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        className="group flex items-center gap-2 px-2.5 h-[34px] rounded-lg transition-all"
      >
        <span data-emerald-icon-surface className="w-5 h-5 rounded-md flex items-center justify-center shrink-0">
          <Icon className="w-3 h-3" strokeWidth={2.4} />
        </span>
        <span className="flex-1 text-[10.5px] font-bold tracking-[0.04em] uppercase whitespace-nowrap">
          {cfg.label}
        </span>
        <span data-emerald-icon-surface className="ml-2 w-5 h-5 rounded-md flex items-center justify-center shrink-0">
          <ArrowRight className="w-3 h-3" strokeWidth={2.6} />
        </span>
      </Link>
    </div>
  );
}
