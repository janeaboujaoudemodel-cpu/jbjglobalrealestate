import { useState, useCallback, useEffect } from "react";

export type RecentItemType = "property" | "developer" | "area";

export interface RecentItem {
  id: string;
  type: RecentItemType;
  name: string;
  slug: string;
  imageUrl?: string;
  subtitle?: string;
  developerLogo?: string;
  viewedAt: number;
}

const STORAGE_KEY = "jbj_recent_searches";
const MAX_ITEMS_PER_TYPE = 10;
const MAX_TOTAL = 30;

const normalizeType = (value: unknown): RecentItemType | null => {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (v === "property" || v === "project" || v === "properties" || v === "projects") return "property";
  if (v === "developer" || v === "developers") return "developer";
  if (v === "area" || v === "areas" || v === "community" || v === "communities") return "area";
  return null;
};

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const normalizeItem = (raw: unknown): RecentItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const type = normalizeType(obj.type);
  if (!type) return null;

  const id =
    asString(obj.id) ||
    asString(obj.project_id) ||
    asString(obj.developer_id) ||
    asString(obj.area_id);

  const slug =
    asString(obj.slug) ||
    asString(obj.project_slug) ||
    asString(obj.developer_slug) ||
    asString(obj.area_slug);

  const name = asString(obj.name) || asString(obj.title) || asString(obj.project_name) || asString(obj.developer_name) || asString(obj.area_name);

  if (!id || !slug || !name) return null;

  const viewedAt = typeof obj.viewedAt === "number" && Number.isFinite(obj.viewedAt) ? obj.viewedAt : Date.now();
  const imageUrl = asString(obj.imageUrl) || undefined;
  const subtitle = asString(obj.subtitle) || undefined;
  const developerLogo = asString(obj.developerLogo) || undefined;

  return { id, type, name, slug, imageUrl, subtitle, developerLogo, viewedAt };
};

function loadItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeItem)
      .filter((item): item is RecentItem => item !== null)
      .sort((a, b) => b.viewedAt - a.viewedAt);

    // Deduplicate by type+slug (keep most recent)
    const seen = new Set<string>();
    return normalized.filter((item) => {
      const key = `${item.type}-${item.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_TOTAL);
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

  // Sync across tabs + refresh in active tab when visibility changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadItems());
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") setItems(loadItems());
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const trackView = useCallback((item: Omit<RecentItem, "viewedAt">) => {
    const normalized = normalizeItem({ ...item, viewedAt: Date.now() });
    if (!normalized) return;

    setItems((prev) => {
      const filtered = prev.filter((i) => !(
        (i.id === normalized.id && i.type === normalized.type) ||
        (i.slug === normalized.slug && i.type === normalized.type)
      ));
      const updated: RecentItem[] = [normalized, ...filtered];

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

  const patchItem = useCallback((id: string, type: RecentItemType, updates: Partial<RecentItem>) => {
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id && item.type === type) {
          return { ...item, ...updates };
        }
        return item;
      });
      saveItems(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const filtered = filterType ? items.filter((i) => i.type === filterType) : items;

  return { items: filtered, trackView, patchItem, clearAll };
}
