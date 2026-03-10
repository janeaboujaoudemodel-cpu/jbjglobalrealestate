import { useMemo } from "react";
import { useRecentSearches } from "@/hooks/useRecentSearches";

export interface UserBrowsingContext {
  dominantArea: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  recentAreas: string[];
  recentProjectIds: string[];
  hasData: boolean;
}

/**
 * Extracts the user's browsing context from recent searches stored in localStorage.
 * Used by RecommendedProjects to show behavior-aware recommendations.
 */
export function useUserBrowsingContext(): UserBrowsingContext {
  const { items } = useRecentSearches();

  return useMemo(() => {
    const propertyItems = items.filter((i) => i.type === "property");
    const areaItems = items.filter((i) => i.type === "area");

    if (propertyItems.length === 0 && areaItems.length === 0) {
      return { dominantArea: null, budgetMin: null, budgetMax: null, recentAreas: [], recentProjectIds: [], hasData: false };
    }

    // Count area mentions from both property subtitles and area views
    const areaCounts: Record<string, number> = {};
    propertyItems.forEach((p) => {
      const area = p.subtitle?.split(",")[0]?.trim();
      if (area) areaCounts[area] = (areaCounts[area] || 0) + 1;
    });
    areaItems.forEach((a) => {
      areaCounts[a.name] = (areaCounts[a.name] || 0) + 2; // weight area views more
    });

    const dominantArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const recentAreas = Object.keys(areaCounts);
    const recentProjectIds = propertyItems.map((p) => p.id);

    // Budget from subtitle parsing (e.g., "AED 1,200,000") — simplified
    // In practice, the price info isn't stored in recent searches
    // This is a placeholder for future enrichment
    return {
      dominantArea,
      budgetMin: null,
      budgetMax: null,
      recentAreas,
      recentProjectIds,
      hasData: true,
    };
  }, [items]);
}
