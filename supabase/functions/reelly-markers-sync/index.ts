import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, REELLY_API_ENDPOINTS, fetchReellyWithRetry, mapSaleStatus, getEmirateFromRegion } from "../_shared/reelly-types.ts";

/**
 * reelly-markers-sync
 *
 * Fetches the lightweight /projects/markers endpoint from Reelly API.
 * Updates lat/lng, sale_status, min_price, and cover_image on existing
 * projects — much faster than a full project sync (5-10x less data).
 *
 * Run this to keep map markers current without a full project re-sync.
 */

interface ReellyMarker {
  id: number;
  name: string;
  developer?: string;
  sale_status?: string;
  status?: string;
  min_price?: number;
  cover_image?: { url: string } | string | null;
  location?: {
    latitude?: number;
    longitude?: number;
    region?: string;
    district?: string;
  } | null;
}

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
    const dryRun: boolean = body.dry_run === true;

    console.log(`[markers-sync] Starting (dryRun=${dryRun})...`);

    // ---- Fetch all marker pages ----
    const allMarkers: ReellyMarker[] = [];
    let nextUrl: string | null = `${REELLY_API_ENDPOINTS.projectMarkers}?limit=200`;
    let pageCount = 0;

    while (nextUrl) {
      pageCount++;
      console.log(`[markers-sync] Fetching page ${pageCount}: ${nextUrl}`);
      const res = await fetchReellyWithRetry(nextUrl, apiKey);

      if (!res.ok) {
        const txt = await res.text();
        console.error(`[markers-sync] API error ${res.status}: ${txt.slice(0, 300)}`);
        // Return partial results if we got some markers
        if (allMarkers.length > 0) break;
        return new Response(
          JSON.stringify({ success: false, error: `Markers API returned ${res.status}`, detail: txt.slice(0, 200) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await res.json();
      const markers: ReellyMarker[] = data.results || data || [];
      allMarkers.push(...markers);
      nextUrl = data.next || null;

      console.log(`[markers-sync] Page ${pageCount}: got ${markers.length} markers (total so far: ${allMarkers.length})`);

      // Safety cap at 50 pages
      if (pageCount >= 50) {
        console.warn("[markers-sync] Hit page cap (50). Stopping.");
        break;
      }
    }

    console.log(`[markers-sync] Fetched ${allMarkers.length} markers across ${pageCount} pages`);

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dry_run: true, total_markers: allMarkers.length, pages: pageCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Update projects table from markers ----
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (const marker of allMarkers) {
      try {
        if (!marker.id) continue;

        const saleStatus = mapSaleStatus(marker.sale_status || marker.status || "");
        const coverImageUrl = typeof marker.cover_image === "string"
          ? marker.cover_image
          : (marker.cover_image as any)?.url || null;

        const updatePayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (marker.location?.latitude) updatePayload.latitude = marker.location.latitude;
        if (marker.location?.longitude) updatePayload.longitude = marker.location.longitude;
        if (saleStatus) updatePayload.sale_status = saleStatus;
        if (marker.min_price && marker.min_price > 0) updatePayload.price_from = marker.min_price;
        if (coverImageUrl) updatePayload.cover_image_url = coverImageUrl;
        if (marker.location?.region) updatePayload.emirate = getEmirateFromRegion(marker.location.region);
        if (marker.location?.district) updatePayload.area_name = marker.location.district;

        // Update by reelly_id in the projects table
        const { data: proj, error } = await supabase
          .from("projects")
          .update(updatePayload)
          .eq("reelly_id", marker.id)
          .select("id")
          .maybeSingle();

        if (error) {
          errorDetails.push(`marker ${marker.id}: ${error.message}`);
          errors++;
        } else if (proj) {
          updated++;
        } else {
          notFound++;
        }
      } catch (e: any) {
        errorDetails.push(`marker ${marker.id}: ${e.message}`);
        errors++;
      }
    }

    console.log(`[markers-sync] Done: updated=${updated}, notFound=${notFound}, errors=${errors}`);

    return new Response(
      JSON.stringify({
        success: errors === 0,
        total_markers: allMarkers.length,
        pages_fetched: pageCount,
        updated,
        not_found: notFound,
        errors,
        error_details: errorDetails.slice(0, 20),
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: errors === 0 ? 200 : 207,
      }
    );
  } catch (e: any) {
    console.error("[markers-sync] Fatal:", e.message);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
