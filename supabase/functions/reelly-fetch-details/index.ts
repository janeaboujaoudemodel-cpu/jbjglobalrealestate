import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE, ReellyProject,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";

async function fetchDetail(apiKey: string, id: number): Promise<ReellyProject | null> {
  try {
    const res = await fetch(`${REELLY_API_BASE}/${id}`, { headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "batch";
    const batchSize = Math.min(body.batch_size || 50, 100);
    const projectIds = body.project_ids || [];

    if (mode === "test") {
      const { data: sample } = await supabase.from("pending_project_imports").select("source_url").ilike("source_url", "%reelly_%").limit(1).single();
      if (!sample?.source_url) return new Response(JSON.stringify({ success: true, message: "No Reelly projects in queue" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const match = sample.source_url.match(/reelly_(\d+)/);
      if (!match) return new Response(JSON.stringify({ success: false, error: "Could not parse ID" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const detail = await fetchDetail(apiKey, parseInt(match[1], 10));
      return new Response(JSON.stringify({
        success: true, test_project_id: parseInt(match[1], 10), has_detail: !!detail,
        detail_fields: detail ? {
          images_count: (detail.images?.length || 0) + (detail.gallery?.length || 0),
          videos_count: detail.video_reviews?.length || 0,
          documents_count: (detail.documents?.length || 0) + (detail.brochures?.length || 0),
          amenities_count: (detail.amenities?.length || 0) + (detail.facilities?.length || 0),
        } : null
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "specific" && projectIds.length) {
      let updated = 0, failed = 0;
      for (const id of projectIds.slice(0, batchSize)) {
        const detail = await fetchDetail(apiKey, id);
        if (!detail) { failed++; continue; }
        const { error } = await supabase.from("pending_project_imports").update({
          images: extractGalleryImages(detail), video_urls: extractVideos(detail).video_urls, video_url: extractVideos(detail).video_url,
          documents: extractDocuments(detail), floor_plan_types: extractFloorPlans(detail), amenities: extractAmenities(detail), unit_types: extractUnitTypes(detail),
          updated_at: new Date().toISOString()
        }).ilike("source_url", `%reelly_${id}%`);
        error ? failed++ : updated++;
        await new Promise(r => setTimeout(r, 200));
      }
      return new Response(JSON.stringify({ success: true, mode: "specific", updated, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: incomplete } = await supabase.from("pending_project_imports").select("id, name, source_url").ilike("source_url", "%reelly_%").eq("status", "pending").or("images.is.null,amenities.is.null").limit(batchSize);
    if (!incomplete?.length) return new Response(JSON.stringify({ success: true, message: "No projects with missing details", processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let updated = 0, failed = 0;
    for (const p of incomplete) {
      const match = p.source_url?.match(/reelly_(\d+)/);
      if (!match) { failed++; continue; }
      const detail = await fetchDetail(apiKey, parseInt(match[1], 10));
      if (!detail) { failed++; continue; }
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      const imgs = extractGalleryImages(detail); if (imgs.length) updateData.images = imgs;
      const vids = extractVideos(detail); if (vids.video_urls.length) { updateData.video_urls = vids.video_urls; updateData.video_url = vids.video_url; }
      const docs = extractDocuments(detail); if (docs.length) updateData.documents = docs;
      const floors = extractFloorPlans(detail); if (floors.length) updateData.floor_plan_types = floors;
      const amens = extractAmenities(detail); if (amens.length) updateData.amenities = amens;
      const units = extractUnitTypes(detail); if (units.length) updateData.unit_types = units;
      const { error } = await supabase.from("pending_project_imports").update(updateData).eq("id", p.id);
      error ? failed++ : updated++;
      await new Promise(r => setTimeout(r, 200));
    }
    return new Response(JSON.stringify({ success: true, mode: "batch", processed: incomplete.length, updated, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
