import { useCallback, useEffect, useState } from "react";

export type ShortlistBadge = "top1" | "top2" | "top3";
export type ShortlistBadgeValue = ShortlistBadge | null;

const BADGES_KEY = "jj_shortlist_badges_v1";

type BadgeMap = Record<string, ShortlistBadgeValue>;

export function useShortlistBadges() {
  const [badges, setBadges] = useState<BadgeMap>({});

  useEffect(() => {
    const raw = localStorage.getItem(BADGES_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BadgeMap;
      setBadges(parsed || {});
    } catch {
      setBadges({});
    }
  }, []);

  const persist = useCallback((next: BadgeMap) => {
    setBadges(next);
    localStorage.setItem(BADGES_KEY, JSON.stringify(next));
  }, []);

  const getBadge = useCallback(
    (projectId: string): ShortlistBadgeValue => badges[projectId] ?? null,
    [badges],
  );

  const setBadge = useCallback(
    (projectId: string, badge: ShortlistBadgeValue) => {
      persist(
        Object.fromEntries(
          Object.entries(badges)
            // Remove badge from any other project (one Top 1/2/3 at a time)
            .map(([id, b]) => {
              if (badge && b === badge && id !== projectId) return [id, null];
              return [id, b];
            })
            // Set badge on current project
            .map(([id, b]) => (id === projectId ? [id, badge] : [id, b]))
            // Ensure the projectId exists in the map when setting a badge
            .concat(badge !== null && !(projectId in badges) ? [[projectId, badge]] : []),
        ) as BadgeMap,
      );
    },
    [badges, persist],
  );

  const clearBadgesFor = useCallback(
    (projectIds: string[]) => {
      const set = new Set(projectIds);
      const next: BadgeMap = {};
      for (const [id, badge] of Object.entries(badges)) {
        if (set.has(id)) next[id] = badge;
      }
      persist(next);
    },
    [badges, persist],
  );

  return { badges, getBadge, setBadge, clearBadgesFor };
}
