import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Handshake, TrendingUp, Building2 } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

/**
 * SidebarModePortalBlock — compact mode-aware portal CTA pinned at the
 * top of the vertical sidebar.
 *
 * Visual contract (locked to match every other vertical-sidebar row):
 *   • min-h-10 row, gap-2.5, px-2.5
 *   • w-6 h-6 emerald-ombre icon tile, white glyph
 *   • ChevronRight trailing (same as section headers / mega items)
 *   • Always emerald-filled icon tile (same in collapsed + expanded states)
 */
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
} as const;

const EMERALD_TILE =
  "bg-[image:var(--jj-emerald-ombre)] border border-white/20 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.65),inset_0_1px_0_rgba(255,255,255,0.18)]";

export default function SidebarModePortalBlock({ collapsed = false }: { collapsed?: boolean }) {
  const { mode } = useUserModeContext();
  const { pathname } = useLocation();
  const cfg = (mode && MODE_CONFIG[mode as keyof typeof MODE_CONFIG]) || MODE_CONFIG.investor;
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
        className="mx-auto my-1 w-10 h-10 flex items-center justify-center rounded-lg transition-all hover:bg-[#1A1A1A]/[0.045]"
      >
        <span
          data-emerald-icon-surface
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${EMERALD_TILE}`}
        >
          <Icon
            className="w-[14px] h-[14px] allow-white"
            strokeWidth={2.1}
            style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
          />
        </span>
      </Link>
    );
  }

  return (
    <div className="pt-0.5 pb-1.5">
      <Link
        to={cfg.href}
        data-no-contrast-guard
        data-sidebar-mode-portal
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-2.5 px-2.5 min-h-10 rounded-lg transition-all duration-200 ${
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
          data-emerald-icon-surface
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${EMERALD_TILE}`}
        >
          <Icon
            className="w-[14px] h-[14px] allow-white"
            strokeWidth={2.1}
            style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
          />
        </span>
        <span
          className="flex-1 min-w-0 text-left text-[9px] uppercase tracking-[0.055em] leading-[1.18] font-bold whitespace-normal break-words [overflow-wrap:anywhere]"
          style={{
            color: active ? "#FFFFFF" : "#1A1A1A",
            WebkitTextFillColor: active ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          {cfg.label}
        </span>
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 opacity-60"
          style={
            active
              ? { color: "#FFFFFF", stroke: "#FFFFFF" }
              : { color: "#1A1A1A", stroke: "#1A1A1A" }
          }
        />
      </Link>
    </div>
  );
}
