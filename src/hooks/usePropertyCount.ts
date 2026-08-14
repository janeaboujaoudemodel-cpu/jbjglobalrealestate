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
  const [inventoryRevision, setInventoryRevision] = useState(0);
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

        // Count exactly what the listing grid can render for this visitor:
        // published, not soft-deleted, and not a leasing record.
        let q = supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("is_published", true)
          .is("deleted_at", null)
          .or("listing_kind.is.null,listing_kind.neq.leasing");

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

        // Price / size are RANGES on the row (price_from…price_to,
        // size_min…size_max). A row matches when its own band OVERLAPS the
        // requested band — comparing the max against `price_from` alone kept a
        // 2M–40M tower under "max 3M" and made this count disagree with the
        // grid (useProjectFilters already uses the overlap rule).
        if (filters.priceMin != null) {
          q = q.or(
            `price_to.gte.${filters.priceMin},and(price_to.is.null,price_from.gte.${filters.priceMin})`,
          );
        }
        if (filters.priceMax != null) {
          q = q.or(
            `price_from.lte.${filters.priceMax},and(price_from.is.null,price_to.lte.${filters.priceMax})`,
          );
        }
        if (filters.sizeMin != null) {
          q = q.or(
            `size_max.gte.${filters.sizeMin},and(size_max.is.null,size_min.gte.${filters.sizeMin})`,
          );
        }
        if (filters.sizeMax != null) {
          q = q.or(
            `size_min.lte.${filters.sizeMax},and(size_min.is.null,size_max.lte.${filters.sizeMax})`,
          );
        }


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

        // PASS 298 — multi-select developer include / exclude.
        if (filters.developersInclude?.length) {
          q = q.or(
            filters.developersInclude
              .map((d) => `developer_name.ilike.%${d.replace(/[,()]/g, " ")}%`)
              .join(","),
          );
        }
        for (const d of filters.developersExclude || []) {
          q = q.not("developer_name", "ilike", `%${d.replace(/[,()]/g, " ")}%`);
        }
        if (filters.q.trim()) q = q.ilike("name", `%${filters.q.trim()}%`);

        const { count: c, error } = await q;
        if (error) throw error;
        if (reqRef.current === id) setCount(c ?? 0);
      } catch {
        if (reqRef.current === id) setCount(null);
      } finally {
        if (reqRef.current === id) setLoading(false);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debounceMs, inventoryRevision]);

  useEffect(() => {
    const channel = supabase
      .channel(`public-property-count-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => setInventoryRevision((revision) => revision + 1),
      )
      .subscribe();

    const reconcile = window.setInterval(
      () => setInventoryRevision((revision) => revision + 1),
      60_000,
    );

    return () => {
      window.clearInterval(reconcile);
      void supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading };
}
