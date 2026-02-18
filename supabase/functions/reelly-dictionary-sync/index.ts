import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, REELLY_API_ENDPOINTS, fetchReellyWithRetry } from "../_shared/reelly-types.ts";

/**
 * reelly-dictionary-sync
 *
 * Fetches all metadata/dictionary endpoints from the Reelly API and caches them in:
 *   - reelly_dictionaries table (statuses, unit types, regions, countries)
 *   - developers table (logo URLs via /developers/logos fast endpoint)
 *
 * Called on-demand and wired into daily-reelly-auto-sync.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const skipLogos = body.skip_logos === true;

    const results: Record<string, unknown> = {};
    const errors: string[] = [];

    // ---- Helper: upsert dictionary rows ----
    async function upsertDict(dictType: string, entries: Array<{ key: string; label: string; metadata?: Record<string, unknown> }>) {
      if (!entries.length) return;
      const rows = entries.map(e => ({
        dict_type: dictType,
        key: e.key,
        label: e.label,
        metadata: e.metadata || null,
        fetched_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from("reelly_dictionaries")
        .upsert(rows, { onConflict: "dict_type,key" });
      if (error) throw new Error(`upsertDict(${dictType}): ${error.message}`);
    }

    // ---- 1. Construction Statuses ----
    try {
      console.log("[dictionary-sync] Fetching construction statuses...");
      const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.projectStatuses, apiKey);
      if (res.ok) {
        const data = await res.json();
        // API returns an object like { under_construction: "Under Construction", ... }
        // or array [{key, label}]
        let entries: Array<{ key: string; label: string }> = [];
        if (Array.isArray(data)) {
          entries = data.map((item: any) => ({ key: item.key || item.value || item, label: item.label || item.name || item }));
        } else if (typeof data === "object") {
          entries = Object.entries(data).map(([k, v]) => ({ key: k, label: String(v) }));
        }
        await upsertDict("construction_statuses", entries);
        results.construction_statuses = { count: entries.length };
      } else {
        const txt = await res.text();
        console.warn(`[dictionary-sync] construction statuses: ${res.status} - ${txt.slice(0, 200)}`);
        results.construction_statuses = { skipped: true, status: res.status };
      }
    } catch (e: any) {
      errors.push(`construction_statuses: ${e.message}`);
    }

    // ---- 2. Sale Statuses ----
    try {
      console.log("[dictionary-sync] Fetching sale statuses...");
      const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.projectSaleStatuses, apiKey);
      if (res.ok) {
        const data = await res.json();
        let entries: Array<{ key: string; label: string }> = [];
        if (Array.isArray(data)) {
          entries = data.map((item: any) => ({ key: item.key || item.value || item, label: item.label || item.name || item }));
        } else if (typeof data === "object") {
          entries = Object.entries(data).map(([k, v]) => ({ key: k, label: String(v) }));
        }
        await upsertDict("sale_statuses", entries);
        results.sale_statuses = { count: entries.length };
      } else {
        const txt = await res.text();
        console.warn(`[dictionary-sync] sale statuses: ${res.status} - ${txt.slice(0, 200)}`);
        results.sale_statuses = { skipped: true, status: res.status };
      }
    } catch (e: any) {
      errors.push(`sale_statuses: ${e.message}`);
    }

    // ---- 3. Unit Types ----
    try {
      console.log("[dictionary-sync] Fetching unit types...");
      const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.unitTypes, apiKey);
      if (res.ok) {
        const data = await res.json();
        let entries: Array<{ key: string; label: string }> = [];
        if (Array.isArray(data)) {
          entries = data.map((item: any) => ({
            key: String(item.key || item.id || item.value || item),
            label: String(item.label || item.name || item),
          }));
        } else if (typeof data === "object") {
          entries = Object.entries(data).map(([k, v]) => ({ key: k, label: String(v) }));
        }
        await upsertDict("unit_types", entries);
        results.unit_types = { count: entries.length };
      } else {
        const txt = await res.text();
        console.warn(`[dictionary-sync] unit types: ${res.status} - ${txt.slice(0, 200)}`);
        results.unit_types = { skipped: true, status: res.status };
      }
    } catch (e: any) {
      errors.push(`unit_types: ${e.message}`);
    }

    // ---- 4. Regions ----
    try {
      console.log("[dictionary-sync] Fetching regions...");
      const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.regions, apiKey);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        const entries = list.map((item: any) => ({
          key: String(item.id || item.key || item.slug || item.name || item),
          label: String(item.name || item.label || item),
          metadata: { country: item.country, code: item.code },
        }));
        await upsertDict("regions", entries);
        results.regions = { count: entries.length };
      } else {
        const txt = await res.text();
        console.warn(`[dictionary-sync] regions: ${res.status} - ${txt.slice(0, 200)}`);
        results.regions = { skipped: true, status: res.status };
      }
    } catch (e: any) {
      errors.push(`regions: ${e.message}`);
    }

    // ---- 5. Countries ----
    try {
      console.log("[dictionary-sync] Fetching countries...");
      const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.countries, apiKey);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        const entries = list.map((item: any) => ({
          key: String(item.id || item.code || item.key || item.name || item),
          label: String(item.name || item.label || item),
          metadata: { code: item.code },
        }));
        await upsertDict("countries", entries);
        results.countries = { count: entries.length };
      } else {
        const txt = await res.text();
        console.warn(`[dictionary-sync] countries: ${res.status} - ${txt.slice(0, 200)}`);
        results.countries = { skipped: true, status: res.status };
      }
    } catch (e: any) {
      errors.push(`countries: ${e.message}`);
    }

    // ---- 6. Developer Logos (fast bulk refresh) ----
    if (!skipLogos) {
      try {
        console.log("[dictionary-sync] Fetching developer logos (fast bulk)...");
        const res = await fetchReellyWithRetry(REELLY_API_ENDPOINTS.developerLogos, apiKey);
        if (res.ok) {
          const data = await res.json();
          const list: Array<any> = Array.isArray(data) ? data : (data.results || []);
          let updated = 0;
          let notFound = 0;
          for (const item of list) {
            const reellyId: number = item.id;
            const logoUrl: string | null = item.logo?.url || item.logo || null;
            if (!reellyId || !logoUrl) continue;
            // Match by reelly_id
            const { data: dev } = await supabase
              .from("developers")
              .select("id, logo_url")
              .eq("reelly_id", reellyId)
              .maybeSingle();
            if (dev) {
              if (dev.logo_url !== logoUrl) {
                await supabase.from("developers").update({ logo_url: logoUrl, updated_at: new Date().toISOString() }).eq("id", dev.id);
                updated++;
              }
            } else {
              notFound++;
            }
          }
          results.developer_logos = { total: list.length, updated, not_found: notFound };
          console.log(`[dictionary-sync] Developer logos: ${list.length} fetched, ${updated} updated`);
        } else {
          const txt = await res.text();
          console.warn(`[dictionary-sync] developer logos: ${res.status} - ${txt.slice(0, 200)}`);
          results.developer_logos = { skipped: true, status: res.status };
        }
      } catch (e: any) {
        errors.push(`developer_logos: ${e.message}`);
      }
    } else {
      results.developer_logos = { skipped: true, reason: "skip_logos=true" };
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        results,
        errors,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errors.length === 0 ? 200 : 207,
      }
    );
  } catch (e: any) {
    console.error("[dictionary-sync] Fatal:", e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
