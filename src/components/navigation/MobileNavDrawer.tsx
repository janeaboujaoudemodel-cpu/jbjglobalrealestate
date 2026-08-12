/**
 * MobileNavDrawer — phone + tablet-portrait navigation.
 *
 * PASS 318 — ONE NAV LANGUAGE ON EVERY DEVICE (LOCKED)
 *
 * This drawer renders the SAME navigation data as the desktop vertical
 * sidebar (`NAV_ITEMS`, `SECTION_KEYS`, `SECTION_ALIAS`, `SECTION_ICONS`
 * exported from `GlobalVerticalNav`), so a route can never exist on the
 * laptop rail and be missing on the phone. Surfaces and ink follow the
 * Sun/Moon contract through the shared `data-jj-mobile-drawer` hook plus
 * the scoped `pass-318` stylesheet — no hardcoded champagne/black values.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown, LogOut, User, Search, HelpCircle, Headphones, Heart, Ticket, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { useTeamVisibility } from "@/hooks/useTeamVisibility";
import { useCompareAccess } from "@/hooks/useCompareAccess";
import { useGatedToolAccess } from "@/hooks/useGatedToolAccess";
import { supabase } from "@/integrations/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { ThemeModeToggle } from "@/components/ThemeModeToggle";
import jbjMonogram from "@/assets/jbj-monogram-cropped.png";
import {
  NAV_ITEMS, PUBLIC_TOOLS_WORKSPACE_ITEMS, SECTION_KEYS, SECTION_ALIAS,
  SECTION_ICONS, type NavItem, type SectionKey,
} from "@/components/navigation/GlobalVerticalNav";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
  onOpenGuide?: () => void;
}

const hrefPath = (href: string) => href.split("?")[0].split("#")[0];

export default function MobileNavDrawer({
  open, onClose, onOpenSearch, onOpenGuide,
}: MobileNavDrawerProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isOwner } = useUserRole();
  const { mode, isBrokerMode, isInvestorMode } = useUserModeContext();
  const { isMoon } = useThemeMode();
  const { isPageVisible: isTeamPageVisible } = useTeamVisibility();
  const { allowed: canCompare } = useCompareAccess();
  const { visible: canSeeCardScanner } = useGatedToolAccess("business-card-scanner");
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const ink = isMoon ? "#FFFFFF" : "#0A0A0A";
  const isOwnerMode = isOwner && mode === "owner";

  /* Body scroll lock while the drawer is open. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  /* Escape closes. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Same visibility contract as the desktop rail. */
  const shouldShowItem = useCallback((item: NavItem, sectionKey?: SectionKey | null) => {
    if (item.href === "/team" && !isTeamPageVisible) return false;
    if (item.href === "/compare" && !canCompare) return false;
    if (item.href === "/business-card-scanner" && !canSeeCardScanner) return false;
    if (!isBrokerMode) {
      if (item.href === "/join") return false;
      if (sectionKey === "BROKER & ACADEMY") return false;
      if (item.href.startsWith("/broker") || item.href === "/broker-toolkit" || item.href === "/jbj-academy") return false;
      if (item.label === "Career Portal") return false;
    }
    if (!isInvestorMode && sectionKey === "INVESTOR") return false;
    return true;
  }, [isTeamPageVisible, canCompare, canSeeCardScanner, isBrokerMode, isInvestorMode]);

  const shouldShowSection = useCallback((sectionKey: SectionKey) => {
    if (sectionKey === "ADMIN & OWNER" && !isOwnerMode) return false;
    if (sectionKey === "BROKER & ACADEMY" && !isBrokerMode) return false;
    if (sectionKey === "INVESTOR" && !isInvestorMode) return false;
    return true;
  }, [isOwnerMode, isBrokerMode, isInvestorMode]);

  const { highlightItems, sectionGroups } = useMemo(() => {
    const highlights: NavItem[] = [];
    const sections: Record<string, NavItem[]> = {};
    let current: SectionKey | null = null;
    for (const item of NAV_ITEMS) {
      if (item.highlight) {
        if (shouldShowItem(item, null)) highlights.push(item);
        continue;
      }
      if (item.section) {
        const mapped = SECTION_ALIAS[item.section];
        if (mapped) {
          current = mapped;
          if (!sections[current]) sections[current] = [];
        }
      }
      if (current && shouldShowItem(item, current)) sections[current].push(item);
    }
    sections["TOOLS & WORKSPACE"] = PUBLIC_TOOLS_WORKSPACE_ITEMS
      .filter((it) => shouldShowItem(it, "TOOLS & WORKSPACE"));
    return { highlightItems: highlights, sectionGroups: sections };
  }, [shouldShowItem]);

  const activeHref = useMemo(() => {
    const all = [...NAV_ITEMS, ...PUBLIC_TOOLS_WORKSPACE_ITEMS];
    let best: string | null = null;
    let bestLen = -1;
    for (const item of all) {
      const path = hrefPath(item.href);
      const hit = path === "/"
        ? location.pathname === "/"
        : location.pathname === path || location.pathname.startsWith(`${path}/`);
      if (hit && path.length > bestLen) { best = item.href; bestLen = path.length; }
    }
    return best;
  }, [location.pathname]);

  const isActive = useCallback(
    (href: string) => activeHref !== null && hrefPath(href) === hrefPath(activeHref),
    [activeHref],
  );

  /* Open the section that owns the current route. */
  useEffect(() => {
    if (!open) return;
    for (const [section, items] of Object.entries(sectionGroups)) {
      if (items.some((item) => isActive(item.href))) {
        setOpenSection(section as SectionKey);
        return;
      }
    }
  }, [open, sectionGroups, isActive]);

  if (!open) return null;

  const rowStyle = { color: ink, WebkitTextFillColor: ink } as React.CSSProperties;

  const Row = ({ item, nested }: { item: NavItem; nested?: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        data-jj-drawer-row={nested ? "sub" : "top"}
        data-active={active ? "true" : undefined}
        className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[14px] font-medium"
        style={rowStyle}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
        <span className="flex-1 min-w-0">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="jj-drawer-layer fixed inset-0" role="dialog" aria-modal="true" aria-label="Main navigation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 w-full h-full bg-[#01120b]/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — mirrors the desktop rail language via the shared drawer hook */}
      <aside
        data-jj-mobile-drawer
        data-jj-drawer-panel
        className="absolute left-0 top-0 h-full w-[min(88vw,340px)] flex flex-col overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]"
      >
        {/* Brand band — same 56px chrome height as the rail header */}
        <div data-sidebar-brand-row="drawer" className="jj-rail-brand-band h-[56px] shrink-0 flex items-center gap-2.5 px-3">
          <img
            src={jbjMonogram}
            alt="JBJ"
            className="h-[34px] w-[34px] object-contain shrink-0"
            data-eager
          />
          <span
            className="jj-drawer-wordmark flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-[0.16em] leading-tight"
            style={rowStyle}
          >
            JBJ Global Real Estate
          </span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-lg"
            style={rowStyle}
          >
            <X className="w-5 h-5" style={{ color: "currentColor" }} />
          </button>
        </div>

        {/* Quick actions — three wide targets, no clipped labels */}
        <div className="jj-drawer-quick shrink-0 grid grid-cols-3 gap-1 px-2 py-2">
          <button
            type="button"
            onClick={() => { onClose(); onOpenSearch?.(); }}
            className="flex flex-col items-center justify-center gap-1 min-h-11 rounded-lg"
            style={rowStyle}
          >
            <Search className="w-[18px] h-[18px]" style={{ color: "currentColor" }} />
            <span className="text-[10px] font-medium">Search</span>
          </button>
          <Link
            to={user ? "/my-account" : "/auth"}
            onClick={onClose}
            className="flex flex-col items-center justify-center gap-1 min-h-11 rounded-lg"
            style={rowStyle}
          >
            <User className="w-[18px] h-[18px]" style={{ color: "currentColor" }} />
            <span className="text-[10px] font-medium">{user ? "Account" : "Sign In"}</span>
          </Link>
          <Link
            to="/shortlist"
            onClick={onClose}
            className="flex flex-col items-center justify-center gap-1 min-h-11 rounded-lg"
            style={rowStyle}
          >
            <Heart className="w-[18px] h-[18px]" style={{ color: "currentColor" }} />
            <span className="text-[10px] font-medium">Shortlist</span>
          </Link>
        </div>

        {/* Language, currency and mode get full-width rows so no label is clipped */}
        <div className="jj-drawer-prefs shrink-0 flex flex-col gap-1 px-3 pb-2">
          <div className="flex items-center justify-between min-h-11 gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={rowStyle}>Language</span>
            <LanguageSwitcher variant="compact" />
          </div>
          <div className="flex items-center justify-between min-h-11 gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={rowStyle}>Currency</span>
            <CurrencySwitcher variant="default" />
          </div>
          <div className="flex items-center justify-between min-h-11 gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={rowStyle}>Your mode</span>
            <ModeSwitcher variant="compact" showForUnselected />
          </div>
        </div>

        <span aria-hidden className="jj-drawer-rule h-px mx-3 shrink-0" />

        {/* Scrollable nav — highlights then the same accordion sections as the rail */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-2" aria-label="Site sections">
          {highlightItems.length > 0 && (
            <div className="flex flex-col gap-0.5 pb-2">
              {highlightItems.map((item) => <Row key={`hl-${item.href}-${item.label}`} item={item} />)}
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            {SECTION_KEYS.map((sectionKey) => {
              if (!shouldShowSection(sectionKey)) return null;
              const items = sectionGroups[sectionKey];
              if (!items || items.length === 0) return null;
              const SectionIcon = SECTION_ICONS[sectionKey];
              const expanded = openSection === sectionKey;
              return (
                <div key={sectionKey} className="flex flex-col">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpenSection((prev) => (prev === sectionKey ? null : sectionKey))}
                    data-jj-drawer-section
                    className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={rowStyle}
                  >
                    <SectionIcon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
                    <span className="flex-1 text-left">{sectionKey}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      style={{ color: "currentColor" }}
                    />
                  </button>
                  {expanded && (
                    <div className="jj-drawer-sub ml-4 pl-2 flex flex-col gap-0.5 py-1">
                      {items.map((item) => (
                        <Row key={`${sectionKey}-${item.href}-${item.label}`} item={item} nested />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <span aria-hidden className="jj-drawer-rule h-px mx-3 shrink-0" />

        {/* Footer — theme switch, help, support, sign out. Same order as the rail. */}
        <div className="jj-drawer-footer shrink-0 flex flex-col gap-0.5 px-2 pt-2">
          <div className="flex items-center justify-between px-3 min-h-11">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={rowStyle}>
              {isMoon ? "Night" : "Day"} theme
            </span>
            <ThemeModeToggle variant="header" />
          </div>
          <button
            type="button"
            onClick={() => { onClose(); onOpenGuide?.(); }}
            className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[13px] font-medium"
            style={rowStyle}
          >
            <HelpCircle className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
            <span className="flex-1 text-left">App &amp; Navigation Guide</span>
          </button>
          <Link
            to="/contact"
            onClick={onClose}
            className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[13px] font-medium"
            style={rowStyle}
          >
            <Headphones className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
            <span className="flex-1">Contact Us</span>
          </Link>
          <Link
            to="/ticket-hub"
            onClick={onClose}
            className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[13px] font-medium"
            style={rowStyle}
          >
            <Ticket className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
            <span className="flex-1">Support</span>
          </Link>
          {user ? (
            <button
              type="button"
              data-sidebar-auth-control
              onClick={() => { supabase.auth.signOut(); onClose(); }}
              className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[13px] font-medium"
              style={rowStyle}
            >
              <LogOut data-signout-icon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              <span data-signout-label className="flex-1 text-left">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              data-sidebar-auth-control
              onClick={onClose}
              className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[13px] font-medium"
              style={rowStyle}
            >
              <User className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              <span className="flex-1">Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
