import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 50, 200);
    const dryRun = body.dry_run || false;

    const stats = {
      total_scanned: 0,
      enriched_from_raw: 0,
      enriched_from_reelly_api: 0,
      already_complete: 0,
      errors: 0,
      fields_filled: {
        area_name: 0,
        sector: 0,
        handover_date: 0,
        expected_completion: 0,
        bedrooms_min: 0,
        bedrooms_max: 0,
        size_min: 0,
        size_max: 0,
        price_to: 0,
        latitude: 0,
        longitude: 0,
        construction_status: 0,
        payment_plan: 0,
        total_units: 0,
        floors: 0,
      },
      details: [] as string[],
    };

    // Fetch all draft projects
    let allDrafts: any[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, area_name, sector, handover_date, expected_completion, bedrooms_min, bedrooms_max, size_min, size_max, price_from, price_to, latitude, longitude, construction_status, payment_plan, total_units, floors, reelly_raw_data, reelly_id, source")
        .eq("is_published", false)
        .range(offset, offset + 999);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allDrafts = allDrafts.concat(data);
      if (data.length < 1000) break;
      offset += 1000;
    }

    stats.total_scanned = allDrafts.length;

    // Process each draft
    for (const project of allDrafts.slice(0, batchSize)) {
      try {
        const updates: Record<string, any> = {};
        const raw = project.reelly_raw_data as Record<string, any> | null;

        if (raw) {
          // Extract area_name from location.district
          if (!project.area_name && raw.location?.district) {
            updates.area_name = raw.location.district;
            stats.fields_filled.area_name++;
          }

          // Extract sector
          if (!project.sector && raw.location?.sector) {
            updates.sector = raw.location.sector;
            stats.fields_filled.sector++;
          }

          // Extract lat/lng
          if (!project.latitude && raw.location?.latitude) {
            updates.latitude = raw.location.latitude;
            stats.fields_filled.latitude++;
          }
          if (!project.longitude && raw.location?.longitude) {
            updates.longitude = raw.location.longitude;
            stats.fields_filled.longitude++;
          }

          // Extract handover from completion_date or construction_end_date
          if (!project.handover_date && !project.expected_completion) {
            const handover = raw.completion_date || raw.construction_end_date || raw.handover_date;
            if (handover) {
              updates.handover_date = String(handover);
              updates.expected_completion = String(handover);
              stats.fields_filled.handover_date++;
              stats.fields_filled.expected_completion++;
            }
          }

          // Extract bedrooms from typical_units
          if ((!project.bedrooms_min || !project.bedrooms_max) && Array.isArray(raw.typical_units) && raw.typical_units.length > 0) {
            const bedrooms = raw.typical_units
              .map((u: any) => typeof u.bedrooms === "number" ? u.bedrooms : null)
              .filter((b: any) => b !== null) as number[];
            if (bedrooms.length > 0) {
              if (!project.bedrooms_min) {
                updates.bedrooms_min = Math.min(...bedrooms);
                stats.fields_filled.bedrooms_min++;
              }
              if (!project.bedrooms_max) {
                updates.bedrooms_max = Math.max(...bedrooms);
                stats.fields_filled.bedrooms_max++;
              }
            }
          }

          // Extract sizes from typical_units
          if (!project.size_min && Array.isArray(raw.typical_units)) {
            const sizes = raw.typical_units
              .map((u: any) => u.from_size_sqft)
              .filter((s: any) => typeof s === "number" && s > 0) as number[];
            if (sizes.length > 0) {
              updates.size_min = Math.round(Math.min(...sizes));
              stats.fields_filled.size_min++;
            }
          }
          if (!project.size_max && Array.isArray(raw.typical_units)) {
            const sizes = raw.typical_units
              .map((u: any) => u.to_size_sqft)
              .filter((s: any) => typeof s === "number" && s > 0) as number[];
            if (sizes.length > 0) {
              updates.size_max = Math.round(Math.max(...sizes));
              stats.fields_filled.size_max++;
            }
          }

          // Extract price_to from max_price
          if (!project.price_to && typeof raw.max_price === "number" && raw.max_price > 0) {
            updates.price_to = Math.round(raw.max_price);
            stats.fields_filled.price_to++;
          }

          // Extract construction_status
          if (!project.construction_status && raw.construction_status) {
            const statusMap: Record<string, string> = {
              under_construction: "Under Construction",
              completed: "Completed",
              presale: "Presale",
            };
            updates.construction_status = statusMap[raw.construction_status] || raw.construction_status;
            stats.fields_filled.construction_status++;
          }

          // Extract payment_plan from payment_plans
          if (!project.payment_plan && Array.isArray(raw.payment_plans) && raw.payment_plans.length > 0) {
            const plan = raw.payment_plans[0];
            if (plan.name) {
              updates.payment_plan = plan.name;
              stats.fields_filled.payment_plan++;
            }
          }

          // Extract building info
          if (!project.total_units && typeof raw.total_units === "number") {
            updates.total_units = raw.total_units;
            stats.fields_filled.total_units++;
          }
          if (!project.floors && raw.buildings?.[0]?.floors_count) {
            updates.floors = raw.buildings[0].floors_count;
            stats.fields_filled.floors++;
          }
        }

        // Apply updates
        if (Object.keys(updates).length > 0) {
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from("projects")
              .update(updates)
              .eq("id", project.id);
            if (updateError) {
              stats.errors++;
              stats.details.push(`${project.name}: Update failed - ${updateError.message}`);
              continue;
            }
          }
          stats.enriched_from_raw++;
          stats.details.push(`${project.name}: Filled ${Object.keys(updates).join(", ")}`);
        } else {
          stats.already_complete++;
        }
      } catch (projErr: any) {
        stats.errors++;
        stats.details.push(`${project.name}: ${projErr.message}`);
      }
    }

    // Now handle drafts WITHOUT raw data - try Reelly API lookup
    const draftsWithoutRaw = allDrafts.filter(p => !p.reelly_raw_data && (!p.area_name || !p.handover_date || !p.bedrooms_min));
    
    for (const project of draftsWithoutRaw.slice(0, Math.min(120, batchSize))) {
      try {
        // Search Reelly API by project name
        const searchName = project.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const reellyResp = await fetch(
          `${supabaseUrl}/functions/v1/reelly-projects?limit=5&offset=0&search=${encodeURIComponent(searchName)}`,
          {
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!reellyResp.ok) continue;
        const reellyData = await reellyResp.json();
        if (!reellyData.success || !reellyData.data?.projects?.length) continue;

        // Find best match
        const match = reellyData.data.projects.find(
          (p: any) => p.name.toLowerCase().includes(searchName.toLowerCase().split(" ")[0])
        ) || reellyData.data.projects[0];

        const updates: Record<string, any> = {};

        if (!project.handover_date && match.handover_date) {
          updates.handover_date = match.handover_date;
          updates.expected_completion = match.handover_date;
          stats.fields_filled.handover_date++;
        }
        if (!project.area_name && match.location) {
          // Parse location string for area
          const parts = (match.location as string).split(",").map((s: string) => s.trim());
          if (parts.length > 0) {
            updates.area_name = parts[0];
            stats.fields_filled.area_name++;
          }
        }
        if (!project.price_to && match.price_to) {
          updates.price_to = match.price_to;
          stats.fields_filled.price_to++;
        }
        if (!project.latitude && match.latitude) {
          updates.latitude = match.latitude;
          updates.longitude = match.longitude;
        }

        if (Object.keys(updates).length > 0 && !dryRun) {
          await supabase.from("projects").update(updates).eq("id", project.id);
          stats.enriched_from_reelly_api++;
          stats.details.push(`${project.name}: API enriched - ${Object.keys(updates).join(", ")}`);
        }
      } catch (_e) {
        // Skip API failures silently
      }
    }

    // Log to sync_jobs
    if (!dryRun) {
      await supabase.from("sync_jobs").insert({
        job_type: "repair-draft-projects",
        status: stats.errors === 0 ? "completed" : "partial",
        source: "repair",
        stats_created: 0,
        stats_updated: stats.enriched_from_raw + stats.enriched_from_reelly_api,
        stats_errors: stats.errors,
        error_log: stats.details.length > 0 ? { details: stats.details.slice(0, 100) } : null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
