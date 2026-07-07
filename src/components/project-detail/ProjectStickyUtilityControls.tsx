import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Search, SlidersHorizontal } from "lucide-react";

import CurrencySwitcher from "@/components/CurrencySwitcher";
import ModeSwitcher from "@/components/ModeSwitcher";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import UserAvatarMenu from "@/components/navigation/UserAvatarMenu";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import { HeaderControl, HeaderSegmented } from "@/components/ui/ds/HeaderControl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { defaultShortcutFilters, type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";

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
  if (f.sizeMin) p.set("sizeMin", f.sizeMin);
  if (f.sizeMax) p.set("sizeMax", f.sizeMax);
  if (f.views.length) p.set("views", f.views.join(","));
  if (f.paymentPlanMax < 100) p.set("paymentPlanMax", String(f.paymentPlanMax));
  if (f.postHandoverOnly) p.set("postHandoverOnly", "1");
  if (f.handoverFrom.year !== "2025" || f.handoverFrom.quarter !== "Q1") {
    p.set("handoverFrom", `${f.handoverFrom.quarter}-${f.handoverFrom.year}`);
  }
  if (f.handoverTo.year !== "2035" || f.handoverTo.quarter !== "Q4") {
    p.set("handoverTo", `${f.handoverTo.quarter}-${f.handoverTo.year}`);
  }
  if (f.propertyCategory) p.set("category", f.propertyCategory);
  return p;
}

interface ProjectStickyUtilityControlsProps {
  filters: ShortcutFilterState;
  onFilterChange: (filters: ShortcutFilterState) => void;
}

export default function ProjectStickyUtilityControls({ filters, onFilterChange }: ProjectStickyUtilityControlsProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [searchAnchor, setSearchAnchor] = useState<DOMRect | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<DOMRect | null>(null);
  const [areaUnit, setAreaUnit] = useState<"sqft" | "sqm">(() => {
    if (typeof window === "undefined") return "sqft";
    return (localStorage.getItem("jj_area_unit") as "sqft" | "sqm") || "sqft";
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "sqft" || detail === "sqm") setAreaUnit(detail);
    };
    window.addEventListener("areaUnitChange", handler);
    return () => window.removeEventListener("areaUnitChange", handler);
  }, []);

  const setUnit = (unit: "sqft" | "sqm") => {
    setAreaUnit(unit);
    localStorage.setItem("jj_area_unit", unit);
    window.dispatchEvent(new CustomEvent("areaUnitChange", { detail: unit }));
  };

  const handleAdvancedFilterChange = (newFilters: ShortcutFilterState) => {
    onFilterChange(newFilters || defaultShortcutFilters);
    window.dispatchEvent(new CustomEvent("globalFilterChange", { detail: newFilters }));
    const qs = encodeFiltersToURL(newFilters).toString();
    navigate(`/properties${qs ? `?${qs}` : ""}`);
  };

  return (
    <>
      <div className="flex w-full items-center gap-2 overflow-x-auto overscroll-x-contain px-2 py-2 scrollbar-hide" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HeaderControl
              ref={searchTriggerRef}
              shape="circle"
              tone="emerald"
              aria-label="Search"
              onClick={() => {
                setSearchAnchor(searchTriggerRef.current?.getBoundingClientRect() ?? null);
                setSearchOpen(true);
              }}
            >
              <Search />
            </HeaderControl>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs">Search anything</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <HeaderControl
              ref={filterTriggerRef}
              shape="circle"
              tone="emerald"
              aria-label="Advanced filters"
              onClick={() => {
                setFilterAnchor(filterTriggerRef.current?.getBoundingClientRect() ?? null);
                setFilterOpen(true);
              }}
            >
              <SlidersHorizontal />
            </HeaderControl>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs">Advanced filters</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/favorites" className="contents" aria-label="Favorites">
              <HeaderControl shape="circle" tone="emerald" aria-label="Favorites" onClick={(e) => { e.preventDefault(); navigate("/favorites"); }}>
                <Heart style={{ fill: "none" }} />
              </HeaderControl>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs">Favorites</TooltipContent>
        </Tooltip>

        <div className="ml-auto flex items-center gap-2">
          <HeaderSegmented
            value={areaUnit}
            onChange={(value) => setUnit(value as "sqft" | "sqm")}
            options={[
              { value: "sqft", label: "sq ft", "aria-label": "Square feet" },
              { value: "sqm", label: "sq m", "aria-label": "Square meters" },
            ]}
          />
          <CurrencySwitcher variant="flag" />
          <ModeSwitcher variant="header" showForUnselected />
          {user ? (
            <UserAvatarMenu onOpenFilters={() => setFilterOpen(true)} />
          ) : (
            <HeaderControl shape="pill" tone="emerald" aria-label="Sign in" onClick={() => navigate("/auth")} className="uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-white/85" />
              <span>Sign in</span>
            </HeaderControl>
          )}
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} anchorRect={searchAnchor} />
      <AdvancedFilterPanel open={filterOpen} onOpenChange={setFilterOpen} filters={filters} onFilterChange={handleAdvancedFilterChange} anchorRect={filterAnchor} />
    </>
  );
}