/**
 * usePropertyCount — live "Show N properties" count for the search bar.
 *
 * Debounced, count-only query (`head: true`) so it stays cheap while the user
 * is still building the filter.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAreas, getRegions } from "@/data/geography";
import type { PropertySearch } from "@/lib/propertySearch";

export function usePropertyCount(filters: PropertySearch, debounceMs = 350) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const reqRef = useRef(0);

  const key = JSON.stringify(filters);

  useEffect(() => {
    const id = ++reqRef.current;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        let q = supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true);

        const regionName = filters.region
          ? getRegions(filters.country).find((r) => r.slug === filters.region)?.name
          : null;
        if (regionName) q = q.eq("emirate", regionName);

        const all = getAreas(filters.country, filters.region);
        const nameOf = (slug: string) => all.find((a) => a.slug === slug)?.name;

        const includeNames = filters.areasInclude.map(nameOf).filter(Boolean) as string[];
        if (includeNames.length) q = q.in("area_name", includeNames);

        const excludeNames = filters.areasExclude.map(nameOf).filter(Boolean) as string[];
        for (const n of excludeNames) q = q.not("area_name", "eq", n);

        if (filters.priceMin != null) q = q.gte("price_from", filters.priceMin);
        if (filters.priceMax != null) q = q.lte("price_from", filters.priceMax);
        if (filters.sizeMin != null) q = q.gte("size_min", filters.sizeMin);
        if (filters.sizeMax != null) q = q.lte("size_max", filters.sizeMax);

        if (filters.statuses.includes("ready")) q = q.eq("construction_status", "Completed");
        if (filters.labels.length) q = q.overlaps("labels", filters.labels);
        if (filters.developer) q = q.ilike("developer_name", `%${filters.developer}%`);
        if (filters.q.trim()) q = q.ilike("name", `%${filters.q.trim()}%`);

        const { count: c } = await q;
        if (reqRef.current === id) setCount(c ?? 0);
      } catch {
        if (reqRef.current === id) setCount(null);
      } finally {
        if (reqRef.current === id) setLoading(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debounceMs]);

  return { count, loading };
}
