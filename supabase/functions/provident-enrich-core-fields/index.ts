import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchProvidentPageDataDetail } from "../_shared/provident/pagedata-detail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Lightweight enrichment: fills ONLY core fields (handover, bedrooms, size, description)
 * from Provident page-data. No Firecrawl. No images/docs.
 * 
 * Targets:
 * - pending_project_imports (mode=pending, default)
 * - projects table (mode=drafts)
 * - projects table published (mode=published)
 * 
 * Strategy: Fill missing only (never overwrite existing non-null values).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const mode = (body.mode as string) || "pending"; // "pending" | "drafts" | "published"
    const batchSize = Math.min(body.batch_size || 20, 100);
    const offset = body.offset || 0;

    console.log(`[CoreFieldsEnrich] mode=${mode}, batch=${batchSize}, offset=${offset}`);

    let items: Array<{
      id: string;
      name: string;
      source_url: string | null;
      handover_date: string | null;
      bedrooms_min: number | null;
      bedrooms_max: number | null;
      size_min: number | null;
      size_max: number | null;
      description: string | null;
    }> = [];

    const table = mode === "pending" ? "pending_project_imports" : "projects";

    let query = supabase
      .from(table)
      .select("id, name, source_url, handover_date, bedrooms_min, bedrooms_max, size_min, size_max, description")
      .ilike("source_url", "%providentestate.com%")
      .or("handover_date.is.null,bedrooms_min.is.null,size_min.is.null")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (mode === "pending") {
      query = query.eq("status", "pending");
    } else if (mode === "drafts") {
      query = query.or("is_published.is.null,is_published.eq.false");
    } else if (mode === "published") {
      query = query.eq("is_published", true);
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    items = data || [];

    if (items.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No items need core field enrichment",
        stats: { processed: 0, updated: 0, skipped: 0, errors: 0 },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[CoreFieldsEnrich] Processing ${items.length} items`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Extract slug from source_url
        const slug = slugFromUrl(item.source_url || "") || slugify(item.name);
        if (!slug) { skipped++; continue; }

        const detail = await fetchProvidentPageDataDetail(slug);
        if (!detail) { skipped++; continue; }

        // Build update payload: fill missing only
        const updates: Record<string, unknown> = {};

        if (!item.handover_date && detail.handoverDate) {
          updates.handover_date = detail.handoverDate;
        }
        if (item.bedrooms_min === null && detail.bedroomsMin !== undefined && detail.bedroomsMin !== null) {
          updates.bedrooms_min = detail.bedroomsMin;
        }
        if (item.bedrooms_max === null && detail.bedroomsMax !== undefined && detail.bedroomsMax !== null) {
          updates.bedrooms_max = detail.bedroomsMax;
        }
        if (item.size_min === null && detail.sizeMin !== undefined && detail.sizeMin !== null) {
          updates.size_min = detail.sizeMin;
        }
        if (item.size_max === null && detail.sizeMax !== undefined && detail.sizeMax !== null) {
          updates.size_max = detail.sizeMax;
        }
        if (!item.description && detail.description) {
          updates.description = detail.description;
        }

        if (Object.keys(updates).length === 0) {
          skipped++;
          continue;
        }

        if (table === "projects") {
          (updates as any).updated_at = new Date().toISOString();
        }

        const { error: updateErr } = await supabase
          .from(table)
          .update(updates)
          .eq("id", item.id);

        if (updateErr) {
          console.warn(`[CoreFieldsEnrich] Update error for ${item.name}: ${updateErr.message}`);
          errors++;
        } else {
          updated++;
          console.log(`[CoreFieldsEnrich] Updated ${item.name}: ${Object.keys(updates).join(", ")}`);
        }
      } catch (e) {
        console.warn(`[CoreFieldsEnrich] Error for ${item.name}: ${e}`);
        errors++;
      }

      // Small delay to avoid hammering Provident
      if (items.length > 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: { processed: items.length, updated, skipped, errors },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[CoreFieldsEnrich] Fatal:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
