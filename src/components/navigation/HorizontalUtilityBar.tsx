import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Heart } from "lucide-react";
import ModeSwitcher from "@/components/ModeSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CurrencySwitcher from "@/components/CurrencySwitcher";

import { useUserMode } from "@/hooks/useUserMode";
import { useAuth } from "@/contexts/AuthContext";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import UserAvatarMenu from "@/components/navigation/UserAvatarMenu";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import { defaultShortcutFilters, type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";

/** Encode filter state into URLSearchParams */
function encodeFiltersToURL(f: ShortcutFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.searchQuery) p.set("q", f.searchQuery);
  if (f.priceMin) p.set("priceMin", f.priceMin);
  if (f.priceMax) p.set("priceMax", f.priceMax);
  if (f.bedrooms.length) p.set("bedrooms", f.bedrooms.join(","));
  if (f.emirates.length) p.set("emirates", f.emirates.join(","));
  if (f.areas.length) p.set("areas", f.areas.join(","));
  if (f.developers.length) p.set("developers", f.developers.join(","));
  if (f.propertyTypes.length) p.set("propertyTypes", f.propertyTypes.join(","));
  if (f.statuses.length) p.set("statuses", f.statuses.join(","));
  if (f.constructionStatuses.length) p.set("constructionStatuses", f.constructionStatuses.join(","));
  if (f.sortBy) p.set("sortBy", f.sortBy);
  if (f.hideSoldOut) p.set("hideSoldOut", "1");
  if (f.sizeMin) p.set("sizeMin", f.sizeMin);
  if (f.sizeMax) p.set("sizeMax", f.sizeMax);
  if (f.views.length) p.set("views", f.views.join(","));
  if (f.propertyCategory) p.set("category", f.propertyCategory);
  return p;
}

function decodeFiltersFromURL(p: URLSearchParams): ShortcutFilterState {
  return {
    ...defaultShortcutFilters,
    searchQuery: p.get("q") || p.get("keyword") || p.get("search") || "",
    priceMin: p.get("priceMin") || "",
    priceMax: p.get("priceMax") || "",
    bedrooms: p.get("bedrooms")?.split(",").filter(Boolean) || [],
    emirates: p.get("emirates")?.split(",").filter(Boolean) || (p.get("emirate") ? [p.get("emirate")!] : []),
    areas: p.get("areas")?.split(",").filter(Boolean) || (p.get("area") ? [p.get("area")!.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())] : []),
    developers: p.get("developers")?.split(",").filter(Boolean) || [],
    propertyTypes: p.get("propertyTypes")?.split(",").filter(Boolean) || [],
    statuses: p.get("statuses")?.split(",").filter(Boolean) || (p.get("status") ? [p.get("status")!] : []),
    constructionStatuses: p.get("constructionStatuses")?.split(",").filter(Boolean) || [],
    sortBy: (p.get("sortBy") as ShortcutFilterState["sortBy"]) || null,
    hideSoldOut: p.get("hideSoldOut") === "1",
    sizeMin: p.get("sizeMin") || "",
    sizeMax: p.get("sizeMax") || "",
    views: p.get("views")?.split(",").filter(Boolean) || [],
    propertyCategory: (p.get("category") as "residential" | "commercial") || null,
  };
}

export default function HorizontalUtilityBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jj_area_unit') as 'sqft' | 'sqm') || 'sqft';
    }
    return 'sqft';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'sqft' || detail === 'sqm') setAreaUnit(detail);
    };
    window.addEventListener('areaUnitChange', handler);
    return () => window.removeEventListener('areaUnitChange', handler);
  }, []);

  const toggleAreaUnit = () => {
    const next = areaUnit === 'sqft' ? 'sqm' : 'sqft';
    setAreaUnit(next);
    localStorage.setItem('jj_area_unit', next);
    window.dispatchEvent(new CustomEvent('areaUnitChange', { detail: next }));
  };

  const handleFilterChange = (newFilters: ShortcutFilterState) => {
    setFilterState(newFilters);
    const p = encodeFiltersToURL(newFilters);
    const qs = p.toString();
    navigate(`/properties${qs ? `?${qs}` : ''}`);
  };

  return (
    <>
      <div
        data-jj-utility-bar
        className="fixed top-0 right-0 h-[88px] [body.jj-vertical-nav-collapsed_&]:h-[48px] z-[9998] flex items-center transition-[left,height,background-color] duration-100 ease-out [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px] px-5 xl:px-7 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#047857]/35 after:to-transparent"
      >


        {/* ── LEFT: Search only ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-no-contrast-guard
                onClick={() => setSearchOpen(true)}
                style={{ color: "#FFFFFF", backgroundImage: "var(--jj-emerald-ombre)" }}
                className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none hover:brightness-110 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
                aria-label="Search"
              >
                <Search
                  data-no-contrast-guard
                  className="w-[18px] h-[18px]"
                  style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Search anything</TooltipContent>
          </Tooltip>
        </div>

        {/* ── RIGHT: Filter · Favorites · Sq ft/m · Currency · Mode · Avatar ── */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-no-contrast-guard
                onClick={() => setFilterOpen(true)}
                style={{ color: "#FFFFFF", backgroundImage: "var(--jj-emerald-ombre)" }}
                className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none hover:brightness-110 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
                aria-label="Filter"
              >
                <SlidersHorizontal
                  data-no-contrast-guard
                  className="w-[18px] h-[18px]"
                  style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Advanced filters</TooltipContent>
          </Tooltip>

          {/* Favorites */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/favorites"
                data-no-contrast-guard
                style={{ color: "#FFFFFF", backgroundImage: "var(--jj-emerald-ombre)" }}
                className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none hover:brightness-110 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
                aria-label="Favorites"
              >
                <Heart
                  data-no-contrast-guard
                  className="w-[18px] h-[18px]"
                  style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none" }}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Favorites</TooltipContent>
          </Tooltip>

          {/* Sq ft / Sq m — restored metallic animated active state */}
          <div
            data-no-contrast-guard
            data-surface="light"
            className="hidden sm:inline-flex items-center h-7 rounded-lg border border-[#B89555]/60 overflow-hidden bg-transparent relative"
          >
            <button
              data-no-contrast-guard
              onClick={() => { if (areaUnit !== 'sqft') toggleAreaUnit(); }}
              className={`relative px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-all duration-300 overflow-hidden ${areaUnit === 'sqft' ? 'jj-metallic-active' : 'bg-transparent text-[#B89555]/70 hover:text-[#B89555]'}`}
              style={areaUnit === 'sqft' ? { color: '#3a2a08' } : undefined}
              aria-label="Square feet"
            >sq ft</button>
            <button
              data-no-contrast-guard
              onClick={() => { if (areaUnit !== 'sqm') toggleAreaUnit(); }}
              className={`relative px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-all duration-300 border-l border-[#B89555]/40 overflow-hidden ${areaUnit === 'sqm' ? 'jj-metallic-active' : 'bg-transparent text-[#B89555]/70 hover:text-[#B89555]'}`}
              style={areaUnit === 'sqm' ? { color: '#3a2a08' } : undefined}
              aria-label="Square meters"
            >sq m</button>
          </div>

          {/* Inline metallic keyframes for the active pill */}
          <style>{`
            @keyframes jj-metal-sheen {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .jj-metallic-active {
              background-image: linear-gradient(120deg, #d8b86a 0%, #f4e3a8 25%, #b89555 50%, #f4e3a8 75%, #d8b86a 100%);
              background-size: 220% 220%;
              animation: jj-metal-sheen 4.5s ease-in-out infinite;
              box-shadow: inset 0 0 0 1px rgba(255,244,210,.45), inset 0 -1px 2px rgba(0,0,0,.18);
            }
          `}</style>



          {/* Currency — flag + AED */}
          <CurrencySwitcher variant="flag" />

          {/* Mode chip */}
          <ModeSwitcher variant="header" showForUnselected />

          {/* User avatar OR Sign in */}
          {user ? (
            <UserAvatarMenu onOpenFilters={() => setFilterOpen(true)} />
          ) : (
            <Link
              to="/auth"
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/45 hover:bg-[#1A1A1A]/[0.04] transition-colors text-[12px] font-semibold tracking-wide text-[#1A1A1A] uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/60" />
              Sign in
            </Link>
          )}
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />

      <AdvancedFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filterState}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
