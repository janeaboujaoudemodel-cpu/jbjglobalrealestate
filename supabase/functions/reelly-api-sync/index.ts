import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE, ReellyProject, ReellyResponse, ReellyLocation,
  generateSlug, generateAreaSlug, generateDeveloperSlug,
  mapConstructionStatus, mapSaleStatus, getEmirateFromRegion,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";

/**
 * Reelly API Sync v3 - PERSISTENT SYNC WITH RESUME CAPABILITY
 * 
 * Features:
 * - Saves progress to sync_jobs table after every batch
 * - Resumes from last cursor on restart
 * - Survives page refresh, tab close, server restart
 * - Supports pause/resume/cancel operations
 */

function extractPaymentPlan(overview: string | null, apiPlan?: ReellyProject['payment_plan']): { payment_plan: string | null; payment_breakdown: Record<string, string> | null } {
  if (apiPlan?.milestones?.length) {
    const breakdown: Record<string, string> = {};
    for (const m of apiPlan.milestones) {
      const desc = m.description?.toLowerCase() || '';
      if (desc.includes('booking') || desc.includes('down')) breakdown.down_payment = `${m.percentage}%`;
      else if (desc.includes('construction')) breakdown.during_construction = `${m.percentage}%`;
      else if (desc.includes('handover') || desc.includes('completion')) breakdown.on_completion = `${m.percentage}%`;
    }
    const down = parseInt(breakdown.down_payment || '0');
    const comp = parseInt(breakdown.on_completion || '0');
    return { payment_plan: down && comp ? `${100 - comp}/${comp}` : apiPlan.name || null, payment_breakdown: Object.keys(breakdown).length ? breakdown : null };
  }
  if (!overview) return { payment_plan: null, payment_breakdown: null };
  const match = overview.match(/(\d{2})\/(\d{2})/);
  if (match && parseInt(match[1]) + parseInt(match[2]) === 100) {
    return { payment_plan: `${match[1]}/${match[2]}`, payment_breakdown: { down_payment: `${Math.min(parseInt(match[1]), 20)}%`, on_completion: `${match[2]}%` } };
  }
  return { payment_plan: null, payment_breakdown: null };
}

async function getOrCreateDeveloper(supabase: ReturnType<typeof createClient>, name: string | null): Promise<string | null> {
  if (!name?.trim()) return null;
  const slug = generateDeveloperSlug(name.trim());
  const { data: existing } = await supabase.from("developers").select("id").ilike("name", name.trim()).maybeSingle();
  if (existing) return existing.id;
  const { data: bySlug } = await supabase.from("developers").select("id").eq("slug", slug).maybeSingle();
  if (bySlug) return bySlug.id;
  const { data: created, error } = await supabase.from("developers").insert({ name: name.trim(), slug, is_active: true }).select("id").single();
  if (error?.code === "23505") {
    const { data: retry } = await supabase.from("developers").select("id").ilike("name", name.trim()).maybeSingle();
    return retry?.id || null;
  }
  return created?.id || null;
}

async function upsertArea(supabase: ReturnType<typeof createClient>, loc: ReellyLocation | null, cache: Map<string, string>): Promise<string | null> {
  if (!loc?.district) return null;
  const slug = generateAreaSlug(loc.district);
  if (cache.has(slug)) return cache.get(slug)!;
  const { data: existing } = await supabase.from("areas").select("id").eq("slug", slug).maybeSingle();
  if (existing) { cache.set(slug, existing.id); return existing.id; }
  const { data: created, error } = await supabase.from("areas").insert({
    name: loc.district, slug, emirate: getEmirateFromRegion(loc.region), reelly_id: loc.id, latitude: loc.latitude, longitude: loc.longitude, is_active: true
  }).select("id").single();
  if (error?.code === "23505") {
    const { data: retry } = await supabase.from("areas").select("id").eq("slug", slug).maybeSingle();
    if (retry) cache.set(slug, retry.id);
    return retry?.id || null;
  }
  if (created) cache.set(slug, created.id);
  return created?.id || null;
}

function mapProject(p: ReellyProject, areaId: string | null, devId: string | null) {
  const slug = `${generateSlug(p.name, p.developer)}-${p.id}`;
  const handover = p.completion_datetime?.split('T')[0] || p.construction_end_date || p.completion_date;
  const images = extractGalleryImages(p);
  const { video_url, video_urls } = extractVideos(p);
  const docs = extractDocuments(p);
  const floors = extractFloorPlans(p);
  const amenities = extractAmenities(p);
  const units = extractUnitTypes(p);
  const { payment_plan, payment_breakdown } = extractPaymentPlan(p.overview, p.payment_plan);
  const progress = p.construction_status === 'completed' || p.construction_status === 'ready' ? 100 : p.construction_status === 'under_construction' ? 50 : 0;
  return {
    name: p.name, slug, developer_name: p.developer, developer_id: devId,
    location: [p.location?.district, p.location?.sector].filter(Boolean).join(', ') || null,
    emirate: getEmirateFromRegion(p.location?.region), description: p.overview || p.short_description,
    short_description: p.short_description, price_from: p.min_price > 0 ? p.min_price : null, price_to: p.max_price > 0 ? p.max_price : null,
    size_min: p.min_size > 0 ? p.min_size : null, size_max: p.max_size > 0 ? p.max_size : null,
    handover_date: handover, handover_display: p.completion_date, status_label: mapSaleStatus(p.sale_status) || mapConstructionStatus(p.construction_status),
    construction_status: mapConstructionStatus(p.construction_status), sale_status: mapSaleStatus(p.sale_status),
    images: images.length ? images : null, latitude: p.location?.latitude, longitude: p.location?.longitude,
    total_units: p.units_count > 0 ? p.units_count : null, building_count: p.building_count > 0 ? p.building_count : null,
    bedrooms_min: units.length > 0 ? Math.min(...units.map((u: any) => u.bedrooms ?? Infinity).filter((b: number) => b !== Infinity)) : null,
    bedrooms_max: units.length > 0 ? Math.max(...units.map((u: any) => u.bedrooms ?? -1).filter((b: number) => b !== -1)) : null,
    construction_start_date: p.construction_start_date, construction_progress: progress,
    video_url, video_urls: video_urls.length ? video_urls : null, payment_plan, payment_breakdown, area_id: areaId, area_name: p.location?.district,
    documents: docs.length ? docs : null, floor_plan_types: floors.length ? floors : null, amenities: amenities.length ? amenities : null,
    unit_types: units.length ? units : null, highlights: p.highlights?.length ? p.highlights : null, faqs: p.faqs?.length ? p.faqs : null,
    source_url: `https://reelly.io/project/${p.id}#reelly_${p.id}`, reelly_id: p.id, source_updated_at: p.updated_at,
  };
}

async function fetchPage(apiKey: string, url: string): Promise<ReellyResponse> {
  console.log(`[fetchPage] URL: ${url}, key starts: ${apiKey.slice(0,20)}...`);
  const res = await fetch(url, { headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[fetchPage] Error ${res.status}: ${body}`);
    throw new Error(`API error ${res.status}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "REELLY_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync";
    const limit = Math.min(Math.max(body.limit || 100, 1), 200);
    const jobId = body.job_id || null;
    const resumeFromCursor = body.resume_cursor || null;
    const forceOverwrite = body.force_overwrite === true; // Force overwrite mode for full extraction

    // TEST action - just check API connection
    if (action === 'test') {
      const data = await fetchPage(apiKey, `${REELLY_API_BASE}?limit=3`);
      return new Response(JSON.stringify({ success: true, total_available: data.count, sample: data.results.slice(0, 2).map(p => ({ id: p.id, name: p.name, developer: p.developer })) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // RESUME action - check for interrupted job and return cursor
    if (action === 'check_resume') {
      const { data: activeJob } = await supabase
        .from("sync_jobs")
        .select("*")
        .eq("source", "reelly")
        .in("status", ["running", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeJob) {
        // If job has no cursor, it's stale — auto-complete it
        if (!activeJob.next_cursor) {
          await supabase.from("sync_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", activeJob.id);
          return new Response(JSON.stringify({ success: true, has_active_job: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({
          success: true,
          has_active_job: true,
          job: {
            id: activeJob.id,
            status: activeJob.status,
            current_page: activeJob.current_page,
            total_pages: activeJob.total_pages,
            next_cursor: activeJob.next_cursor,
            stats: {
              created: activeJob.stats_created,
              updated: activeJob.stats_updated,
              skipped: activeJob.stats_skipped,
              errors: activeJob.stats_errors,
            }
          }
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      return new Response(JSON.stringify({ success: true, has_active_job: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // SYNC action - process one batch, persist progress
    const cursor = resumeFromCursor || body.cursor || null;
    const url = cursor || `${REELLY_API_BASE}?limit=${limit}`;
    if (!url.startsWith("https://api-reelly.up.railway.app/api/v2/clients/projects")) throw new Error("Invalid URL");
    
    const page = await fetchPage(apiKey, url);
    const { data: existing } = await supabase.from("pending_project_imports").select("source_url, status").like("source_url", "%reelly_%");
    const existMap = new Map((existing || []).map(r => [r.source_url?.match(/#(reelly_\d+)$/)?.[1], r.status]));
    const areaCache = new Map<string, string>();
    let inserted = 0, updated = 0, skipped = 0;
    const errors: string[] = [];

    for (const p of page.results) {
      try {
        const extId = `reelly_${p.id}`;
        // Only skip approved if NOT in force overwrite mode
        if (!forceOverwrite && existMap.get(extId) === 'approved') { skipped++; continue; }
        const areaId = await upsertArea(supabase, p.location, areaCache);
        const devId = await getOrCreateDeveloper(supabase, p.developer);
        const mapped = mapProject(p, areaId, devId);
        const { data: ex } = await supabase.from("pending_project_imports").select("id, status").like("source_url", `%${extId}%`).maybeSingle();
        if (ex) {
          // In force overwrite mode, update ALL records including approved ones
          if (!forceOverwrite && ex.status === 'approved') { skipped++; continue; }
          await supabase.from("pending_project_imports").update({ 
            ...mapped, 
            // In force mode, preserve the existing status; otherwise always set to pending
            status: forceOverwrite ? ex.status : 'pending',
            updated_at: new Date().toISOString() 
          }).eq("id", ex.id);
          updated++;
        } else {
          const { error } = await supabase.from("pending_project_imports").insert({ ...mapped, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          if (error?.code === "23505") { skipped++; continue; }
          if (error) throw error;
          inserted++;
        }
      } catch (e: any) { errors.push(`${p.name}: ${e.message}`); }
    }

    // PERSIST PROGRESS to sync_jobs table if job_id provided
    if (jobId) {
      const updateData: Record<string, unknown> = {
        current_page: (body.current_page || 0) + 1,
        next_cursor: page.next || null,
        stats_created: (body.stats_created || 0) + inserted,
        stats_updated: (body.stats_updated || 0) + updated,
        stats_skipped: (body.stats_skipped || 0) + skipped,
        stats_errors: (body.stats_errors || 0) + errors.length,
        updated_at: new Date().toISOString(),
      };
      
      // If done, mark as completed and trigger feature image backfill
      if (!page.next) {
        updateData.status = "completed";
        updateData.completed_at = new Date().toISOString();
        
        // Auto-trigger developer feature image backfill
        try {
          await supabase.functions.invoke("sync-developer-feature-images", {
            body: { dryRun: false }
          });
        } catch (backfillErr) {
          console.error("Feature image backfill failed:", backfillErr);
        }
      }
      
      // Append errors to error_log
      if (errors.length > 0) {
        const { data: currentJob } = await supabase.from("sync_jobs").select("error_log").eq("id", jobId).single();
        const existingErrors = Array.isArray(currentJob?.error_log) ? currentJob.error_log : [];
        updateData.error_log = [...existingErrors, ...errors].slice(-100); // Keep last 100 errors
      }
      
      await supabase.from("sync_jobs").update(updateData).eq("id", jobId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total_available: page.count, 
      page_fetched: page.results.length, 
      inserted, 
      updated, 
      skipped, 
      errors: errors.slice(0, 10), 
      next_cursor: page.next, 
      done: !page.next,
      job_id: jobId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
