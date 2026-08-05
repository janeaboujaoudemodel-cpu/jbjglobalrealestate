/**
 * savedFilters — local, per-browser store for the "Save filter" feature on
 * /properties. Saved entries keep the exact search state so a visitor can
 * re-apply a search in one click, either from the filter header or from the
 * "Saved Filters" row inside their account menu.
 *
 * No schema change: the entry is stored as the encoded query string, which is
 * already the single source of truth for the property search.
 */
import { searchToParams, type PropertySearch } from "@/lib/propertySearch";

const KEY = "jbj-saved-filters";

export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

export function listSavedFilters(): SavedFilter[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedFilter[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
    window.dispatchEvent(new CustomEvent("jbjSavedFiltersChange"));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function saveFilter(name: string, search: PropertySearch): SavedFilter {
  const entry: SavedFilter = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || "Saved search",
    query: searchToParams(search).toString(),
    createdAt: new Date().toISOString(),
  };
  write([entry, ...listSavedFilters().filter((f) => f.query !== entry.query)]);
  return entry;
}

export function removeSavedFilter(id: string) {
  write(listSavedFilters().filter((f) => f.id !== id));
}
