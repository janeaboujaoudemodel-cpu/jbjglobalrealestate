import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchWithRetry, sleep } from "../_shared/provident/http.ts";
import { extractProvidentProjectFromScrape } from "../_shared/provident/extract.ts";
import { fetchProvidentPageDataPdfUrls } from "../_shared/provident/pagedata.ts";
import { mirrorRemotePdfToPublicStorage } from "../_shared/provident/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Batch Extract Pending Imports – processes ALL pending imports with PENDING_SCRAPE review_notes
 * and updates them with full extraction (description, images, documents, amenities, etc.)
 */

function extractSlugFromUrl(url: string): string {
  const match = url.match(/\/new-projects\/([^\/\?#]+)/);
  return match?.[1]?.toLowerCase().replace(/\/$/, "") || "";
}

const PROVIDENT_BASE = "https://providentestate.com";
const PROJECT_FILES_BUCKET = "project-files";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const {
      limit: rawLimit = 10,
      dryRun = false,
      throttleMs: rawThrottleMs = 2500,
      concurrency: rawConcurrency = 1,
      // Keep responses under typical client timeouts.
      // If the batch is still doing work when we hit this budget, it will return early
      // and the UI can immediately call again.
      maxDurationMs: rawMaxDurationMs = 50_000,
      // NEW: Optional target ID - extract a single specific item (for testing)
      targetId = null,
    } = await req.json().catch(() => ({}));

    // Guardrails for stability + to avoid client timeouts.
    // NOTE: UI can call this function repeatedly; each call should be short and safe.
    const limit = targetId ? 1 : Math.max(1, Math.min(Number(rawLimit) || 10, 25));
    const throttleMs = Math.max(0, Math.min(Number(rawThrottleMs) ?? 2500, 10_000));
    const concurrency = Math.max(1, Math.min(Number(rawConcurrency) || 1, 3));
    const maxDurationMs = Math.max(10_000, Math.min(Number(rawMaxDurationMs) || 50_000, 55_000));

    console.log(
      `[BatchExtract] Starting (limit=${limit}, concurrency=${concurrency}, dryRun=${dryRun}, throttleMs=${throttleMs}, maxDurationMs=${maxDurationMs}, targetId=${targetId || 'none'})...`,
    );

    // Get developers for matching
    const { data: devs } = await supabase.from("developers").select("id, name, slug");
    const devList = devs || [];
    const devMap = buildDeveloperMap(devList);

    // Fetch pending imports that need extraction
    let imports: any[] = [];

    if (targetId) {
      // SINGLE TARGET MODE: Extract a specific item by ID
      const { data: targetItem, error: targetErr } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, source_url, images, documents, description, review_notes, amenities, developer_name")
        .eq("id", targetId)
        .eq("status", "pending")
        .single();

      if (targetErr) {
        return new Response(JSON.stringify({ error: `Target item not found: ${targetErr.message}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      imports = [targetItem];
      console.log(`[BatchExtract] Single target mode: processing ${targetItem.name}`);
    } else {
      // BATCH MODE: Fetch pending imports that still need extraction
      // FIXED: Also target rows where images/documents are NULL (not just empty array [])
      const { data: batchImports, error: fetchErr } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, source_url, images, documents, description, review_notes, amenities, developer_name")
        .eq("status", "pending")
        // NOTE: PostgREST OR syntax - include null checks for images/documents
        .or(
          [
            "review_notes.ilike.%PENDING_SCRAPE%",
            "review_notes.eq.INCOMPLETE",
            "review_notes.ilike.ERROR:%",
            "images.eq.[]",
            "images.is.null",
            "documents.eq.[]",
            "documents.is.null",
            "description.is.null",
            "developer_name.is.null",
            "developer_name.eq.Unknown"
          ].join(","),
        )
        .order("created_at", { ascending: true })
        .limit(limit);

      if (fetchErr) {
        return new Response(JSON.stringify({ error: fetchErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      imports = batchImports || [];
    }

    if (!imports || imports.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No imports need extraction", stats: { processed: 0, success: 0, errors: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[BatchExtract] Found ${imports.length} imports to process`);

    const stats = { processed: 0, success: 0, errors: 0, images: 0, documents: 0 };
    const errors: Array<{ name: string; error: string }> = [];
    let timeBudgetHit = false;

    const processOne = async (item: any) => {
      if (!item.source_url) {
        throw new Error("No source_url");
      }

      const slug = (item.slug || extractSlugFromUrl(item.source_url) || "").toLowerCase();

      const scrapeRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${firecrawlKey}` },
        body: JSON.stringify({
          url: item.source_url,
          formats: ["markdown", "links", "rawHtml"],
          waitFor: 5000,  // Reduced to avoid rate limiting
          timeout: 45000,
          onlyMainContent: false,
        }),
      });

      if (!scrapeRes.ok) {
        const errText = await scrapeRes.text();
        let errJson: any = {};
        try { errJson = JSON.parse(errText); } catch {}
        
        const errorCode = errJson.code || "UNKNOWN";
        
        // CRITICAL: 402 = credits exhausted — abort the entire run immediately.
        // Continuing wastes time and confuses the user.
        if (scrapeRes.status === 402) {
          console.error(`[BatchExtract] Credits exhausted for ${item.name}. Aborting batch.`);
          throw new Error(`CREDITS_EXHAUSTED`);
        }
        
        // CRITICAL: Treat SCRAPE_ALL_ENGINES_FAILED as a soft error - don't crash the whole batch
        if (errorCode === "SCRAPE_ALL_ENGINES_FAILED") {
          console.warn(`[BatchExtract] Engines blocked for ${item.name} - marking for retry`);
          throw new Error(`RATE_LIMITED: Engines blocked - retry later`);
        }
        
        console.error(`[BatchExtract] Scrape failed for ${item.name}: ${errText.substring(0, 120)}`);
        throw new Error(`Scrape failed: ${scrapeRes.status}`);
      }

      const scrapeData = await scrapeRes.json();
      const markdown = scrapeData.data?.markdown || "";
      const links = scrapeData.data?.links || [];
      const html = scrapeData.data?.rawHtml || "";

      const extracted = extractProvidentProjectFromScrape({ markdown, html, links });

      // Discover PDF URLs deterministically from Gatsby page-data (most reliable for brochure)
      const pageDataPdfs = slug
        ? await fetchProvidentPageDataPdfUrls({ baseUrl: PROVIDENT_BASE, slug })
        : { all: [], brochure: null, paymentPlan: null, floorPlans: [] as string[] };

      // Mirror PDFs into our own public storage so brochure downloads always work.
      const documentsPayload: Array<{ url: string; type: string; name?: string }> = [];

      const nameForFiles = extracted.name || item.name;

      if (pageDataPdfs.brochure) {
        const mirrored = await mirrorRemotePdfToPublicStorage({
          supabase,
          bucket: PROJECT_FILES_BUCKET,
          slug,
          type: "brochure",
          sourceUrl: pageDataPdfs.brochure,
          projectNameForFile: nameForFiles,
        });
        if (mirrored) {
          documentsPayload.push({
            url: mirrored.publicUrl,
            type: "brochure",
            name: `${nameForFiles} Brochure.pdf`,
          });
        }
      }

      if (pageDataPdfs.paymentPlan) {
        const mirrored = await mirrorRemotePdfToPublicStorage({
          supabase,
          bucket: PROJECT_FILES_BUCKET,
          slug,
          type: "payment_plan",
          sourceUrl: pageDataPdfs.paymentPlan,
          projectNameForFile: nameForFiles,
        });
        if (mirrored) {
          documentsPayload.push({
            url: mirrored.publicUrl,
            type: "payment_plan",
            name: `${nameForFiles} Payment Plan.pdf`,
          });
        }
      }

      const floorPlanUrls = (pageDataPdfs.floorPlans || []).slice(0, 10);
      for (let i = 0; i < floorPlanUrls.length; i++) {
        const fp = floorPlanUrls[i];
        const mirrored = await mirrorRemotePdfToPublicStorage({
          supabase,
          bucket: PROJECT_FILES_BUCKET,
          slug,
          type: "floor_plan",
          index: i,
          sourceUrl: fp,
          projectNameForFile: nameForFiles,
        });
        if (mirrored) {
          documentsPayload.push({
            url: mirrored.publicUrl,
            type: "floor_plan",
            name: `${nameForFiles} Floor Plan ${i + 1}.pdf`,
          });
        }
      }

      // Match developer
      const dev = matchDeveloper(extracted.developerName, devMap);

      const imagesPayload = extracted.images || [];

      // STRICT completeness check: require the full Provident detail sections + a real brochure.
      const hasDescription = Boolean(extracted.description && extracted.description.length > 50);
      const hasDeveloper = Boolean(extracted.developerName && extracted.developerName.toLowerCase() !== "unknown");
      const hasValidImages = imagesPayload.length >= 2;
      const hasBrochure = documentsPayload.some((d) => d.type === "brochure");
      const hasUsp = (extracted.uspBullets?.length ?? 0) >= 2;
      const hasAmenities = (extracted.amenities?.length ?? 0) >= 3;
      const hasFloorPlans = (extracted.floorPlanTypes?.length ?? 0) >= 1 || documentsPayload.some((d) => d.type === "floor_plan");
      const hasLocation = Boolean(
        extracted.locationHeadline &&
          ((extracted.locationDistances?.length ?? 0) >= 1 || (extracted.locationDescription?.length ?? 0) > 0),
      );
      const hasPayment = Boolean(
        extracted.paymentBreakdown?.down_payment ||
          extracted.paymentBreakdown?.during_construction ||
          extracted.paymentBreakdown?.on_completion,
      );
      const hasFaqs = (extracted.faqs?.length ?? 0) >= 1;

      const isComplete =
        hasDescription &&
        hasDeveloper &&
        hasValidImages &&
        hasBrochure &&
        hasUsp &&
        hasAmenities &&
        hasFloorPlans &&
        hasLocation &&
        hasPayment &&
        hasFaqs;

      const stillIncomplete = !isComplete;

      if (dryRun) {
        return { images: imagesPayload.length, documents: documentsPayload.length, stillIncomplete };
      }

      const { error: updateErr } = await supabase
        .from("pending_project_imports")
        .update({
          // Mirror from the source detail page.
          name: extracted.name || item.name,
          developer_name: extracted.developerName || item.developer_name || null,
          developer_id: dev?.id || null,
          description: extracted.description,
          location: extracted.location,
          price_from: extracted.priceFrom || null,
          bedrooms_min: extracted.bedroomsMin || null,
          bedrooms_max: extracted.bedroomsMax || null,
          handover_date: extracted.handover || null,
          payment_plan: extracted.paymentPlan || null,
          property_type_label: extracted.propertyType || null,
          status_label: extracted.statusLabel || null,
          images: imagesPayload,
          documents: documentsPayload,
          amenities_list: extracted.amenities,
          usp_headline: extracted.uspHeadline,
          usp_bullets: extracted.uspBullets,
          usp_image_url: extracted.uspImageUrl,
          location_headline: extracted.locationHeadline,
          location_description: extracted.locationDescription,
          location_distances: extracted.locationDistances,
          location_image_url: extracted.locationImageUrl,
          floor_plan_types: extracted.floorPlanTypes,
          faqs: extracted.faqs,
          payment_breakdown: extracted.paymentBreakdown,
          review_notes: stillIncomplete ? "INCOMPLETE" : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      return { images: imagesPayload.length, documents: documentsPayload.length, stillIncomplete };
    };

    for (let i = 0; i < imports.length; i += concurrency) {
      // Keep 1.5s headroom for logging + response serialization.
      if (Date.now() - startTime > maxDurationMs - 1500) {
        timeBudgetHit = true;
        console.warn(`[BatchExtract] Time budget hit — returning early (processed=${stats.processed}/${imports.length})`);
        break;
      }

      const chunk = imports.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        chunk.map(async (item: any) => {
          console.log(`[BatchExtract] Processing ${item.name}...`);
          return await processOne(item);
        }),
      );

      let shouldAbort = false; // set if we hit a fatal error (credits exhausted)

      for (let j = 0; j < results.length; j++) {
        const item = chunk[j];
        stats.processed++;

        const r = results[j];
        if (r.status === "fulfilled") {
          stats.success++;
          stats.images += r.value.images;
          stats.documents += r.value.documents;
          if (!dryRun) {
            console.log(
              `[BatchExtract] ✓ Updated ${item.name} (${r.value.images} imgs, ${r.value.documents} docs, incomplete=${r.value.stillIncomplete})`,
            );
          }
         } else {
           stats.errors++;
           const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
           errors.push({ name: item?.name || "(unknown)", error: msg });

           // CRITICAL: If credits exhausted, abort immediately (don't burn more time)
           if (msg.includes("CREDITS_EXHAUSTED")) {
             console.error("[BatchExtract] Credits exhausted — aborting run.");
             shouldAbort = true;
           }

           // Persist the error so the admin can see it and so it can be retried later.
           if (!dryRun && item?.id) {
             const short = msg.replace(/\s+/g, " ").slice(0, 180);
             const { error: markErr } = await supabase
               .from("pending_project_imports")
               .update({
                 review_notes: `ERROR: ${short}`,
                 updated_at: new Date().toISOString(),
               })
               .eq("id", item.id);

             if (markErr) {
               console.warn(`[BatchExtract] Failed to mark error for ${item?.name}: ${markErr.message}`);
             }
           }
         }
      }

      // If any item hit credits exhausted, stop the entire run NOW.
      if (shouldAbort) {
        timeBudgetHit = true;
        break;
      }

      // Optional throttle between chunks (set throttleMs=0 for turbo runs)
      if (throttleMs > 0 && i + concurrency < imports.length) {
        await sleep(throttleMs, 0.2);
      }
    }

    const duration = Date.now() - startTime;
    const creditsExhausted = errors.some((e) => e.error.includes("CREDITS_EXHAUSTED"));
    console.log(`[BatchExtract] Complete in ${duration}ms: ${stats.success} success, ${stats.errors} errors, creditsExhausted=${creditsExhausted}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        errors: errors.slice(0, 10),
        duration_ms: duration,
        time_budget_hit: timeBudgetHit,
        credits_exhausted: creditsExhausted,
        effective: { limit, concurrency, throttleMs, maxDurationMs },
      }),
      {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[BatchExtract] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildDeveloperMap(devList: Array<{ id: string; name: string; slug: string }>) {
  const devMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const d of devList) {
    if (!d.name) continue;
    devMap.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ""), d);
    const words = d.name.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3) devMap.set(w, d);
    }
    const nameLower = d.name.toLowerCase();
    const knownDevelopers = ["sobha", "emaar", "damac", "nakheel", "meraas", "binghatti", "azizi", "omniyat", "ellington", "danube", "select", "deyaar", "mag", "aldar", "reportage", "samana", "imtiaz", "object one", "arada", "irth", "ohana"];
    for (const known of knownDevelopers) {
      if (nameLower.includes(known)) devMap.set(known, d);
    }
  }
  return devMap;
}

function matchDeveloper(developerName: string | null, devMap: Map<string, { id: string; name: string; slug: string }>): { id: string; name: string; slug: string } | undefined {
  if (!developerName) return undefined;
  const norm = developerName.toLowerCase().replace(/[^a-z0-9]/g, "");
  let dev = devMap.get(norm);
  if (!dev) {
    for (const w of developerName.toLowerCase().split(/\s+/)) {
      if (w.length > 3 && devMap.has(w)) {
        dev = devMap.get(w);
        break;
      }
    }
  }
  return dev;
}
