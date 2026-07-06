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
import { encodeFilters, decodeFilters } from "./filterUrl";


/** Session-only key for active filters. Never persist between close/re-open. */
const FILTERS_STORAGE_KEY = "jbj-active-filters";

try {
  localStorage.removeItem(FILTERS_STORAGE_KEY);
} catch {
  /* ignore privacy-mode errors */
}

function loadStoredFilters(): ShortcutFilterState | null {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
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
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(f));
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
  //   2. sessionStorage (current tab only)
  //   3. defaults
  const [filters, setFilters] = useState<ShortcutFilterState>(() => {
    if (isPropertyPage && Array.from(searchParams.keys()).length > 0) {
      return decodeFilters(searchParams);
    }
    return loadStoredFilters() ?? defaultShortcutFilters;
  });

  // Sync from URL when on property pages and URL has params; otherwise
  // hydrate from sessionStorage only. Closing/re-opening starts clean.
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
      // On non-property pages, reflect only this tab's active filters.
      const stored = loadStoredFilters();
      setFilters(stored ?? defaultShortcutFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Persist only within this browser tab. Closing and opening again resets.
  useEffect(() => {
    const isDefault =
      JSON.stringify(filters) === JSON.stringify(defaultShortcutFilters);
    if (isDefault) {
      try { sessionStorage.removeItem(FILTERS_STORAGE_KEY); localStorage.removeItem(FILTERS_STORAGE_KEY); } catch { /* noop */ }
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
      data-jj-filter-bar
      className="jj-utility-shell fixed top-[48px] right-0 z-[9996] hidden md:block transition-[left] duration-100 ease-out bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC] border-b border-[#B89555]/35 shadow-sm"
    >

      {/* pr clears the fixed right Contact-Us rail so the last chip
          ("Construction…") never gets cropped on narrow desktops. */}
      <div className="pl-3 pr-3 lg:pr-[64px] py-1">
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

