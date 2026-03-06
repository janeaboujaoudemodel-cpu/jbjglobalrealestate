import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(body.batch_size || 10, 25);
  const repairType = body.repair_type || "all"; // "all" | "missing_images" | "missing_prices" | "invalid_cover"

  const stats = { checked: 0, repaired: 0, skipped: 0, errors: 0, details: [] as string[] };

  try {
    // Find projects needing repair based on type
    let query = supabase.from("projects").select("id, name, slug, cover_image_url, price_from, video_url, reelly_id, import_source, external_id");

    if (repairType === "missing_images") {
      query = query.is("cover_image_url", null);
    } else if (repairType === "missing_prices") {
      query = query.is("price_from", null);
    } else {
      // "all" — find projects missing key data
      query = query.or("cover_image_url.is.null,price_from.is.null");
    }

    const { data: projects, error: fetchError } = await query.limit(batchSize);
    if (fetchError) throw fetchError;

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No projects need repair", stats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    stats.checked = projects.length;

    for (const project of projects) {
      try {
        const updates: Record<string, unknown> = {};
        let repaired = false;

        // Check for invalid video_url
        if (project.video_url) {
          const videoUrl = project.video_url as string;
          const isValidVideo = /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov/i.test(videoUrl);
          if (!isValidVideo) {
            updates.video_url = null;
            repaired = true;
            stats.details.push(`${project.name}: Cleared invalid video_url`);
          }
        }

        // Check for invalid cover_image_url (flags, icons, etc.)
        if (project.cover_image_url) {
          const cover = project.cover_image_url as string;
          const invalidPatterns = [/\/flags?\//i, /flag-icon/i, /sprite/i, /favicon/i, /1x1\./i, /pixel\./i, /spacer\./i, /logo/i, /icon/i];
          const isInvalid = invalidPatterns.some(p => p.test(cover));
          if (isInvalid) {
            // Try to find a valid image from project_images
            const { data: images } = await supabase
              .from("project_images")
              .select("image_url")
              .eq("project_id", project.id)
              .order("display_order")
              .limit(1);

            if (images && images.length > 0) {
              updates.cover_image_url = images[0].image_url;
              repaired = true;
              stats.details.push(`${project.name}: Replaced invalid cover with gallery image`);
            } else {
              updates.cover_image_url = null;
              repaired = true;
              stats.details.push(`${project.name}: Cleared invalid cover (no gallery fallback)`);
            }
          }
        }

        // If project has Reelly source and missing data, attempt Reelly re-fetch
        if (project.reelly_id && (!project.price_from || !project.cover_image_url)) {
          // Check if we have reelly_raw_data stored
          const { data: rawRow } = await supabase
            .from("projects")
            .select("reelly_raw_data")
            .eq("id", project.id)
            .single();

          const raw = rawRow?.reelly_raw_data as Record<string, unknown> | null;
          if (raw) {
            if (!project.price_from && typeof raw.price_from === "number" && raw.price_from > 0) {
              updates.price_from = raw.price_from;
              repaired = true;
              stats.details.push(`${project.name}: Restored price_from from raw data`);
            }
            if (!project.cover_image_url && typeof raw.thumbnail === "string") {
              updates.cover_image_url = raw.thumbnail;
              repaired = true;
              stats.details.push(`${project.name}: Restored cover from raw data`);
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", project.id);

          if (updateError) {
            stats.errors++;
            stats.details.push(`${project.name}: Update failed - ${updateError.message}`);
          } else if (repaired) {
            stats.repaired++;
          }
        } else {
          stats.skipped++;
        }
      } catch (projErr: any) {
        stats.errors++;
        stats.details.push(`${project.name}: ${projErr.message}`);
      }
    }

    // Log to sync_jobs
    await supabase.from("sync_jobs").insert({
      job_type: "repair-live-projects-batch",
      status: stats.errors === 0 ? "completed" : "partial",
      source: "repair",
      stats_created: 0,
      stats_updated: stats.repaired,
      stats_errors: stats.errors,
      error_log: stats.details.length > 0 ? { details: stats.details } : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).then(() => {});

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
