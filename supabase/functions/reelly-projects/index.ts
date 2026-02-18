import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, REELLY_API_ENDPOINTS, REELLY_FILTERS, fetchReellyWithRetry } from "../_shared/reelly-types.ts";

/**
 * reelly-projects — Frontend-facing edge function
 *
 * DEFAULT: Serves from local `projects` table (fast, 50-100ms, no API burn).
 * FALLBACK: Add `?source=live` to bypass DB and hit Reelly API directly.
 *
 * Filters supported:
 *   search, sale_status, construction_status, emirate, developer_name
 *   limit, offset (offset-based pagination)
 */

const corsH = {
  ...corsHeaders,
};

function mapSaleStatus(status: string | null): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    "announced": "Announced",
    "on_sale": "On Sale",
    "out_of_stock": "Sold Out",
    "presale_eoi": "Presale (EOI)",
    "start_of_sales": "Start of Sales",
  };
  return map[status] || status;
}

function mapConstructionStatus(status: string | null): string | null {
  if (!status) return null;
  const map: Record<string, string> = {
    "under_construction": "Under Construction",
    "completed": "Completed",
    "presale": "Presale",
  };
  return map[status] || status;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ============= DB SOURCE (default) =============

async function serveFromDB(
  supabase: ReturnType<typeof createClient>,
  params: {
    limit: number;
    offset: number;
    search: string | null;
    saleStatus: string | null;
    constructionStatus: string | null;
    emirate: string | null;
    developerName: string | null;
  }
) {
  const { limit, offset, search, saleStatus, constructionStatus, emirate, developerName } = params;

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .not("cover_image_url", "is", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,developer_name.ilike.%${search}%,location.ilike.%${search}%`);
  }
  if (saleStatus) {
    query = query.ilike("sale_status", saleStatus);
  }
  if (constructionStatus) {
    query = query.ilike("construction_status", constructionStatus);
  }
  if (emirate) {
    query = query.ilike("emirate", emirate);
  }
  if (developerName) {
    query = query.ilike("developer_name", `%${developerName}%`);
  }

  const { data: projects, count, error } = await query;

  if (error) throw new Error(`DB query failed: ${error.message}`);

  const total = count ?? 0;
  const hasMore = offset + limit < total;

  const transformed = (projects || []).map((p: any) => ({
    id: p.reelly_id || p.id,
    name: p.name,
    slug: p.slug || generateSlug(p.name),
    developer_name: p.developer_name,
    construction_status: p.construction_status,
    sale_status: p.sale_status,
    status_label: p.sale_status || p.status_label,
    description: p.description || p.short_description,
    handover_date: p.handover_date,
    location: p.location,
    emirate: p.emirate,
    latitude: p.latitude,
    longitude: p.longitude,
    price_from: p.price_from,
    price_to: p.price_to,
    size_min: p.size_min,
    size_max: p.size_max,
    thumbnail: p.cover_image_url,
    gallery: (p.images || []).map((img: any) => img.image_url || img.url).filter(Boolean),
    images: (p.images || []).map((img: any) => ({
      image_url: img.image_url || img.url,
      alt_text: img.alt_text || p.name,
    })),
  }));

  return {
    projects: transformed,
    pagination: { total, limit, offset, hasMore },
    source: "database",
  };
}

// ============= LIVE API SOURCE (fallback) =============

async function serveFromLiveAPI(
  apiKey: string,
  params: {
    limit: number;
    offset: number;
    search: string | null;
    saleStatus: string | null;
    constructionStatus: string | null;
    emirate: string | null;
    developerName: string | null;
  }
) {
  const { limit, offset, search, saleStatus, constructionStatus, emirate, developerName } = params;

  const saleStatusApiMap: Record<string, string> = {
    "Announced": "announced",
    "On Sale": "on_sale",
    "Sold Out": "out_of_stock",
    "Presale (EOI)": "presale_eoi",
    "Start of Sales": "start_of_sales",
  };
  const constructionStatusApiMap: Record<string, string> = {
    "Under Construction": "under_construction",
    "Completed": "completed",
    "Presale": "presale",
  };

  let url = `${REELLY_API_ENDPOINTS.projects}?${REELLY_FILTERS.limit}=${limit}&${REELLY_FILTERS.offset}=${offset}`;
  if (search) url += `&${REELLY_FILTERS.search}=${encodeURIComponent(search)}`;
  if (saleStatus) url += `&${REELLY_FILTERS.saleStatus}=${encodeURIComponent(saleStatusApiMap[saleStatus] || saleStatus)}`;
  if (constructionStatus) url += `&${REELLY_FILTERS.constructionStatus}=${encodeURIComponent(constructionStatusApiMap[constructionStatus] || constructionStatus)}`;
  if (emirate) url += `&${REELLY_FILTERS.region}=${encodeURIComponent(emirate)}`;
  if (developerName) url += `&${REELLY_FILTERS.developer}=${encodeURIComponent(developerName)}`;

  console.log(`[reelly-projects] Live API fetch: ${url}`);

  const res = await fetchReellyWithRetry(url, apiKey);

  if (!res.ok) {
    const txt = await res.text();
    console.error(`[reelly-projects] Live API error ${res.status}: ${txt.slice(0, 300)}`);
    return {
      projects: [],
      pagination: { total: 0, limit, offset, hasMore: false },
      source: "live_api_error",
      warning: `Reelly API returned ${res.status}`,
    };
  }

  const data = await res.json();
  const total = data.count || 0;
  const raw: any[] = data.results || [];
  const hasMore = offset + limit < total;

  const projects = raw.map((p: any) => {
    const thumbnail = p.cover_image?.url || null;
    const gallery: string[] = (p.video_reviews || [])
      .map((v: any) => v.thumbnail_url)
      .filter(Boolean);
    const images = [
      ...(thumbnail ? [{ image_url: thumbnail, alt_text: p.name }] : []),
      ...gallery.map((url: string) => ({ image_url: url, alt_text: p.name })),
    ];
    return {
      id: p.id,
      name: p.name,
      slug: generateSlug(p.name),
      developer_name: p.developer,
      construction_status: mapConstructionStatus(p.construction_status),
      sale_status: mapSaleStatus(p.sale_status),
      status_label: mapSaleStatus(p.sale_status),
      description: p.short_description,
      handover_date: p.completion_date,
      location: p.location?.district || null,
      emirate: p.location?.region || null,
      latitude: p.location?.latitude || null,
      longitude: p.location?.longitude || null,
      price_from: p.min_price > 0 ? p.min_price : null,
      price_to: p.max_price > 0 ? p.max_price : null,
      size_min: p.min_size > 0 ? p.min_size : null,
      size_max: p.max_size > 0 ? p.max_size : null,
      thumbnail,
      gallery,
      images,
    };
  });

  return {
    projects,
    pagination: { total, limit, offset, hasMore },
    source: "live_api",
  };
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsH });

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "24"), 200);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || null;
    const saleStatus = url.searchParams.get("sale_status") || null;
    const constructionStatus = url.searchParams.get("construction_status") || null;
    const emirate = url.searchParams.get("emirate") || null;
    const developerName = url.searchParams.get("developer_name") || null;
    const source = url.searchParams.get("source") || "db"; // "db" | "live"

    const params = { limit, offset, search, saleStatus, constructionStatus, emirate, developerName };

    let result;

    if (source === "live") {
      // Live API path — requires API key
      const apiKey = Deno.env.get("REELLY_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
          { status: 500, headers: { ...corsH, "Content-Type": "application/json" } }
        );
      }
      result = await serveFromLiveAPI(apiKey, params);
    } else {
      // DB path — default, fast
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      result = await serveFromDB(supabase, params);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsH, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[reelly-projects] Error:", e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsH, "Content-Type": "application/json" } }
    );
  }
});
