import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE,
  extractGalleryImages, extractDocuments, extractAmenities, extractAmenityImages
} from "../_shared/reelly-types.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Extraction helpers (same as reelly-auto-enrich) ──

function extractPaymentBreakdown(raw: any): any[] | null {
  const plans = raw?.payment_plans;
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const steps = plans[0]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return steps
    .filter((s: any) => s.percentage > 0)
    .map((s: any) => ({
      milestone: s.name || s.stage_type || "Payment",
      percentage: s.percentage,
      stage_type: s.stage_type || null,
    }));
}

function extractPaymentPlanText(raw: any): string | null {
  const plans = raw?.payment_plans;
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const steps = plans[0]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return plans[0]?.name || null;
  const pcts = steps.filter((s: any) => s.percentage > 0).map((s: any) => s.percentage);
  if (pcts.length > 0) return pcts.join("/") + " Payment Plan";
  return plans[0]?.name || null;
}

function extractLocationDistances(raw: any): any[] | null {
  const points = raw?.project_map_points;
  if (!Array.isArray(points) || points.length === 0) return null;
  return points.map((p: any) => ({
    label: p.map_point_name || p.name,
    time: p.time ? `${p.time} min` : `${p.distance} km`,
    distance_km: p.distance,
  })).filter((d: any) => d.label);
}

function extractVideoUrls(raw: any): { video_url: string | null; video_urls: string[] } {
  const reviews = raw?.video_reviews;
  if (!Array.isArray(reviews) || reviews.length === 0) return { video_url: null, video_urls: [] };
  const urls = reviews.map((v: any) => v.url || v.video_url || v.link).filter(Boolean);
  return { video_url: urls[0] || null, video_urls: urls };
}

function extractTypicalUnits(raw: any): any[] | null {
  const units = raw?.typical_units;
  if (!Array.isArray(units) || units.length === 0) return null;
  return units.map((u: any) => ({
    bedrooms: u.bedrooms,
    from_size: u.from_size_sqft || u.from_size_m2,
    to_size: u.to_size_sqft || u.to_size_m2,
    size_unit: u.from_size_sqft ? "sqft" : "m2",
    from_price: u.from_price_aed || u.from_price_usd,
    to_price: u.to_price_aed || u.to_price_usd,
    price_currency: u.from_price_aed ? "AED" : "USD",
    layouts: Array.isArray(u.layout) ? u.layout.map((l: any) => ({
      name: l.name, size: l.size_sqft || l.size_m2, image_url: l.image?.url || null,
    })) : [],
  }));
}

function extractFloorPlanTypes(raw: any): any[] | null {
  const fps = raw?.floor_plans;
  if (!Array.isArray(fps) || fps.length === 0) return null;
  return fps.map((fp: any) => ({
    name: fp.name || "Floor Plan",
    file_url: fp.file,
    file_type: fp.file_type || "floor_plan",
    description: fp.description || null,
  }));
}

function extractServiceCharge(raw: any): string | null {
  if (raw?.service_charge) return String(raw.service_charge);
  return null;
}

async function fetchReellyProject(reellyId: number, apiKey: string) {
  const res = await fetch(`${REELLY_API_BASE}/${reellyId}`, {
    headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
}

// ── Background processing logic ──

async function processAllProjects(jobId: string, supabaseUrl: string, supabaseKey: string, reellyApiKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all candidates
    const { data: allProjects } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, amenity_images, usp_bullets, location_distances, description, cover_image_url, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate, reelly_raw_data")
      .eq("is_published", true)
      .not("reelly_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(2000);

    if (!allProjects?.length) {
      await supabase.from("enrichment_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        log: [{ time: new Date().toISOString(), msg: "No projects found" }],
      }).eq("id", jobId);
      return;
    }

    // Filter to those without raw data
    const candidates = allProjects.filter((p: any) => !p.reelly_raw_data);
    const total = candidates.length;

    await supabase.from("enrichment_jobs").update({
      status: "running", total_projects: total,
      log: [{ time: new Date().toISOString(), msg: `Starting enrichment of ${total} projects` }],
    }).eq("id", jobId);

    // Get owner user ID for notifications
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "janeaboujaoudenails@gmail.com")
      .maybeSingle();
    const ownerUserId = ownerProfile?.id;

    let processed = 0, imagesAdded = 0, docsAdded = 0, fieldsUpdated = 0, errors = 0;
    const logEntries: any[] = [];

    for (const project of candidates) {
      // Check stop flag
      const { data: job } = await supabase.from("enrichment_jobs").select("stop_requested").eq("id", jobId).single();
      if (job?.stop_requested) {
        logEntries.push({ time: new Date().toISOString(), msg: "Stopped by user" });
        await supabase.from("enrichment_jobs").update({
          status: "stopped", processed, images_added: imagesAdded, docs_added: docsAdded,
          fields_updated: fieldsUpdated, errors, completed_at: new Date().toISOString(),
          log: logEntries.slice(-200),
        }).eq("id", jobId);
        return;
      }

      try {
        const reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
        if (!reellyData) {
          logEntries.push({ time: new Date().toISOString(), msg: `⚠️ ${project.name}: no API data` });
          processed++;
          errors++;
          continue;
        }

        const gallery = extractGalleryImages(reellyData);
        const documents = extractDocuments(reellyData);
        const amenities = extractAmenities(reellyData);
        const amenityImages = extractAmenityImages(reellyData);
        const ppBreakdown = extractPaymentBreakdown(reellyData);
        const ppText = extractPaymentPlanText(reellyData);
        const poi = extractLocationDistances(reellyData);
        const vids = extractVideoUrls(reellyData);
        const units = extractTypicalUnits(reellyData);
        const fps = extractFloorPlanTypes(reellyData);
        const sc = extractServiceCharge(reellyData);

        let pImages = 0, pDocs = 0, pFields = 0;

        // Images
        if (gallery.length > 0) {
          const { data: existing } = await supabase.from("project_images").select("image_url").eq("project_id", project.id);
          const existingUrls = new Set((existing || []).map((i: any) => i.image_url));
          const { count: existingCount } = await supabase.from("project_images").select("id", { count: "exact", head: true }).eq("project_id", project.id);
          const newImages = gallery.filter((img: any) => !existingUrls.has(img.url)).map((img: any, i: number) => ({
            project_id: project.id, image_url: img.url, alt_text: img.alt_text,
            display_order: (existingCount || 0) + i, data_source: "auto_enrich",
          }));
          if (newImages.length > 0) {
            const { error: err } = await supabase.from("project_images").insert(newImages);
            if (!err) pImages = newImages.length;
          }
        }

        // Documents
        if (documents.length > 0) {
          const { data: existingDocs } = await supabase.from("project_documents").select("file_url").eq("project_id", project.id);
          const existingDocUrls = new Set((existingDocs || []).map((d: any) => d.file_url));
          const newDocs = documents.filter((d: any) => !existingDocUrls.has(d.url)).map((doc: any, i: number) => ({
            project_id: project.id, file_url: doc.url, document_type: doc.type || "brochure",
            file_name: doc.name || "Document", data_source: "auto_enrich", display_order: i,
          }));
          for (const doc of newDocs) {
            const { error: err } = await supabase.from("project_documents").insert(doc);
            if (!err) pDocs++;
          }
        }

        // Project fields
        const updates: Record<string, any> = {
          reelly_raw_data: reellyData,
          detail_fetched_at: new Date().toISOString(),
        };

        if (amenities.length > 0 && !(project.amenities as any[])?.length) updates.amenities = amenities;
        if (Object.keys(amenityImages).length > 0 && !project.amenity_images) updates.amenity_images = amenityImages;
        if (ppBreakdown && !project.payment_breakdown) updates.payment_breakdown = ppBreakdown;
        if (ppText && !project.payment_plan) updates.payment_plan = ppText;
        if (poi && !(project.location_distances as any[])?.length) updates.location_distances = poi;
        if (vids.video_url && !project.video_url) { updates.video_url = vids.video_url; updates.video_urls = vids.video_urls; }
        if (units) updates.unit_types = units;
        if (fps) updates.floor_plan_types = fps;
        if (sc && !project.service_charge) updates.service_charge = sc;
        if (!project.description && reellyData?.overview) updates.description = reellyData.overview;
        if (!project.description && reellyData?.short_description) updates.description = reellyData.short_description;
        if (reellyData?.highlights?.length > 0 && !(project.highlights as any[])?.length) {
          updates.highlights = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }
        if (!(project.usp_bullets as any[])?.length && reellyData?.highlights?.length > 0) {
          updates.usp_bullets = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }
        if (reellyData?.roi_estimate != null && project.roi_estimate == null) updates.roi_estimate = reellyData.roi_estimate;

        const { error: err } = await supabase.from("projects").update(updates).eq("id", project.id);
        if (!err) pFields = Object.keys(updates).length - 2;

        imagesAdded += pImages;
        docsAdded += pDocs;
        fieldsUpdated += pFields;
        processed++;

        logEntries.push({
          time: new Date().toISOString(),
          msg: `✅ ${project.name}: +${pImages} imgs, +${pDocs} docs, +${pFields} fields`,
        });

      } catch (err) {
        errors++;
        processed++;
        logEntries.push({
          time: new Date().toISOString(),
          msg: `❌ ${project.name}: ${err instanceof Error ? err.message : String(err)}`,
        });
      }

      // Update progress every project
      await supabase.from("enrichment_jobs").update({
        processed, images_added: imagesAdded, docs_added: docsAdded,
        fields_updated: fieldsUpdated, errors,
        log: logEntries.slice(-200),
      }).eq("id", jobId);

      // Send notification every 50 projects
      if (processed % 50 === 0 && ownerUserId) {
        await supabase.from("user_notifications").insert({
          user_id: ownerUserId,
          title: "Enrichment Progress",
          message: `${processed} of ${total} projects enriched (+${imagesAdded} images, +${docsAdded} docs)`,
          type: "system",
          is_read: false,
        });
      }

      // Rate limit: 500ms between projects
      await new Promise(r => setTimeout(r, 500));
    }

    // Final update
    await supabase.from("enrichment_jobs").update({
      status: "completed", processed, images_added: imagesAdded, docs_added: docsAdded,
      fields_updated: fieldsUpdated, errors, completed_at: new Date().toISOString(),
      log: logEntries.slice(-200),
    }).eq("id", jobId);

    // Final notification
    if (ownerUserId) {
      await supabase.from("user_notifications").insert({
        user_id: ownerUserId,
        title: "🎉 Enrichment Complete",
        message: `All ${processed} projects enriched! +${imagesAdded} images, +${docsAdded} docs, +${fieldsUpdated} fields updated.`,
        type: "system",
        is_read: false,
      });
    }

  } catch (err) {
    console.error("[background-enrichment] Fatal:", err);
    await supabase.from("enrichment_jobs").update({
      status: "failed", completed_at: new Date().toISOString(),
      log: [{ time: new Date().toISOString(), msg: `Fatal: ${err instanceof Error ? err.message : String(err)}` }],
    }).eq("id", jobId);
  }
}

// ── Main handler ──

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
    const action = body.action || "start";

    // ── STATUS: return current job progress ──
    if (action === "status") {
      const { data: activeJob } = await supabase
        .from("enrichment_jobs")
        .select("*")
        .in("status", ["pending", "running"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeJob) {
        return json(200, { active: true, job: activeJob });
      }

      // Return last completed job
      const { data: lastJob } = await supabase
        .from("enrichment_jobs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return json(200, { active: false, job: lastJob });
    }

    // ── STOP: request stop ──
    if (action === "stop") {
      const { data: activeJob } = await supabase
        .from("enrichment_jobs")
        .select("id")
        .in("status", ["pending", "running"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeJob) {
        await supabase.from("enrichment_jobs").update({ stop_requested: true }).eq("id", activeJob.id);
        return json(200, { success: true, message: "Stop requested" });
      }
      return json(200, { success: true, message: "No active job to stop" });
    }

    // ── START: create job and kick off background processing ──
    // Check for already running job
    const { data: existing } = await supabase
      .from("enrichment_jobs")
      .select("id, status, processed, total_projects")
      .in("status", ["pending", "running"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return json(200, {
        success: true, already_running: true,
        message: `Job already running: ${existing.processed}/${existing.total_projects}`,
        job_id: existing.id,
      });
    }

    // Get auth user from header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    // Create job record
    const { data: newJob, error: jobErr } = await supabase
      .from("enrichment_jobs")
      .insert({ status: "pending", created_by: userId })
      .select("id")
      .single();

    if (jobErr || !newJob) {
      return json(500, { error: "Failed to create job: " + (jobErr?.message || "unknown") });
    }

    // Fire and forget — use EdgeRuntime.waitUntil for persistent background processing
    const bgPromise = processAllProjects(newJob.id, supabaseUrl, supabaseKey, reellyApiKey);
    
    // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgPromise);
    } else {
      // Fallback: just let it run (will be cut at timeout but won't crash the response)
      bgPromise.catch(err => console.error("[background-enrichment] bg error:", err));
    }

    return json(200, {
      success: true,
      message: "Background enrichment started",
      job_id: newJob.id,
    });

  } catch (err) {
    console.error("[background-enrichment] Error:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
