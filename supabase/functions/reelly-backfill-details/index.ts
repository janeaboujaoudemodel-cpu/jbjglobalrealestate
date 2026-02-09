import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE, ReellyProject,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";

async function fetchDetail(apiKey: string, id: number): Promise<ReellyProject | null> {
  try {
    const res = await fetch(`${REELLY_API_BASE}/${id}`, {
      headers: { "X-API-Key": apiKey, "Accept": "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 10, 50);
    const specificProjectId = body.project_id; // optional: single project UUID

    // Build query: find projects with reelly_id that have few images or no payment data
    let query = supabase
      .from("projects")
      .select("id, name, reelly_id, detail_fetched_at")
      .not("reelly_id", "is", null)
      .is("detail_fetched_at", null)
      .order("created_at", { ascending: false })
      .limit(batchSize);

    if (specificProjectId) {
      query = supabase
        .from("projects")
        .select("id, name, reelly_id, detail_fetched_at")
        .eq("id", specificProjectId)
        .not("reelly_id", "is", null)
        .limit(1);
    }

    const { data: projects, error: queryError } = await query;
    if (queryError) {
      return new Response(JSON.stringify({ success: false, error: queryError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!projects?.length) {
      return new Response(JSON.stringify({
        success: true, message: "No projects needing detail backfill", processed: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let updated = 0;
    let failed = 0;
    const results: Array<{ name: string; status: string; images?: number; docs?: number }> = [];

    for (const p of projects) {
      const reellyId = typeof p.reelly_id === "number" ? p.reelly_id : parseInt(p.reelly_id, 10);
      if (isNaN(reellyId)) { failed++; results.push({ name: p.name, status: "invalid_reelly_id" }); continue; }

      const detail = await fetchDetail(apiKey, reellyId);
      if (!detail) { failed++; results.push({ name: p.name, status: "api_fetch_failed" }); continue; }

      // Extract all data from detail endpoint
      const galleryImages = extractGalleryImages(detail);
      const videos = extractVideos(detail);
      const documents = extractDocuments(detail);
      const floorPlans = extractFloorPlans(detail);
      const amenities = extractAmenities(detail);
      const unitTypes = extractUnitTypes(detail);

      // Update project with enriched data
      const updateData: Record<string, unknown> = {
        detail_fetched_at: new Date().toISOString(),
      };

      // Only update fields that have data
      if (amenities.length) updateData.amenities = amenities;
      if (floorPlans.length) updateData.floor_plan_types = floorPlans;
      if (unitTypes.length) updateData.unit_types = unitTypes;
      if (videos.video_url) updateData.video_url = videos.video_url;

      // Extract payment plan info from detail
      if (detail.payment_plan) {
        updateData.payment_plan = typeof detail.payment_plan === "string"
          ? detail.payment_plan
          : JSON.stringify(detail.payment_plan);
      }

      // Extract payment breakdown
      if (detail.down_payment || detail.installment_plan) {
        const breakdown: Record<string, string> = {};
        if (detail.down_payment) breakdown.down_payment = `${detail.down_payment}%`;
        if (detail.during_construction) breakdown.during_construction = `${detail.during_construction}%`;
        if (detail.on_handover || detail.on_completion) {
          breakdown.on_completion = `${detail.on_handover || detail.on_completion}%`;
        }
        if (Object.keys(breakdown).length > 0) {
          updateData.payment_breakdown = breakdown;
        }
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", p.id);

      if (updateError) {
        failed++;
        results.push({ name: p.name, status: `update_error: ${updateError.message}` });
        continue;
      }

      // Insert gallery images into project_images table
      if (galleryImages.length > 0) {
        // First check existing images count
        const { count } = await supabase
          .from("project_images")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);

        if ((count || 0) < 3) {
          // Delete existing single cover image and re-insert full gallery
          await supabase.from("project_images").delete().eq("project_id", p.id);

          const imageRows = galleryImages.map((img: { url: string; alt?: string }, idx: number) => ({
            project_id: p.id,
            url: img.url,
            alt: img.alt || `${p.name} - Image ${idx + 1}`,
            display_order: idx,
          }));

          await supabase.from("project_images").insert(imageRows);
        }
      }

      // Insert documents into project_documents table
      if (documents.length > 0) {
        const { count: docCount } = await supabase
          .from("project_documents")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);

        if ((docCount || 0) === 0) {
          const docRows = documents.map((doc: { type: string; url: string; name?: string }) => ({
            project_id: p.id,
            type: doc.type,
            url: doc.url,
            name: doc.name || `${p.name} - ${doc.type}`,
          }));

          await supabase.from("project_documents").insert(docRows);
        }
      }

      updated++;
      results.push({
        name: p.name,
        status: "success",
        images: galleryImages.length,
        docs: documents.length,
      });

      // Throttle to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: projects.length,
      updated,
      failed,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
