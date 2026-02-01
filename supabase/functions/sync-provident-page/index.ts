import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * STRICT URL MIRROR v5 – Improved extraction + retry logic
 * 1. Derive slug directly from source URL (1:1 mirroring)
 * 2. Extract images/PDFs from HTML with regex (no AI gateway credits)
 * 3. Fetch Gatsby page-data.json for reliable document URLs
 * 4. Retry on transient errors (502, 503, 429)
 * 5. Re-queue rejected items on fresh sync
 */

// BANNED TERMS - will be stripped from all text
const BANNED_TERMS_REGEX = /\b(Provident|Provident Estate|providentestate)\b/gi;

function sanitizeText(text: string | null): string | null {
  if (!text) return null;
  return text.replace(BANNED_TERMS_REGEX, "").replace(/\s{2,}/g, " ").trim() || null;
}

interface PendingImport {
  name: string;
  slug: string;
  developer_name: string | null;
  developer_id: string | null;
  location: string | null;
  emirate: string;
  description: string | null;
  price_from: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  handover_date: string | null;
  payment_plan: string | null;
  property_type_label: string | null;
  status_label: string | null;
  images: Array<{ url: string; alt_text: string; display_order: number }>;
  documents: Array<{ url: string; type: string; name?: string }>;
  source_url: string;
  job_id?: string | null;
  is_new_project: boolean;
  status: string;
  review_notes: string | null;
}

async function sleep(ms: number, jitter = 0.2): Promise<void> {
  const jitterMs = ms * jitter * Math.random();
  return new Promise(r => setTimeout(r, ms + jitterMs));
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Retry on transient errors
      if (res.status === 502 || res.status === 503 || res.status === 429) {
        const waitMs = attempt * 3000 + Math.random() * 2000;
        console.warn(`[Retry ${attempt}/${maxRetries}] Got ${res.status}, waiting ${Math.round(waitMs)}ms...`);
        await sleep(waitMs, 0);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const waitMs = attempt * 2000;
      console.warn(`[Retry ${attempt}/${maxRetries}] Network error: ${lastError.message}, waiting ${waitMs}ms...`);
      await sleep(waitMs, 0);
    }
  }
  throw lastError || new Error("Max retries exceeded");
}

// ============================================================
// DETERMINISTIC HTML EXTRACTION (NO AI)
// ============================================================

function extractSlugFromUrl(url: string): string {
  const match = url.match(/\/new-projects\/([^\/\?#]+)/);
  return match?.[1]?.toLowerCase().replace(/\/$/, "") || "";
}

function extractImagesFromHtml(html: string, links: string[]): string[] {
  const imageSet = new Set<string>();

  // From links array
  for (const l of links) {
    if (l.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(l)) {
      imageSet.add(l);
    }
  }

  // From img tags
  const imgRx = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRx.exec(html)) !== null) {
    if (m[1]?.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(m[1])) {
      imageSet.add(m[1]);
    }
  }

  // From background-image
  const bgRx = /background-image:\s*url\(['"]?([^'")\s]+cloudfront\.net[^'")\s]+)['"]?\)/gi;
  while ((m = bgRx.exec(html)) !== null) {
    if (m[1]) imageSet.add(m[1]);
  }

  // Upgrade to high-res & filter
  return Array.from(imageSet)
    .filter((u) => !/(logo|icon|avatar|placeholder|spinner|favicon)/i.test(u))
    .map((u) => u.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"))
    .slice(0, 15);
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
  // Look for "About the project" section
  const aboutMatch = markdown.match(/About the project\s*\n+([^\n#]+(?:\n[^\n#]+)*)/i);
  if (aboutMatch?.[1]) {
    const desc = stripMarkdownLinks(aboutMatch[1]).replace(/\n+/g, " ").trim();
    if (desc.length > 50) return sanitizeText(desc);
  }

  // Fallback: first substantial paragraph after title
  const paragraphs = markdown.split(/\n\n+/);
  for (const p of paragraphs) {
    const cleaned = stripMarkdownLinks(p).replace(/\n/g, " ").trim();
    // Skip navigation, headers, short lines
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
  priceText: string | null;
  priceFrom: number | null;
  handover: string | null;
  paymentPlan: string | null;
  description: string | null;
  propertyType: string | null;
  statusLabel: string | null;
} {
  const cleanMd = stripMarkdownLinks(markdown);

  // Title: first H1
  const titleMatch = cleanMd.match(/^#\s+(.+)/m);
  let name = titleMatch?.[1]?.trim() || null;
  if (name) {
    name = name.replace(/\s+by\s+.*$/i, "").trim();
    name = sanitizeText(name);
  }

  // Developer: "[by Developer]" link pattern in original markdown
  const devLinkMatch = markdown.match(/\[by\s+([^\]]+)\]/i);
  let developerName = devLinkMatch?.[1]?.trim() || null;
  if (!developerName) {
    const devMatch = cleanMd.match(/by\s+([A-Z][A-Za-z\s&]+?)(?:\s*\n|\s*in\s)/i);
    developerName = devMatch?.[1]?.trim() || null;
  }

  // Location: "at [Location]" or "in [Location]"
  const locMatch = cleanMd.match(/(?:at|in)\s+([A-Z][A-Za-z\s,\-]+?)(?:\s*\||$|\n)/i);
  const location = locMatch?.[1]?.trim() || null;

  // Bedrooms
  const bedMatch = cleanMd.match(/((?:Studio|[\d,&\s\-]+)\s*(?:BR|Bedrooms?|Bedroom))/i);
  const bedrooms = bedMatch?.[1]?.trim() || null;

  // Price
  const priceMatch = cleanMd.match(/(EUR|AED|USD)\s*([\d,.]+)\s*(K|M)?/i);
  let priceText: string | null = null;
  let priceFrom: number | null = null;
  if (priceMatch) {
    priceText = priceMatch[0];
    let val = parseFloat(priceMatch[2].replace(/,/g, ""));
    if (priceMatch[3]?.toUpperCase() === "K") val *= 1000;
    if (priceMatch[3]?.toUpperCase() === "M") val *= 1000000;
    if (priceMatch[1].toUpperCase() === "EUR") val *= 4.0;
    if (priceMatch[1].toUpperCase() === "USD") val *= 3.67;
    priceFrom = Math.round(val);
  }

  // Handover
  const handoverMatch = cleanMd.match(/(?:Handover|Completion)[:\s]*(Q[1-4]?\s*\d{4}|\d{4}|Ready)/i);
  const handover = handoverMatch?.[1]?.trim() || null;

  // Payment plan
  const ppMatch = cleanMd.match(/(\d{2}\/\d{2})/);
  const paymentPlan = ppMatch?.[1] || null;

  // Description from "About the project"
  const description = extractDescriptionFromMarkdown(markdown);

  // Property type
  const typeMatch = cleanMd.match(/(Apartment|Villa|Townhouse|Penthouse|Sky[- ]?Villa|Studio)/i);
  const propertyType = typeMatch?.[1] || null;

  // Status label
  const statusMatch = cleanMd.match(/(Future Launch|New Phase|New Launch|Coming Soon|Sold Out)/i);
  const statusLabel = statusMatch?.[1] || null;

  return { name, developerName, location, bedrooms, priceText, priceFrom, handover, paymentPlan, description, propertyType, statusLabel };
}

function parseBedrooms(bedroomStr: string | null): { min: number | null; max: number | null } | null {
  if (!bedroomStr) return null;
  const matches = bedroomStr.match(/(\d+)/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map(m => parseInt(m));
  return { min: nums[0], max: nums.length > 1 ? nums[nums.length - 1] : nums[0] };
}

// ============================================================
// MAIN SERVE FUNCTION
// ============================================================

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
      page = 1,
      jobId = null,
      startIndex: rawStartIndex = 0,
      batchSize: rawBatchSize = 3,
      throttleMs: rawThrottleMs = 800,
      force = false,
      freshStart = false,
    } = await req.json().catch(() => ({}));

    const normalizedJobId = typeof jobId === "string" && jobId.length > 10 ? jobId : null;
    const startIndex = Math.max(0, Number(rawStartIndex) || 0);
    const batchSize = Math.max(1, Math.min(Number(rawBatchSize) || 3, 10));
    const throttleMs = Math.max(0, Math.min(Number(rawThrottleMs) ?? 800, 5000));

    console.log(`[Page ${page}] Starting STRICT URL MIRROR v5 (startIndex=${startIndex}, batchSize=${batchSize}, freshStart=${freshStart}, throttleMs=${throttleMs})...`);

    // Get developers for matching
    const { data: developers, error: devError } = await supabase.from("developers").select("id, name, slug");
    if (devError) {
      return new Response(JSON.stringify({ error: "Failed to fetch developers", details: devError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const devList = developers || [];
    const devMap = buildDeveloperMap(devList);
    console.log(`[Page ${page}] Loaded ${devList.length} developers for matching`);

    // Step 1: Get project URLs from listing page using scroll actions for dynamic content
    // The site uses JS-based pagination, so we need to scroll to load content
    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const listingUrl = `https://providentestate.com/new-projects/${pageSlug}`;

    console.log(`[Page ${page}] Step 1: Fetching project URLs from ${listingUrl} (with scroll)...`);

    // SIMPLIFIED REQUEST - DO NOT use scroll actions (causes SCRAPE_ALL_ENGINES_FAILED)
    // Firecrawl's actions feature triggers aggressive engines that get blocked by anti-bot measures
    const listRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({ 
        url: listingUrl, 
        formats: ["links", "markdown"], 
        waitFor: 8000,  // Reduced wait - less likely to trigger anti-bot
        timeout: 60000,
        onlyMainContent: false,
        // NO actions parameter - this prevents engine failures
      }),
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      let errJson: any = {};
      try { errJson = JSON.parse(errText); } catch {}
      
      // Handle specific Firecrawl error codes
      const errorCode = errJson.code || "UNKNOWN";
      if (errorCode === "SCRAPE_ALL_ENGINES_FAILED") {
        console.warn(`[Page ${page}] Firecrawl engines blocked for ${listingUrl} - website may be rate limiting`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Website temporarily blocking scraping. Please try again in a few minutes.",
          code: errorCode,
          page,
          retry_after_seconds: 120,
          duration_ms: Date.now() - startTime 
        }), {
          status: 503, // Service unavailable - indicates temporary issue
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: `Listing scrape failed: ${listRes.status}`, details: errText.substring(0, 200) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listData = await listRes.json();
    const linksRaw: string[] = listData.data?.links || [];

    // Normalize & filter to project detail URLs
    const listingUrlNormalized = listingUrl.replace(/\/$/, "");
    const projectUrls = [...new Set(
      linksRaw
        .map((l) => l.trim().replace(/\/$/, ""))
        .filter((l) => {
          if (!l.startsWith("https://providentestate.com/new-projects/")) return false;
          if (l.includes("/page/")) return false;
          if (l.includes("/developed-by-")) return false;
          if (/\/new-projects\/in-[a-z0-9\-]+$/i.test(l)) return false;
          if (l === "https://providentestate.com/new-projects") return false;
          if (l === listingUrlNormalized) return false;
          return true;
        })
    )];

    if (projectUrls.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No projects found on this page", page, duration_ms: Date.now() - startTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Page ${page}] Found ${projectUrls.length} project URLs`);

    // Step 2: Process batch
    const batchEnd = Math.min(projectUrls.length, startIndex + batchSize);
    const projectsToProcess = projectUrls.slice(startIndex, batchEnd);

    const stats = { processed: 0, queued: 0, updated: 0, skipped: 0, errors: 0, images: 0 };
    const errorsList: Array<{ url: string; error: string }> = [];

    for (const projectUrl of projectsToProcess) {
      try {
        console.log(`[Page ${page}] Scraping: ${projectUrl}`);

        // Add small delay between project scrapes to avoid rate limiting
        if (stats.processed > 0) {
          await sleep(throttleMs || 1500, 0.3);
        }

        // Scrape project detail page with retry - SIMPLIFIED to avoid engine failures
        const scrapeRes = await fetchWithRetry("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
          body: JSON.stringify({ 
            url: projectUrl, 
            formats: ["markdown", "links", "rawHtml"], 
            waitFor: 5000,  // Reduced wait time
            timeout: 45000, // Reduced timeout
            onlyMainContent: false,
            // NO actions - prevents SCRAPE_ALL_ENGINES_FAILED
          }),
        });

        if (!scrapeRes.ok) {
          const errText = await scrapeRes.text();
          let errJson: any = {};
          try { errJson = JSON.parse(errText); } catch {}
          
          const errorCode = errJson.code || "UNKNOWN";
          if (errorCode === "SCRAPE_ALL_ENGINES_FAILED") {
            console.warn(`[Page ${page}] Engines failed for ${projectUrl} - adding to retry queue`);
            stats.errors++;
            errorsList.push({ url: projectUrl, error: "Rate limited - retry later" });
            // Add longer delay before next request
            await sleep(3000, 0.5);
            continue;
          }
          
          console.error(`[Page ${page}] Scrape failed for ${projectUrl}: ${errText.substring(0, 100)}`);
          stats.errors++;
          errorsList.push({ url: projectUrl, error: `Scrape failed: ${scrapeRes.status}` });
          continue;
        }

        const scrapeData = await scrapeRes.json();
        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];
        const html = scrapeData.data?.rawHtml || "";

        if (markdown.length < 200 && html.length < 500) {
          console.warn(`[Page ${page}] Insufficient content for ${projectUrl}`);
          stats.errors++;
          errorsList.push({ url: projectUrl, error: "Insufficient content" });
          continue;
        }

        // === STRICT SLUG FROM URL ===
        const slug = extractSlugFromUrl(projectUrl);
        if (!slug) {
          console.warn(`[Page ${page}] Could not derive slug from ${projectUrl}`);
          stats.errors++;
          errorsList.push({ url: projectUrl, error: "Could not derive slug" });
          continue;
        }

        // === DETERMINISTIC EXTRACTION ===
        const extracted = extractTextFromMarkdown(markdown);
        const imageUrls = extractImagesFromHtml(html, links);
        const { brochure, paymentPlan: ppUrl, floorPlans } = extractPdfsFromHtml(html, markdown);

        // Match developer
        const dev = matchDeveloper(extracted.developerName, devMap);

        // Build name fallback
        const projectName = sanitizeText(extracted.name || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())) || slug;

        // Bedrooms
        const beds = parseBedrooms(extracted.bedrooms);

        // Images payload
        const imagesPayload = imageUrls.map((url, i) => ({ url, alt_text: `${projectName} - Image ${i + 1}`, display_order: i }));

        // Documents payload
        const documentsPayload: Array<{ url: string; type: string; name?: string }> = [];
        if (brochure) documentsPayload.push({ url: brochure, type: "brochure", name: `${projectName} Brochure.pdf` });
        if (ppUrl) documentsPayload.push({ url: ppUrl, type: "payment_plan", name: `${projectName} Payment Plan.pdf` });
        for (const fp of floorPlans) documentsPayload.push({ url: fp, type: "floor_plan", name: `${projectName} Floor Plan.pdf` });

        // Check if already in queue (any status) or projects
        const { data: existingQueue } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .eq("slug", slug)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existingProject && !force) {
          console.log(`[Page ${page}] Skipping ${projectName} - already exists in projects`);
          stats.skipped++;
          stats.processed++;
          continue;
        }

        // Build insert/update payload
        const payload: Omit<PendingImport, "is_new_project" | "status" | "review_notes"> & { job_id?: string | null } = {
          name: projectName,
          slug,
          developer_name: sanitizeText(extracted.developerName) || null,
          developer_id: dev?.id || null,
          location: sanitizeText(extracted.location) || null,
          emirate: "Dubai",
          description: extracted.description || null,
          price_from: extracted.priceFrom || null,
          bedrooms_min: beds?.min || null,
          bedrooms_max: beds?.max || null,
          handover_date: extracted.handover || null,
          payment_plan: extracted.paymentPlan || null,
          property_type_label: extracted.propertyType || null,
          status_label: extracted.statusLabel || null,
          images: imagesPayload,
          documents: documentsPayload,
          source_url: projectUrl,
        };
        if (normalizedJobId) payload.job_id = normalizedJobId;

        const hasMinimal = Boolean(extracted.description && extracted.developerName && imagesPayload.length >= 1);
        const hasDocs = documentsPayload.length > 0;
        const incomplete = !hasMinimal || !hasDocs;

        if (existingQueue?.id) {
          // If freshStart or force, always update and set back to pending
          // Otherwise only update if currently pending
          const shouldUpdate = force || freshStart || existingQueue.status === "pending" || existingQueue.status === "rejected";
          
          if (shouldUpdate) {
            const { error: updateErr } = await supabase
              .from("pending_project_imports")
              .update({ 
                ...payload, 
                is_new_project: false, 
                status: "pending",  // Always set to pending on update
                review_notes: incomplete ? "INCOMPLETE" : null, 
                updated_at: new Date().toISOString() 
              })
              .eq("id", existingQueue.id);
            if (updateErr) {
              console.error(`[Page ${page}] Update failed for ${projectName}:`, updateErr);
              stats.errors++;
              errorsList.push({ url: projectUrl, error: updateErr.message });
            } else {
              console.log(`[Page ${page}] ↻ Updated: ${projectName} (${imagesPayload.length} images, status→pending)`);
              stats.updated++;
              stats.images += imagesPayload.length;
            }
          } else {
            console.log(`[Page ${page}] Skipping ${projectName} - already queued (status: ${existingQueue.status})`);
            stats.skipped++;
          }
        } else {
          const { error: insertErr } = await supabase.from("pending_project_imports").insert({ ...payload, is_new_project: true, status: "pending", review_notes: incomplete ? "INCOMPLETE" : null });
          if (insertErr) {
            console.error(`[Page ${page}] Insert failed for ${projectName}:`, insertErr);
            stats.errors++;
            errorsList.push({ url: projectUrl, error: insertErr.message });
          } else {
            console.log(`[Page ${page}] ✓ Queued: ${projectName} (${imagesPayload.length} images)`);
            stats.queued++;
            stats.images += imagesPayload.length;
          }
        }

        stats.processed++;
        await sleep(throttleMs);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Page ${page}] Error processing ${projectUrl}:`, message);
        stats.errors++;
        errorsList.push({ url: projectUrl, error: message });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Page ${page}] Complete in ${duration}ms: ${stats.queued} queued, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors`);

    const nextStartIndex = startIndex + projectsToProcess.length;
    const remainingUrls = Math.max(0, projectUrls.length - nextStartIndex);

    return new Response(JSON.stringify({
      success: true,
      page,
      stats: { page, extracted: stats.processed, created: stats.queued, updated: stats.updated, skipped: stats.skipped, images: stats.images },
      debug: { ...stats, errors_list: errorsList.slice(0, 5) },
      total_urls: projectUrls.length,
      batch_start_index: startIndex,
      batch_size: batchSize,
      next_start_index: nextStartIndex,
      remaining_urls: remainingUrls,
      mode: "approval_queue",
      extraction_method: "strict-url-mirror-v5",
      duration_ms: duration,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error", duration_ms: Date.now() - startTime }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

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
      if (w.length > 3 && devMap.has(w)) { dev = devMap.get(w); break; }
    }
  }
  return dev;
}
