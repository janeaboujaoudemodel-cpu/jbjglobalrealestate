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
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown, LogOut, User, Search, Headphones, Heart, Ticket, X,
  Globe, Coins, Lock,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { useTeamVisibility } from "@/hooks/useTeamVisibility";
import { useCompareAccess } from "@/hooks/useCompareAccess";
import { useGatedToolAccess } from "@/hooks/useGatedToolAccess";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, SUPPORTED_LANGUAGES, getLanguageInfo } from "@/contexts/LanguageContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CurrencySwitcher, { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";
import { useCurrency } from "@/hooks/useCurrency";
import { setCurrencyGlobal } from "@/components/search/InlineCurrencySelect";

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
}

const hrefPath = (href: string) => href.split("?")[0].split("#")[0];

/**
 * Emoji flags do not render on every device (Windows shows tofu boxes), so the
 * drawer paints a real flag image derived from the emoji's regional-indicator
 * codepoints. Falls back to the UK flag when the emoji is not a country pair.
 */
const flagSrc = (emoji: string) => {
  const cps = Array.from(emoji)
    .map((ch) => ch.codePointAt(0) ?? 0)
    .filter((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff)
    .map((cp) => String.fromCharCode(cp - 0x1f1e6 + 97))
    .join("");
  return `https://flagcdn.com/w40/${cps.length === 2 ? cps : "gb"}.png`;
};


export default function MobileNavDrawer({
  open, onClose, onOpenSearch,
}: MobileNavDrawerProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { isOwner } = useUserRole();
  const { mode, isBrokerMode, isInvestorMode } = useUserModeContext();
  const { isMoon } = useThemeMode();
  const { language, setLanguage } = useLanguage();
  const { currency } = useCurrency();
  const activeLang = getLanguageInfo(language);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { isPageVisible: isTeamPageVisible } = useTeamVisibility();
  const { allowed: canCompare } = useCompareAccess();
  const { visible: canSeeCardScanner } = useGatedToolAccess("business-card-scanner");

  const ink = isMoon ? "#FFFFFF" : "#0A0A0A";
  const isOwnerMode = isOwner && mode === "owner";

  /* Body scroll lock while the drawer is open. */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  /* PASS 351 — Sun only: the three quick glyphs wear premium gold. Global ink
     guards repaint icon strokes with !important, so the gold has to be written
     inline with the same priority. Moon is never touched. */
  useEffect(() => {
    if (!open || isMoon) return;
    const paintGold = () => {
      document
        .querySelectorAll<SVGElement>('[data-jj-drawer-panel] [data-jj-drawer-tile] svg, [data-jj-drawer-panel] [data-jj-drawer-tile] svg *')
        .forEach((node) => {
          node.style.setProperty("color", "#B89555", "important");
          if (node.tagName.toLowerCase() !== "svg") {
            node.style.setProperty("stroke", "#B89555", "important");
          }
        });
    };
    paintGold();
    const raf = window.requestAnimationFrame(paintGold);
    const t = window.setTimeout(paintGold, 220);
    return () => { window.cancelAnimationFrame(raf); window.clearTimeout(t); };
  }, [open, isMoon, user]);

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

  /* Sections start collapsed on purpose so the whole nav fits one phone
     screen (PASS 319). The user opens the one they need. */


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

  const drawer = (
    <div className="jj-drawer-layer fixed inset-0" role="dialog" aria-modal="true" aria-label="Main navigation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 w-full h-full bg-[#01120b]/55 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — mirrors the desktop rail language via the shared drawer hook.
          PASS 350: slides in from the RIGHT, next to the hamburger. */}
      <aside
        data-jj-mobile-drawer
        data-jj-drawer-panel
        data-jj-drawer-side="right"
        className="absolute right-0 top-0 h-[100dvh] w-[min(88vw,340px)] flex flex-col overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]"
      >
        {/* Brand band — one-line company identity in both skins. */}
        <div data-sidebar-brand-row="drawer" className="jj-rail-brand-band shrink-0 flex items-center gap-3 px-4 pt-3 pb-3">
          <img
            src={jbjMonogram}
            alt="JBJ"
            className="jj-drawer-monogram h-[58px] w-[58px] object-contain shrink-0"
            data-eager
          />
          <span
            className="jj-drawer-wordmark flex-1 min-w-0 whitespace-nowrap text-[12.5px] font-semibold uppercase tracking-[0.06em] leading-none pr-2"
            style={rowStyle}
          >
            JBJ Global Real Estate
          </span>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-lg"
            style={rowStyle}
          >
            <X className="w-6 h-6" style={{ color: "currentColor" }} />
          </button>
        </div>

        <span aria-hidden className="jj-drawer-rule h-px mx-4 shrink-0" />

        {/* Quick actions — three equal wide targets, no clipped labels */}
        <div className="jj-drawer-quick shrink-0 grid grid-cols-3 gap-2 px-3 pt-3 pb-2">
          {[
            { key: "search", Icon: Search, label: "Search", onClick: () => { onClose(); onOpenSearch?.(); } },
            { key: "account", Icon: User, label: user ? "Account" : "Sign In", to: user ? "/my-account" : "/auth" },
            { key: "shortlist", Icon: Heart, label: "Shortlist", to: "/shortlist" },
          ].map(({ key, Icon, label, to, onClick }) => {
            const inner = (
              <>
                 <Icon data-jj-quick-icon className="w-5 h-5" style={{ color: isMoon ? "currentColor" : "#B89555" }} />
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              </>
            );
            return to ? (
              <Link
                key={key}
                to={to}
                onClick={onClose}
                data-jj-drawer-tile
                className="flex flex-col items-center justify-center gap-1.5 min-h-[56px] rounded-xl"
                style={rowStyle}
              >
                {inner}
              </Link>
            ) : (
              <button
                key={key}
                type="button"
                onClick={onClick}
                data-jj-drawer-tile
                className="flex flex-col items-center justify-center gap-1.5 min-h-[56px] rounded-xl"
                style={rowStyle}
              >
                {inner}
              </button>
            );
          })}
        </div>

        {/* Preferences — each label and value is one aligned field. */}
        <div className="jj-drawer-prefs shrink-0 flex flex-col px-3 pb-2">
          {/* Label first, then the value cluster (flag + code + chevron) right
              beside it — no wide gap, and the chevron never touches the code. */}
          <div className="jj-drawer-pref-row flex items-center gap-2 min-h-[46px] px-1">
            <span className="w-[86px] shrink-0 text-[12px] font-semibold leading-none" style={rowStyle}>
              Language
            </span>
            <span className="flex min-w-0 flex-1 items-center" style={rowStyle}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-no-contrast-guard
                    className="inline-flex h-9 min-w-0 items-center justify-start gap-2 bg-transparent px-0"
                    aria-label="Select language"
                  >
                    <img
                      src={flagSrc(activeLang.flag)}
                      alt=""
                      aria-hidden
                      className="h-[13px] w-[20px] shrink-0 rounded-[2px] object-cover"
                    />
                    <span className="jj-drawer-pref-value text-[13px] font-bold uppercase leading-none tracking-[0.1em]">
                      {activeLang.code.slice(0, 2).toUpperCase()}
                    </span>
                    <ChevronDown className="jj-drawer-pref-value h-3.5 w-3.5 shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[10500] max-h-72 w-56 overflow-y-auto">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)} className="gap-2 text-sm">
                      <span aria-hidden>{l.flag}</span>
                      <span className="font-semibold uppercase">{l.code.slice(0, 2)}</span>
                      <span className="truncate opacity-70">{l.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>

          <div className="jj-drawer-pref-row flex items-center gap-2 min-h-[46px] px-1">
            <span className="w-[86px] shrink-0 text-[12px] font-semibold leading-none" style={rowStyle}>
              Currency
            </span>
            <span className="jj-drawer-currency flex min-w-0 flex-1 items-center" style={rowStyle}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-no-contrast-guard
                    className="inline-flex h-9 min-w-0 items-center justify-start gap-2 bg-transparent px-0"
                    aria-label="Select currency"
                  >
                    <span className="jj-drawer-pref-value text-[13px] font-bold uppercase leading-none tracking-[0.1em]">
                      {currency}
                    </span>
                    <ChevronDown className="jj-drawer-pref-value h-3.5 w-3.5 shrink-0 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[10500] max-h-72 w-56 overflow-y-auto">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <DropdownMenuItem
                      key={c.code}
                      onClick={() => setCurrencyGlobal(c.code)}
                      className="gap-2 text-sm"
                    >
                      <span className="font-semibold uppercase">{c.code}</span>
                      <span className="truncate opacity-70">{c.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>


          {/* Mode is READ-ONLY (PASS 319). Category changes go through the help desk. */}
          <div className="jj-drawer-pref-row flex items-stretch gap-0 min-h-[46px] px-1">
            <span className="flex w-[112px] shrink-0 items-center gap-2.5 text-[12px] font-semibold" style={rowStyle}>
              <Lock className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              Your view
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pl-3" style={rowStyle}>
              <span className="text-[12.5px] font-bold capitalize leading-none">{mode}</span>
              <Link
                to={`/ticket-hub?topic=mode-change&current=${mode}`}
                onClick={onClose}
                className="text-[10px] font-bold uppercase tracking-[0.12em] underline underline-offset-2 leading-none"
                style={rowStyle}
              >
                Change
              </Link>
            </span>
          </div>
        </div>


        <span aria-hidden className="jj-drawer-rule h-px mx-4 shrink-0" />


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
              return (
                <div key={sectionKey} className="flex flex-col">
                  {sectionKey === "TOOLS & WORKSPACE" ? (
                    <button
                      type="button"
                      data-jj-drawer-section
                      aria-expanded={toolsOpen}
                      onClick={() => setToolsOpen((value) => !value)}
                      className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={rowStyle}
                    >
                      <SectionIcon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
                      <span className="flex-1 text-left">{sectionKey}</span>
                    </button>
                  ) : (
                    <div
                      data-jj-drawer-section
                      className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={rowStyle}
                    >
                      <SectionIcon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
                      <span className="flex-1 text-left">{sectionKey}</span>
                    </div>
                  )}
                  {(sectionKey !== "TOOLS & WORKSPACE" || toolsOpen) && (
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

        {/* Footer — theme switch, help, support, sign out. Same order and the
            same left ink column as the rail so icons and labels line up. */}
        <div className="jj-drawer-footer shrink-0 flex flex-col gap-0.5 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+18px)]">
          <div className="px-1 pb-1">
            <ThemeModeToggle variant="menu" className="jj-drawer-theme" />
          </div>

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

  const portalRoot = document.getElementById("root");
  return createPortal(drawer, portalRoot ?? document.body);
}
