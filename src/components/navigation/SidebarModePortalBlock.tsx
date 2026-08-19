import { Link, useLocation } from "react-router-dom";
import { Handshake, TrendingUp, Building2, Crown } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerBackendEmail } from "@/config/ownerEmails";

const MODE_CONFIG = {
  broker: {
    icon: Handshake,
    label: "Broker Portal",
    href: "/broker/portal",
    matchPrefix: "/broker",
  },
  investor: {
    icon: TrendingUp,
    label: "Investor Portal",
    href: "/investor-dashboard",
    matchPrefix: "/investor-dashboard",
  },
  developer: {
    icon: Building2,
    label: "Developer Portal",
    href: "/developers-portal",
    matchPrefix: "/developers-portal",
  },
  owner: {
    icon: Crown,
    label: "Owner Portal",
    href: "/owner",
    matchPrefix: "/owner",
  },
} as const;

const EMERALD_TILE =
  "bg-transparent border-0 shadow-none";

export default function SidebarModePortalBlock({ collapsed = false }: { collapsed?: boolean }) {
  const { mode, hasMadeInitialSelection } = useUserModeContext();
  const { user, isOwner } = useAuth();
  const { pathname } = useLocation();
  const canShowOwnerPortal = isOwner || isOwnerBackendEmail(user?.email);
  const safeMode = !hasMadeInitialSelection || (mode === "owner" && !canShowOwnerPortal) ? "investor" : mode;
  const cfg = (safeMode && MODE_CONFIG[safeMode as keyof typeof MODE_CONFIG]) || MODE_CONFIG.investor;
  const Icon = cfg.icon;
  const active =
    pathname === cfg.href || pathname.startsWith(cfg.matchPrefix + "/");

  if (collapsed) {
    return (
      <Link
        to={cfg.href}
        aria-label={cfg.label}
        data-no-contrast-guard
        data-sidebar-mode-portal
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        className="group mx-auto my-1 w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-[#1A1A1A]/[0.045]"
      >
        <span
          data-sidebar-mode-icon-tile
          className={`w-[22px] h-[22px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${EMERALD_TILE}`}
        >
          <Icon
            className="w-[18px] h-[18px]"
            strokeWidth={2.25}
            style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
          />
        </span>
      </Link>
    );
  }

  return (
    <div className="pt-0 pb-0" data-sidebar-mode-portal-shell>
      <Link
        to={cfg.href}
        aria-label={cfg.label}
        data-no-contrast-guard
        data-sidebar-mode-portal
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3 px-3 min-h-9 rounded-xl transition-all duration-200 ${
          active ? "" : "hover:bg-[#1A1A1A]/[0.045]"
        }`}
        style={
          active
            ? {
                backgroundImage: "var(--jj-emerald-ombre)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
              }
            : undefined
        }
      >
        <span
          data-sidebar-mode-icon-tile
          className={`w-[22px] h-[22px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${EMERALD_TILE}`}
        >
          <Icon
            className="w-[18px] h-[18px]"
            strokeWidth={2.25}
            style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
          />
        </span>
        <span
          className="flex-1 min-w-0 text-left text-[11.5px] uppercase tracking-[0.12em] leading-[1.15] font-extrabold whitespace-normal break-normal [overflow-wrap:normal]"
        >
          {cfg.label}
        </span>
      </Link>
    </div>
  );
}
