/**
 * Search history & pinned shortcuts for GlobalSearchModal.
 * - Recents auto-expire after 7 days.
 * - Pinned shortcuts persist until the user removes them.
 */

const RECENT_KEY = "jbj_recent_queries_v2";
const SHORTCUTS_KEY = "jbj_search_shortcuts_v1";
const LEGACY_KEY = "jbj_recent_queries";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RECENT = 8;
const MAX_SHORTCUTS = 12;

export interface RecentSearch {
  q: string;
  ts: number;
}

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

export const getRecentSearches = (): string[] => {
  if (typeof window === "undefined") return [];
  // Migrate legacy plain-string array if present
  const legacy = safeParse<string[]>(localStorage.getItem(LEGACY_KEY), []);
  if (legacy.length && !localStorage.getItem(RECENT_KEY)) {
    const migrated: RecentSearch[] = legacy.map((q) => ({ q, ts: Date.now() }));
    localStorage.setItem(RECENT_KEY, JSON.stringify(migrated));
    localStorage.removeItem(LEGACY_KEY);
  }
  const stored = safeParse<RecentSearch[]>(localStorage.getItem(RECENT_KEY), []);
  const cutoff = Date.now() - WEEK_MS;
  const fresh = stored.filter((r) => r && typeof r.q === "string" && r.ts > cutoff);
  if (fresh.length !== stored.length) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(fresh));
  }
  return fresh.map((r) => r.q);
};

export const saveRecentSearch = (query: string) => {
  if (typeof window === "undefined") return;
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return;
  const stored = safeParse<RecentSearch[]>(localStorage.getItem(RECENT_KEY), [])
    .filter((r) => r && r.q && r.q.toLowerCase() !== trimmed.toLowerCase());
  const updated = [{ q: trimmed, ts: Date.now() }, ...stored].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

export const clearRecentSearches = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
  localStorage.removeItem(LEGACY_KEY);
};

export const getSearchShortcuts = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(SHORTCUTS_KEY), []);
};

export const isShortcutPinned = (query: string): boolean => {
  const q = query.trim().toLowerCase();
  return getSearchShortcuts().some((s) => s.toLowerCase() === q);
};

export const toggleSearchShortcut = (query: string): boolean => {
  if (typeof window === "undefined") return false;
  const trimmed = query.trim();
  if (!trimmed) return false;
  const current = getSearchShortcuts();
  const lower = trimmed.toLowerCase();
  const exists = current.some((s) => s.toLowerCase() === lower);
  const next = exists
    ? current.filter((s) => s.toLowerCase() !== lower)
    : [trimmed, ...current].slice(0, MAX_SHORTCUTS);
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(next));
  return !exists;
};

export const removeSearchShortcut = (query: string) => {
  if (typeof window === "undefined") return;
  const lower = query.trim().toLowerCase();
  const next = getSearchShortcuts().filter((s) => s.toLowerCase() !== lower);
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(next));
};
