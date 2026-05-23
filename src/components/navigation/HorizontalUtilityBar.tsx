import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
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
        className={`fixed top-0 right-0 h-[88px] [body.jj-vertical-nav-collapsed_&]:h-[48px] z-[9998] flex items-center border-b border-[hsl(var(--gold)/0.18)] shadow-[0_1px_3px_hsl(var(--gold)/0.08)] bg-gradient-to-r from-[#FDFBF7] via-[#F7F1E6] to-[#EFE6D6] transition-[left,height] duration-100 ease-out [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px] px-5 xl:px-7`}
      >
        {/* ── LEFT: Search only ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-no-contrast-guard
                onClick={() => setSearchOpen(true)}
                style={{ color: "hsl(var(--gold))" }}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors focus:outline-none"
                aria-label="Search"
              >
                <Search
                  data-no-contrast-guard
                  className="w-[18px] h-[18px]"
                  style={{ color: "hsl(var(--gold))", stroke: "hsl(var(--gold))" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Search anything</TooltipContent>
          </Tooltip>
        </div>

        {/* ── RIGHT: Filter · Sq ft/m · Currency · Mode · Avatar ── */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                data-no-contrast-guard
                onClick={() => setFilterOpen(true)}
                style={{ color: "hsl(var(--gold))" }}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors focus:outline-none"
                aria-label="Filter"
              >
                <SlidersHorizontal
                  data-no-contrast-guard
                  className="w-[18px] h-[18px]"
                  style={{ color: "hsl(var(--gold))", stroke: "hsl(var(--gold))" }}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Advanced filters</TooltipContent>
          </Tooltip>

          {/* Sq ft / Sq m */}
          <div
            data-no-contrast-guard
            data-surface="light"
            className="hidden sm:inline-flex items-center h-7 rounded-full border border-[#B89555]/50 overflow-hidden bg-transparent"
          >
            <button
              data-no-contrast-guard
              onClick={() => { if (areaUnit !== 'sqft') toggleAreaUnit(); }}
              style={{
                backgroundColor: areaUnit === 'sqft' ? '#EFE6D6' : 'transparent',
                color: areaUnit === 'sqft' ? '#1A1A1A' : '#B89555',
              }}
              className="px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-colors"
              aria-label="Square feet"
            >sq ft</button>
            <button
              data-no-contrast-guard
              onClick={() => { if (areaUnit !== 'sqm') toggleAreaUnit(); }}
              style={{
                backgroundColor: areaUnit === 'sqm' ? '#EFE6D6' : 'transparent',
                color: areaUnit === 'sqm' ? '#1A1A1A' : '#B89555',
              }}
              className="px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-colors border-l border-[#B89555]/40"
              aria-label="Square meters"
            >sq m</button>
          </div>


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
