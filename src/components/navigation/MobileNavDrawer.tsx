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
  LogOut, User, Search, HelpCircle, Headphones, Heart, Ticket, X,
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
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import InlineCurrencySelect from "@/components/search/InlineCurrencySelect";

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
        {/* Brand band — larger identity on phone: 52px monogram + two-line wordmark */}
        <div data-sidebar-brand-row="drawer" className="jj-rail-brand-band shrink-0 flex items-center gap-3 px-4 pt-3 pb-3">
          <img
            src={jbjMonogram}
            alt="JBJ"
            className="h-[52px] w-[52px] object-contain shrink-0"
            data-eager
          />
          <span
            className="jj-drawer-wordmark flex-1 min-w-0 text-[13px] font-semibold uppercase tracking-[0.14em] leading-[1.25]"
            style={rowStyle}
          >
            JBJ Global<br />Real Estate
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
                <Icon className="w-5 h-5" style={{ color: "currentColor" }} />
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

        {/* Preferences — label column, hairline divider, then one compact
            value. No duplicated globe/dollar marks on the right. */}
        <div className="jj-drawer-prefs shrink-0 flex flex-col px-3 pb-2">
          <div className="jj-drawer-pref-row flex items-stretch gap-0 min-h-[46px] px-1">
            <span className="flex w-[112px] shrink-0 items-center gap-2.5 text-[12px] font-semibold" style={rowStyle}>
              <Globe className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              Language
            </span>
            <span aria-hidden className="jj-drawer-pref-sep my-2 w-px shrink-0" />
            <span className="flex min-w-0 flex-1 items-center pl-3" style={rowStyle}>
              <LanguageSwitcher variant="compact" />
            </span>
          </div>

          <div className="jj-drawer-pref-row flex items-stretch gap-0 min-h-[46px] px-1">
            <span className="flex w-[112px] shrink-0 items-center gap-2.5 text-[12px] font-semibold" style={rowStyle}>
              <Coins className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              Currency
            </span>
            <span aria-hidden className="jj-drawer-pref-sep my-2 w-px shrink-0" />
            <span className="flex min-w-0 flex-1 items-center pl-1" style={rowStyle}>
              <span className="inline-flex h-9 min-w-0 items-center">
                <InlineCurrencySelect dark={isMoon} />
              </span>
            </span>
          </div>

          {/* Mode is READ-ONLY (PASS 319). Category changes go through the help desk. */}
          <div className="jj-drawer-pref-row flex items-stretch gap-0 min-h-[46px] px-1">
            <span className="flex w-[112px] shrink-0 items-center gap-2.5 text-[12px] font-semibold" style={rowStyle}>
              <Lock className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
              Your view
            </span>
            <span aria-hidden className="jj-drawer-pref-sep my-2 w-px shrink-0" />
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
                  {/* Every page is always visible — no accordion, no arrows. */}
                  <div
                    data-jj-drawer-section
                    className="jj-drawer-row flex items-center gap-3 rounded-lg px-3 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={rowStyle}
                  >
                    <SectionIcon className="w-[18px] h-[18px] shrink-0" style={{ color: "currentColor" }} />
                    <span className="flex-1 text-left">{sectionKey}</span>
                  </div>
                  <div className="jj-drawer-sub ml-4 pl-2 flex flex-col gap-0.5 py-1">
                    {items.map((item) => (
                      <Row key={`${sectionKey}-${item.href}-${item.label}`} item={item} nested />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </nav>

        <span aria-hidden className="jj-drawer-rule h-px mx-3 shrink-0" />

        {/* Footer — theme switch, help, support, sign out. Same order and the
            same left ink column as the rail so icons and labels line up. */}
        <div className="jj-drawer-footer shrink-0 flex flex-col gap-0.5 px-2 pt-2 pb-1">
          <div className="px-1 pb-1">
            <ThemeModeToggle variant="menu" className="jj-drawer-theme" />
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
