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

/** localStorage key for persisting the user's last-used filters */
const FILTERS_STORAGE_KEY = "jbj-active-filters";

function loadStoredFilters(): ShortcutFilterState | null {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Merge over defaults so newly added fields don't break old saves
    return { ...defaultShortcutFilters, ...parsed };
  } catch {
    return null;
  }
}

function saveStoredFilters(f: ShortcutFilterState) {
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(f));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
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

  // Initial state precedence:
  //   1. URL params if on a property page AND any filter param is present
  //   2. localStorage (user's last-used filters)
  //   3. defaults
  const [filters, setFilters] = useState<ShortcutFilterState>(() => {
    if (isPropertyPage && Array.from(searchParams.keys()).length > 0) {
      return decodeFilters(searchParams);
    }
    return loadStoredFilters() ?? defaultShortcutFilters;
  });

  // Sync from URL when on property pages and URL has params; otherwise
  // hydrate from localStorage so refreshing /properties with a bare URL
  // restores the user's last filters and the bar stays in sync across pages.
  useEffect(() => {
    if (isPropertyPage) {
      const hasUrlFilters = Array.from(searchParams.keys()).length > 0;
      if (hasUrlFilters) {
        setFilters(decodeFilters(searchParams));
      } else {
        const stored = loadStoredFilters();
        if (stored) {
          setFilters(stored);
          // Reflect restored filters in the URL so downstream pages
          // (which read from URL) pick them up immediately.
          const params = encodeFilters(stored);
          const qs = params.toString();
          if (qs) {
            navigate(`${location.pathname}?${qs}`, { replace: true });
          }
        }
      }
    } else {
      // On non-property pages, reflect the persisted filters in the bar
      // so the user sees their selections everywhere.
      const stored = loadStoredFilters();
      setFilters(stored ?? defaultShortcutFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Persist every change to localStorage (skip pure-default state to keep
  // storage clean after a Reset All).
  useEffect(() => {
    const isDefault =
      JSON.stringify(filters) === JSON.stringify(defaultShortcutFilters);
    if (isDefault) {
      try { localStorage.removeItem(FILTERS_STORAGE_KEY); } catch { /* noop */ }
    } else {
      saveStoredFilters(filters);
    }
  }, [filters]);

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
