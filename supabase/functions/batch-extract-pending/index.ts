import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Batch Extract Pending Imports – processes ALL pending imports with PENDING_SCRAPE review_notes
 * and updates them with full extraction (description, images, documents, amenities, etc.)
 */

// Global banned terms for sanitization
const BANNED_TERMS_REGEX = /\b(Provident|Provident Estate|providentestate)\b/gi;

function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text.replace(BANNED_TERMS_REGEX, "").replace(/\s{2,}/g, " ").trim() || null;
}

async function sleep(ms: number, jitter = 0.2): Promise<void> {
  const jitterMs = ms * jitter * Math.random();
  return new Promise((r) => setTimeout(r, ms + jitterMs));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 502 || res.status === 503 || res.status === 429) {
        // RATE LIMIT FIX: Exponential backoff with longer waits
        // attempt 1: 10s, attempt 2: 20s, attempt 3: 40s
        const baseWait = 10000 * Math.pow(2, attempt - 1);
        const wait = baseWait + Math.random() * 5000;
        console.warn(`[Retry ${attempt}/${maxRetries}] Got ${res.status}, waiting ${Math.round(wait)}ms...`);
        await sleep(wait, 0);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const wait = attempt * 5000;
      console.warn(`[Retry ${attempt}/${maxRetries}] Network error, waiting ${wait}ms...`);
      await sleep(wait, 0);
    }
  }
  throw lastError || new Error("Max retries exceeded");
}

function extractSlugFromUrl(url: string): string {
  const match = url.match(/\/new-projects\/([^\/\?#]+)/);
  return match?.[1]?.toLowerCase().replace(/\/$/, "") || "";
}

function extractImagesFromHtml(html: string, links: string[]): string[] {
  // CRITICAL PLACEHOLDER EXCLUSIONS:
  // These are site-wide placeholder/template images that get incorrectly assigned to projects.
  // They must NEVER be used as project images.
  const PLACEHOLDER_FILENAMES = [
    'grid_01_50def6e330',      // Most common placeholder (667+ listings had this)
    'signature_property_47dbd09aff', // Second most common placeholder (67+ listings)
    'property_management_b164aaddda', // Management placeholder
    'apartment_navbar',        // Navbar images
    'spons_mob_',              // Sponsor mobile images
    '340x270',                 // Low-res placeholder dimensions
    '16x16',                   // Tiny placeholder dimensions
  ];
  
  const isPlaceholder = (url: string): boolean => {
    const lower = url.toLowerCase();
    return PLACEHOLDER_FILENAMES.some(p => lower.includes(p.toLowerCase()));
  };
  
  // Enhanced filter patterns for UI/non-project images
  const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|_thumb|social|share|button|btn_|grid_\d+)/i;
  
  // Collect all cloudfront images
  const allImages: string[] = [];
  const projectGalleryImages: string[] = []; // Higher priority: /off-plan/{id}/images/
  
  for (const l of links) {
    if (l.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(l)) {
      if (!isPlaceholder(l) && !excludePatterns.test(l)) {
        allImages.push(l);
        // Mark high-quality gallery images
        if (l.includes("/off-plan/") && l.includes("/images/")) {
          projectGalleryImages.push(l);
        }
      }
    }
  }
  
  const imgRx = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRx.exec(html)) !== null) {
    if (m[1]?.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(m[1])) {
      if (!isPlaceholder(m[1]) && !excludePatterns.test(m[1])) {
        allImages.push(m[1]);
        if (m[1].includes("/off-plan/") && m[1].includes("/images/")) {
          projectGalleryImages.push(m[1]);
        }
      }
    }
  }
  
  // Prioritize gallery images, but accept any valid cloudfront image
  const prioritized = projectGalleryImages.length >= 2 
    ? [...new Set(projectGalleryImages)]
    : [...new Set([...projectGalleryImages, ...allImages])];
  
  // Deduplicate
  const uniqueImages = [...new Set(prioritized)];
  
  // Return up to 15 images (or empty if none found)
  if (uniqueImages.length === 0) {
    console.warn(`[ExtractImages] No valid images found - all were placeholders or excluded`);
  }
  
  return uniqueImages.slice(0, 15);
}

function extractPdfsFromHtml(html: string, markdown: string): { brochure: string | null; paymentPlan: string | null; floorPlans: string[] } {
  const pdfRx = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
  const pdfLinks = [...new Set([...(markdown.match(pdfRx) || []), ...(html.match(pdfRx) || [])])];
  let brochure: string | null = null;
  let paymentPlan: string | null = null;
  const floorPlans: string[] = [];
  for (const p of pdfLinks) {
    const lower = p.toLowerCase();
    if (!brochure && lower.includes("brochure")) brochure = p;
    else if (!paymentPlan && (lower.includes("payment") || lower.includes("plan"))) paymentPlan = p;
    else if (lower.includes("floor")) floorPlans.push(p);
  }
  if (!brochure && pdfLinks.length > 0) {
    const leftover = pdfLinks.filter((p) => p !== paymentPlan && !floorPlans.includes(p));
    if (leftover.length > 0) brochure = leftover[0];
  }
  return { brochure, paymentPlan, floorPlans };
}

function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

function extractDescriptionFromMarkdown(markdown: string): string | null {
  const aboutMatch = markdown.match(/About the project\s*\n+([^\n#]+(?:\n[^\n#]+)*)/i);
  if (aboutMatch?.[1]) {
    const desc = stripMarkdownLinks(aboutMatch[1]).replace(/\n+/g, " ").trim();
    if (desc.length > 50) return sanitizeText(desc);
  }
  const paragraphs = markdown.split(/\n\n+/);
  for (const p of paragraphs) {
    const cleaned = stripMarkdownLinks(p).replace(/\n/g, " ").trim();
    if (cleaned.length > 100 && !cleaned.startsWith("#") && !/^(Buy|Rent|Projects|Developers|Areas|Services|Blogs|Register|Details|Gallery|Floor Plans|Amenities|Location|Payment Plans)/i.test(cleaned)) {
      return sanitizeText(cleaned.slice(0, 800));
    }
  }
  return null;
}

function extractTextFromMarkdown(markdown: string): {
  name: string | null;
  developerName: string | null;
  location: string | null;
  bedrooms: string | null;
  priceFrom: number | null;
  handover: string | null;
  paymentPlan: string | null;
  description: string | null;
  propertyType: string | null;
  statusLabel: string | null;
} {
  const cleanMd = stripMarkdownLinks(markdown);
  
  // CRITICAL: Extract FULL project name exactly as displayed on source
  const titleMatch = cleanMd.match(/^#\s+(.+)/m);
  let name = titleMatch?.[1]?.trim() || null;
  if (name) {
    // Keep the full name but remove developer suffix after "by"
    name = name.replace(/\s+by\s+[A-Z].*$/i, "").trim();
    name = sanitizeText(name);
  }
  
  // Extract developer from markdown link or plain text
  const devLinkMatch = markdown.match(/\[by\s+([^\]]+)\]/i);
  let developerName = devLinkMatch?.[1]?.trim() || null;
  if (!developerName) {
    const devMatch = cleanMd.match(/by\s+([A-Z][A-Za-z\s&]+?)(?:\s*\n|\s*in\s)/i);
    developerName = devMatch?.[1]?.trim() || null;
  }
  
  // Location extraction - keep full location name
  const locMatch = cleanMd.match(/(?:at|in)\s+([A-Z][A-Za-z\s,\-]+?)(?:\s*\||$|\n)/i);
  const location = locMatch?.[1]?.trim() || null;
  
  // Bedroom extraction
  const bedMatch = cleanMd.match(/((?:Studio|[\d,&\s\-]+)\s*(?:BR|Bedrooms?|Bedroom))/i);
  const bedrooms = bedMatch?.[1]?.trim() || null;
  
  // CRITICAL: Extract EXACT price from source - look for AED price specifically
  let priceFrom: number | null = null;
  // Safety floor: if parsing yields an obviously invalid number (e.g. 2), drop it.
  const MIN_REASONABLE_PRICE_AED = 50_000;
  // First try to find "From AED X" or "Starting from AED X" pattern
  // IMPORTANT: include optional K/M suffix, otherwise "AED 2M" becomes "AED 2" (legal-risk display bug).
  const aedFromMatch = cleanMd.match(/(?:from|starting\s+from)\s*AED\s*([\d,.]+)\s*(K|M)?/i);
  if (aedFromMatch) {
    let val = parseFloat(aedFromMatch[1].replace(/,/g, ""));
    if (aedFromMatch[2]?.toUpperCase() === "K") val *= 1000;
    if (aedFromMatch[2]?.toUpperCase() === "M") val *= 1000000;
    priceFrom = Math.round(val);
  } else {
    // Try "AED X" format
    const aedMatch = cleanMd.match(/AED\s*([\d,.]+)\s*(K|M)?/i);
    if (aedMatch) {
      let val = parseFloat(aedMatch[1].replace(/,/g, ""));
      if (aedMatch[2]?.toUpperCase() === "K") val *= 1000;
      if (aedMatch[2]?.toUpperCase() === "M") val *= 1000000;
      priceFrom = Math.round(val);
    } else {
      // Try EUR/USD with conversion
      const priceMatch = cleanMd.match(/(EUR|USD)\s*([\d,.]+)\s*(K|M)?/i);
      if (priceMatch) {
        let val = parseFloat(priceMatch[2].replace(/,/g, ""));
        if (priceMatch[3]?.toUpperCase() === "K") val *= 1000;
        if (priceMatch[3]?.toUpperCase() === "M") val *= 1000000;
        if (priceMatch[1].toUpperCase() === "EUR") val *= 4.0;
        if (priceMatch[1].toUpperCase() === "USD") val *= 3.67;
        priceFrom = Math.round(val);
      }
    }
  }

  if (typeof priceFrom === "number" && priceFrom > 0 && priceFrom < MIN_REASONABLE_PRICE_AED) {
    priceFrom = null;
  }
  
  // Handover date extraction
  const handoverMatch = cleanMd.match(/(?:Handover|Completion)[:\s]*(Q[1-4]?\s*\d{4}|\d{4}|Ready)/i);
  const handover = handoverMatch?.[1]?.trim() || null;
  
  // Payment plan extraction
  const ppMatch = cleanMd.match(/(\d{2}\/\d{2})/);
  const paymentPlan = ppMatch?.[1] || null;
  
  // Description extraction
  const description = extractDescriptionFromMarkdown(markdown);
  
  // Property type extraction
  const typeMatch = cleanMd.match(/(Apartment|Villa|Townhouse|Penthouse|Sky[- ]?Villa|Studio)/i);
  const propertyType = typeMatch?.[1] || null;
  
  // Status label extraction
  const statusMatch = cleanMd.match(/(Future Launch|New Phase|New Launch|Coming Soon|Sold Out)/i);
  const statusLabel = statusMatch?.[1] || null;
  
  return { name, developerName, location, bedrooms, priceFrom, handover, paymentPlan, description, propertyType, statusLabel };
}

function parseBedrooms(bedroomStr: string | null): { min: number | null; max: number | null } | null {
  if (!bedroomStr) return null;
  const matches = bedroomStr.match(/(\d+)/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map((m) => parseInt(m));
  return { min: nums[0], max: nums.length > 1 ? nums[nums.length - 1] : nums[0] };
}

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
      limit: rawLimit = 25,
      dryRun = false,
      throttleMs: rawThrottleMs = 3000,
      concurrency: rawConcurrency = 1,
    } = await req.json().catch(() => ({}));

    // RATE LIMIT FIX: Lower defaults to avoid 429 errors
    // - limit: 25 items per batch (was 50)
    // - concurrency: 1 (was 3) - process one at a time
    // - throttleMs: 3000ms (was 1000ms) - longer delay between items
    const limit = Math.max(1, Math.min(Number(rawLimit) || 25, 100));
    const throttleMs = Math.max(1000, Math.min(Number(rawThrottleMs) ?? 3000, 10000));
    const concurrency = Math.max(1, Math.min(Number(rawConcurrency) || 1, 5));

    console.log(
      `[BatchExtract] Starting (limit=${limit}, concurrency=${concurrency}, dryRun=${dryRun}, throttleMs=${throttleMs})...`,
    );

    // Get developers for matching
    const { data: devs } = await supabase.from("developers").select("id, name, slug");
    const devList = devs || [];
    const devMap = buildDeveloperMap(devList);

    // Fetch pending imports that still need extraction
    // FIXED: Also target rows where images/documents are NULL (not just empty array [])
    const { data: imports, error: fetchErr } = await supabase
      .from("pending_project_imports")
      .select("id, name, slug, source_url, images, documents, description, review_notes, amenities")
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

    if (!imports || imports.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No imports need extraction", stats: { processed: 0, success: 0, errors: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[BatchExtract] Found ${imports.length} imports to process`);

    const stats = { processed: 0, success: 0, errors: 0, images: 0, documents: 0 };
    const errors: Array<{ name: string; error: string }> = [];

    const processOne = async (item: any) => {
      if (!item.source_url) {
        throw new Error("No source_url");
      }

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

      const extracted = extractTextFromMarkdown(markdown);
      const imageUrls = extractImagesFromHtml(html, links);
      const { brochure, paymentPlan: ppUrl, floorPlans } = extractPdfsFromHtml(html, markdown);
      const beds = parseBedrooms(extracted.bedrooms);
      const dev = matchDeveloper(extracted.developerName, devMap);

      const imagesPayload = imageUrls.map((url, i) => ({
        url,
        alt_text: `${item.name} - Image ${i + 1}`,
        display_order: i,
      }));

      const documentsPayload: Array<{ url: string; type: string; name?: string }> = [];
      if (brochure) documentsPayload.push({ url: brochure, type: "brochure", name: `${item.name} Brochure.pdf` });
      if (ppUrl) documentsPayload.push({ url: ppUrl, type: "payment_plan", name: `${item.name} Payment Plan.pdf` });
      for (const fp of floorPlans) documentsPayload.push({ url: fp, type: "floor_plan", name: `${item.name} Floor Plan.pdf` });

      // Images already filtered by extractImagesFromHtml - no additional filtering needed
      // The function returns [] if < 2 valid images were found
      const validImageCount = imagesPayload.length;
      
      // STRICT completeness check (mirrors Provident listing quality):
      // 1. Has description (not empty)
      // 2. Has developer name (not "unknown")
      // 3. Has at least 2 unique real project images (already enforced by extractImagesFromHtml)
      // 4. Has at least 1 document (brochure/payment plan/floor plan)
      const hasDescription = Boolean(extracted.description && extracted.description.length > 50);
      const hasDeveloper = Boolean(extracted.developerName && extracted.developerName.toLowerCase() !== 'unknown');
      const hasValidImages = validImageCount >= 2;
      const hasDocs = documentsPayload.length > 0;
      
      const isComplete = hasDescription && hasDeveloper && hasValidImages && hasDocs;
      const stillIncomplete = !isComplete;

      if (dryRun) {
        return { images: imagesPayload.length, documents: documentsPayload.length, stillIncomplete };
      }

      const { error: updateErr } = await supabase
        .from("pending_project_imports")
        .update({
          // Overwrite placeholder name with the real source title (prevents "Act One"/"Act" style duplicates).
          name: sanitizeText(extracted.name) || item.name,
          developer_name: sanitizeText(extracted.developerName) || item.developer_name || null,
          developer_id: dev?.id || null,
          description: extracted.description,
          price_from: extracted.priceFrom || null,
          bedrooms_min: beds?.min || null,
          bedrooms_max: beds?.max || null,
          handover_date: extracted.handover || null,
          payment_plan: extracted.paymentPlan || null,
          property_type_label: extracted.propertyType || null,
          status_label: extracted.statusLabel || null,
          images: imagesPayload,
          documents: documentsPayload,
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
      const chunk = imports.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        chunk.map(async (item: any) => {
          console.log(`[BatchExtract] Processing ${item.name}...`);
          return await processOne(item);
        }),
      );

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

      // Optional throttle between chunks (set throttleMs=0 for turbo runs)
      if (throttleMs > 0 && i + concurrency < imports.length) {
        await sleep(throttleMs, 0.2);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[BatchExtract] Complete in ${duration}ms: ${stats.success} success, ${stats.errors} errors`);

    return new Response(JSON.stringify({ success: true, stats, errors: errors.slice(0, 10), duration_ms: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
