import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  REELLY_API_BASE,
  fetchReellyWithRetry,
  extractGalleryImages,
  extractVideos,
  extractDocuments,
  extractFloorPlans,
  extractAmenities,
  extractUnitTypes,
} from "../_shared/reelly-types.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey || !reellyApiKey) {
    return json(500, { error: "Missing config" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 50;
    const offset = body.offset || 0;
    const onlyMissing = body.only_missing !== false; // default true — only process projects without raw data

    // Fetch projects with reelly_id
    let query = supabase
      .from("projects")
      .select("id, name, slug, reelly_id")
      .not("reelly_id", "is", null)
      .order("reelly_id", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (onlyMissing) {
      query = query.is("reelly_raw_data", null);
    }

    const { data: projects, error: projErr } = await query;
    if (projErr) return json(500, { error: projErr.message });
    if (!projects || projects.length === 0) {
      return json(200, { message: "No projects to process", processed: 0, offset });
    }

    const results: Array<{
      id: string;
      slug: string;
      reelly_id: number;
      status: string;
      floor_plans: number;
      videos: number;
      documents: number;
      images: number;
    }> = [];

    for (const proj of projects) {
      try {
        const res = await fetchReellyWithRetry(
          `${REELLY_API_BASE}/${proj.reelly_id}`,
          reellyApiKey,
          3,
        );

        if (!res.ok) {
          results.push({
            id: proj.id,
            slug: proj.slug,
            reelly_id: proj.reelly_id,
            status: `api_error_${res.status}`,
            floor_plans: 0,
            videos: 0,
            documents: 0,
            images: 0,
          });
          continue;
        }

        const rawJson = await res.json();
        const data = rawJson?.data || rawJson?.result || rawJson;

        // Extract all data
        const gallery = extractGalleryImages(data);
        const { video_url, video_urls } = extractVideos(data);
        const documents = extractDocuments(data);
        const floorPlans = extractFloorPlans(data);
        const amenities = extractAmenities(data);
        const unitTypes = extractUnitTypes(data);

        // Build update payload
        const updatePayload: Record<string, unknown> = {
          reelly_raw_data: data, // Full raw API response preserved
        };

        // Update video fields
        if (video_url) updatePayload.video_url = video_url;
        if (video_urls.length > 0) updatePayload.video_urls = video_urls;

        // Update floor plan types
        if (floorPlans.length > 0) {
          updatePayload.floor_plan_types = floorPlans.map((fp) => ({
            label: fp.label,
            type: fp.type,
            pdfUrl: fp.url,
            bedrooms: fp.bedrooms,
          }));
        }

        // Update amenities if richer
        if (amenities.length > 0) updatePayload.amenities = amenities;

        // Update unit types if available
        if (unitTypes.length > 0) updatePayload.unit_types = unitTypes;

        // Extract payment data
        if (data.down_payment || data.during_construction || data.on_handover || data.on_completion) {
          updatePayload.payment_breakdown = {
            down_payment: data.down_payment ? `${data.down_payment}%` : undefined,
            during_construction: data.during_construction ? `${data.during_construction}%` : undefined,
            on_completion: (data.on_handover || data.on_completion) ? `${data.on_handover || data.on_completion}%` : undefined,
          };
        }

        // Update description if missing
        if (data.overview) updatePayload.description = data.overview;

        // Update FAQs
        if (Array.isArray(data.faqs) && data.faqs.length > 0) {
          updatePayload.faqs = data.faqs.filter((f: any) => f?.question && f?.answer);
        }

        // Save to database
        const { error: updateErr } = await supabase
          .from("projects")
          .update(updatePayload)
          .eq("id", proj.id);

        if (updateErr) {
          console.error(`[emergency-extract] Update error for ${proj.slug}:`, updateErr.message);
        }

        // Upsert documents into project_documents
        if (documents.length > 0) {
          for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            await supabase
              .from("project_documents")
              .upsert(
                {
                  project_id: proj.id,
                  document_type: doc.type || "brochure",
                  file_url: doc.url,
                  file_name: doc.name || `Document ${i + 1}`,
                  display_order: i,
                },
                { onConflict: "project_id,file_url", ignoreDuplicates: true },
              )
              .then(({ error }) => {
                if (error) console.warn(`[emergency-extract] Doc upsert warn: ${error.message}`);
              });
          }
        }

        results.push({
          id: proj.id,
          slug: proj.slug,
          reelly_id: proj.reelly_id,
          status: "success",
          floor_plans: floorPlans.length,
          videos: video_urls.length,
          documents: documents.length,
          images: gallery.length,
        });

        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`[emergency-extract] Error for ${proj.slug}:`, err);
        results.push({
          id: proj.id,
          slug: proj.slug,
          reelly_id: proj.reelly_id,
          status: `error: ${String(err).slice(0, 100)}`,
          floor_plans: 0,
          videos: 0,
          documents: 0,
          images: 0,
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const totalFloorPlans = results.reduce((s, r) => s + r.floor_plans, 0);
    const totalVideos = results.reduce((s, r) => s + r.videos, 0);
    const totalDocs = results.reduce((s, r) => s + r.documents, 0);

    return json(200, {
      message: `Processed ${results.length} projects (${successCount} success)`,
      processed: results.length,
      success: successCount,
      next_offset: offset + batchSize,
      totals: {
        floor_plans: totalFloorPlans,
        videos: totalVideos,
        documents: totalDocs,
      },
      results,
    });
  } catch (err) {
    console.error("[emergency-extract] Fatal error:", err);
    return json(500, { error: String(err) });
  }
});
