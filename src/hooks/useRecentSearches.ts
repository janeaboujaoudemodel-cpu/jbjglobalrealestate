import { useState, useCallback, useEffect } from "react";

export type RecentItemType = "property" | "developer" | "area";

export interface RecentItem {
  id: string;
  type: RecentItemType;
  name: string;
  slug: string;
  imageUrl?: string;
  subtitle?: string; // e.g. developer name, emirate, price
  viewedAt: number;
}

const STORAGE_KEY = "jbj_recent_searches";
const MAX_ITEMS_PER_TYPE = 10;
const MAX_TOTAL = 30;

function loadItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: RecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_TOTAL)));
  } catch {}
}

export function useRecentSearches(filterType?: RecentItemType) {
  const [items, setItems] = useState<RecentItem[]>(loadItems);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadItems());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const trackView = useCallback((item: Omit<RecentItem, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const updated: RecentItem[] = [{ ...item, viewedAt: Date.now() }, ...filtered];
      // Cap per type
      const counts: Record<string, number> = {};
      const capped = updated.filter((i) => {
        counts[i.type] = (counts[i.type] || 0) + 1;
        return counts[i.type] <= MAX_ITEMS_PER_TYPE;
      });
      saveItems(capped);
      return capped;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = filterType ? items.filter((i) => i.type === filterType) : items;

  return { items: filtered, trackView, clearAll };
}
