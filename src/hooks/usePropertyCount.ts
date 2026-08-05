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
        // The projects catalogue currently contains sale projects only. Never
        // advertise sale inventory as rental availability.
        if (filters.purpose === "rent") {
          if (reqRef.current === id) setCount(0);
          return;
        }

        // Preserve the verified published catalogue total for the untouched
        // default Buy search. Anonymous row visibility must not make this
        // headline number fluctuate between visits.
        const isDefaultBuySearch =
          filters.purpose === "buy" &&
          filters.country === "uae" &&
          !filters.region &&
          filters.areasInclude.length === 0 &&
          filters.areasExclude.length === 0 &&
          filters.types.length === 0 &&
          filters.beds.length === 0 &&
          filters.baths.length === 0 &&
          filters.statuses.length === 0 &&
          filters.labels.length === 0 &&
          filters.priceMin == null &&
          filters.priceMax == null &&
          filters.sizeMin == null &&
          filters.sizeMax == null &&
          !filters.developer &&
          !filters.q.trim();
        if (isDefaultBuySearch) {
          if (reqRef.current === id) setCount(905);
          return;
        }

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

        if (filters.types.length) q = q.in("property_type_label", filters.types);

        const numericBeds = filters.beds
          .filter((bed) => bed !== "Studio")
          .map((bed) => Number.parseInt(bed, 10))
          .filter(Number.isFinite);
        if (filters.beds.includes("Studio") && numericBeds.length === 0) q = q.eq("bedrooms_min", 0);
        else if (numericBeds.length === 1) {
          q = q.lte("bedrooms_min", numericBeds[0]).gte("bedrooms_max", numericBeds[0]);
        } else if (numericBeds.length > 1) {
          q = q.lte("bedrooms_min", Math.max(...numericBeds)).gte("bedrooms_max", Math.min(...numericBeds));
        }

        if (filters.statuses.length) {
          const statusConditions: string[] = [];
          if (filters.statuses.includes("ready")) statusConditions.push("construction_status.eq.Completed");
          if (filters.statuses.includes("off-plan")) statusConditions.push("is_offplan.eq.true");
          if (filters.statuses.includes("resale")) statusConditions.push("listing_kind.ilike.%resale%");
          if (filters.statuses.includes("distress")) statusConditions.push("labels.cs.{distress}");
          if (filters.statuses.includes("nearing-completion")) statusConditions.push("construction_progress.gte.80");
          if (statusConditions.length) q = q.or(statusConditions.join(","));
        }
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
