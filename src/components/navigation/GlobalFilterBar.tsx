/**
 * GlobalFilterBar — Fixed filter bar below the HorizontalUtilityBar.
 * Renders FilterShortcutBar globally on all pages (desktop only).
 * On filter change, navigates to /properties with encoded URL params.
 */
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import FilterShortcutBar, {
  type ShortcutFilterState,
  defaultShortcutFilters,
} from "@/components/filters/FilterShortcutBar";

/** Encode filter state into URLSearchParams */
function encodeFilters(f: ShortcutFilterState): URLSearchParams {
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

/** Decode URLSearchParams into ShortcutFilterState */
function decodeFilters(p: URLSearchParams): ShortcutFilterState {
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

export default function GlobalFilterBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine if we're on a property listing page (sync filters from URL)
  const isPropertyPage =
    location.pathname === "/properties" ||
    location.pathname === "/properties-reelly" ||
    location.pathname.startsWith("/developer/");

  const [filters, setFilters] = useState<ShortcutFilterState>(() =>
    isPropertyPage ? decodeFilters(searchParams) : defaultShortcutFilters
  );

  // Sync from URL when on property pages
  useEffect(() => {
    if (isPropertyPage) {
      setFilters(decodeFilters(searchParams));
    } else {
      // Reset when navigating away from property pages
      setFilters(defaultShortcutFilters);
    }
  }, [location.pathname]);

  const handleFilterChange = useCallback(
    (next: ShortcutFilterState) => {
      setFilters(next);

      // Dispatch custom event so property pages can pick up changes immediately
      window.dispatchEvent(
        new CustomEvent("globalFilterChange", { detail: next })
      );

      // If not already on a property listing page, navigate there.
      // Defer navigation so the popover that triggered the change can
      // finish closing before the route unmounts the bar — prevents the
      // "stuck / frozen popover" feeling when toggling filters from the
      // homepage or other non-property routes.
      if (!isPropertyPage) {
        const params = encodeFilters(next);
        const qs = params.toString();
        setTimeout(() => {
          navigate(`/properties${qs ? `?${qs}` : ""}`);
        }, 0);
      }
    },
    [isPropertyPage, navigate]
  );

  return (
    <div
      className="fixed top-[48px] right-0 z-[9996] hidden md:block transition-all duration-300 bg-white border-b border-gray-200 shadow-sm [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px]"
    >
      <div className="px-3 py-1">
        <FilterShortcutBar
          variant="light"
          filters={filters}
          onFilterChange={handleFilterChange}
          resultsLabel="Properties"
        />
      </div>
    </div>
  );
}
