import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_ENDPOINTS, REELLY_FILTERS,
  fetchReellyWithRetry, extractGalleryImages, extractDocuments, extractFloorPlans,
  extractAmenities, extractUnitTypes, extractVideos,
  mapConstructionStatus, mapSaleStatus, getEmirateFromRegion, generateSlug,
  type ReellyProject
} from "../_shared/reelly-types.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Repair Empty Projects
 * 
 * Finds projects with no cover_image, no description, no price (bulk-approved shells)
 * and either:
 * 1. Enriches them from Reelly API by searching by name
 * 2. Deletes them if they're duplicates of existing populated projects
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { action = "repair", limit = 50, dryRun = false } = body;

    // STATS mode
    if (action === "stats") {
      const { count: totalEmpty } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("cover_image_url", null)
        .is("description", null);

      const { count: totalProjects } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true });

      return json(200, {
        success: true,
        total_projects: totalProjects || 0,
        empty_shell_projects: totalEmpty || 0,
        percentage: totalProjects ? ((totalEmpty || 0) / totalProjects * 100).toFixed(1) + "%" : "0%",
      });
    }

    // REPAIR mode: fetch empty projects
    const { data: emptyProjects, error: fetchErr } = await supabase
      .from("projects")
      .select("id, name, slug, developer_name")
      .is("cover_image_url", null)
      .is("description", null)
      .order("name", { ascending: true })
      .limit(limit);

    if (fetchErr) return json(500, { error: fetchErr.message });
    if (!emptyProjects || emptyProjects.length === 0) {
      return json(200, { success: true, message: "No empty projects found", stats: { checked: 0, enriched: 0, deleted: 0, skipped: 0 } });
    }

    console.log(`[repair-empty] Processing ${emptyProjects.length} empty projects (dryRun=${dryRun})`);

    const stats = { checked: 0, enriched: 0, deleted: 0, skipped: 0, errors: 0 };
    const details: Array<{ name: string; action: string; reelly_id?: number }> = [];

    for (const project of emptyProjects) {
      stats.checked++;

      try {
        // Step 1: Check if there's a populated duplicate
        const nameParts = project.name.split(" ").slice(0, 2).join(" ");
        const { data: duplicates } = await supabase
          .from("projects")
          .select("id, name, cover_image_url")
          .neq("id", project.id)
          .not("cover_image_url", "is", null)
          .not("description", "is", null)
          .ilike("name", `%${nameParts}%`)
          .limit(5);

        // If there's a clear duplicate with data, delete the empty shell
        const isDuplicate = (duplicates || []).some(d => {
          const dName = d.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          const pName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "");
          // Check if one name is a subset of another (fuzzy match)
          return dName.includes(pName.slice(0, Math.min(pName.length, 20))) ||
                 pName.includes(dName.slice(0, Math.min(dName.length, 20)));
        });

        if (isDuplicate) {
          if (!dryRun) {
            // Delete related records first
            await supabase.from("project_images").delete().eq("project_id", project.id);
            await supabase.from("project_documents").delete().eq("project_id", project.id);
            await supabase.from("projects").delete().eq("id", project.id);
          }
          stats.deleted++;
          details.push({ name: project.name, action: "deleted_duplicate" });
          console.log(`[repair-empty] Deleted duplicate: ${project.name}`);
          continue;
        }

        // Step 2: Try to find on Reelly API by name search
        if (!reellyApiKey) {
          stats.skipped++;
          details.push({ name: project.name, action: "skipped_no_api_key" });
          continue;
        }

        // Extract clean search term from project name (remove developer suffix)
        const searchName = project.name.split(" ").slice(0, 3).join(" ");
        const searchUrl = `${REELLY_API_ENDPOINTS.projects}?${REELLY_FILTERS.search}=${encodeURIComponent(searchName)}&${REELLY_FILTERS.limit}=5`;

        const res = await fetchReellyWithRetry(searchUrl, reellyApiKey, 2);
        if (!res.ok) {
          console.warn(`[repair-empty] Reelly search failed for ${project.name}: ${res.status}`);
          stats.skipped++;
          details.push({ name: project.name, action: "api_search_failed" });
          await sleep(1000);
          continue;
        }

        const apiData = await res.json();
        const results: ReellyProject[] = apiData?.results || apiData?.data || [];

        if (results.length === 0) {
          // No Reelly match - delete if it's truly empty
          if (!dryRun) {
            await supabase.from("project_images").delete().eq("project_id", project.id);
            await supabase.from("project_documents").delete().eq("project_id", project.id);
            await supabase.from("projects").delete().eq("id", project.id);
          }
          stats.deleted++;
          details.push({ name: project.name, action: "deleted_no_match" });
          console.log(`[repair-empty] Deleted (no Reelly match): ${project.name}`);
          await sleep(500);
          continue;
        }

        // Find best match
        const match = results.find(r =>
          r.name.toLowerCase().includes(searchName.toLowerCase()) ||
          searchName.toLowerCase().includes(r.name.toLowerCase().split(" ").slice(0, 2).join(" "))
        ) || results[0];

        // Enrich project with Reelly data
        const gallery = extractGalleryImages(match);
        const documents = extractDocuments(match);
        const floorPlans = extractFloorPlans(match);
        const amenities = extractAmenities(match);
        const unitTypes = extractUnitTypes(match);
        const videos = extractVideos(match);

        const updateFields: Record<string, any> = {
          reelly_id: match.id,
          description: match.overview || match.short_description || null,
          short_description: match.short_description || null,
          price_from: match.min_price || null,
          price_to: match.max_price || null,
          price_currency: match.price_currency || "AED",
          construction_status: mapConstructionStatus(match.construction_status),
          sale_status: mapSaleStatus(match.sale_status) || null,
          developer_name: match.developer || project.developer_name,
          handover_date: match.completion_date || null,
          cover_image_url: match.cover_image?.url || (gallery.length > 0 ? gallery[0].url : null),
          total_units: match.units_count || null,
          building_count: match.building_count || null,
          size_min: match.min_size || null,
          size_max: match.max_size || null,
          area_unit: match.area_unit || null,
          video_url: videos.video_url,
          amenities: amenities.length > 0 ? amenities : null,
          floor_plan_types: floorPlans.length > 0 ? floorPlans : null,
          unit_types: unitTypes.length > 0 ? unitTypes : null,
          updated_at: new Date().toISOString(),
        };

        // Set location from Reelly
        if (match.location) {
          updateFields.emirate = getEmirateFromRegion(match.location.region || "");
          updateFields.location = [match.location.district, match.location.sector].filter(Boolean).join(", ");
          updateFields.latitude = match.location.latitude;
          updateFields.longitude = match.location.longitude;
        }

        if (!dryRun) {
          // Update project
          await supabase.from("projects").update(updateFields).eq("id", project.id);

          // Insert images
          if (gallery.length > 0) {
            const imageInserts = gallery.map(img => ({
              project_id: project.id,
              image_url: img.url,
              alt_text: img.alt_text,
              display_order: img.display_order,
            }));
            await supabase.from("project_images").insert(imageInserts);
          }

          // Insert documents
          if (documents.length > 0) {
            const docInserts = documents.map((doc, idx) => ({
              project_id: project.id,
              file_url: doc.url,
              file_name: doc.name,
              document_type: doc.type,
              display_order: idx,
            }));
            await supabase.from("project_documents").insert(docInserts);
          }
        }

        stats.enriched++;
        details.push({ name: project.name, action: "enriched", reelly_id: match.id });
        console.log(`[repair-empty] Enriched: ${project.name} (reelly_id: ${match.id}, ${gallery.length} images)`);

        // Rate limiting
        await sleep(800);

      } catch (err) {
        stats.errors++;
        details.push({ name: project.name, action: "error" });
        console.error(`[repair-empty] Error for ${project.name}:`, err);
      }
    }

    console.log(`[repair-empty] Done:`, stats);

    return json(200, {
      success: true,
      dryRun,
      stats,
      details: details.slice(0, 100),
    });

  } catch (err) {
    console.error("[repair-empty] Fatal:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
