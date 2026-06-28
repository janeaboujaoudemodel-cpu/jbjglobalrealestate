import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Heart } from "lucide-react";
import ModeSwitcher from "@/components/ModeSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CurrencySwitcher from "@/components/CurrencySwitcher";

import { useAuth } from "@/contexts/AuthContext";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import UserAvatarMenu from "@/components/navigation/UserAvatarMenu";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import { defaultShortcutFilters, type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";
import { HeaderControl, HeaderSegmented } from "@/components/ui/ds/HeaderControl";

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
        className="jj-utility-shell fixed top-0 right-0 h-[88px] [body.jj-vertical-nav-collapsed_&]:h-[48px] z-[9998] flex items-center transition-[left,height,background-color] duration-100 ease-out px-5 xl:px-7 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#B89555] after:to-transparent"
      >


        {/* ── LEFT: Search only ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <HeaderControl
                shape="circle"
                tone="emerald"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search />
              </HeaderControl>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Search anything</TooltipContent>
          </Tooltip>
        </div>

        {/* ── RIGHT: Filter · Favorites · Sq ft/m · Currency · Mode · Avatar ── */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <HeaderControl
                shape="circle"
                tone="emerald"
                aria-label="Filter"
                onClick={() => setFilterOpen(true)}
              >
                <SlidersHorizontal />
              </HeaderControl>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Advanced filters</TooltipContent>
          </Tooltip>

          {/* Favorites */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/favorites" aria-label="Favorites" className="contents">
                <HeaderControl
                  shape="circle"
                  tone="emerald"
                  aria-label="Favorites"
                  onClick={(e) => { e.preventDefault(); navigate("/favorites"); }}
                >
                  <Heart style={{ fill: "none" }} />
                </HeaderControl>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Favorites</TooltipContent>
          </Tooltip>

          {/* Sq ft / Sq m — DS segmented control */}
          <HeaderSegmented
            className="hidden sm:inline-flex"
            value={areaUnit}
            onChange={(v) => {
              if (v !== areaUnit) toggleAreaUnit();
            }}
            options={[
              { value: "sqft", label: "sq ft", "aria-label": "Square feet" },
              { value: "sqm", label: "sq m", "aria-label": "Square meters" },
            ]}
          />

          {/* Currency — flag + AED */}
          <CurrencySwitcher variant="flag" />

          {/* Mode chip */}
          <ModeSwitcher variant="header" showForUnselected />

          {/* User avatar OR Sign in */}
          {user ? (
            <UserAvatarMenu onOpenFilters={() => setFilterOpen(true)} />
          ) : (
            <HeaderControl
              shape="pill"
              tone="emerald"
              aria-label="Sign in"
              onClick={() => navigate("/auth")}
              className="uppercase tracking-wide"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/85" />
              <span>Sign in</span>
            </HeaderControl>
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
