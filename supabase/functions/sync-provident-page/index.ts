import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * ENHANCED EXTRACTION v3 - Enterprise Grade
 * 1. Robust retry logic with exponential backoff
 * 2. Validation layer for data quality
 * 3. Automatic recovery from failures
 * 4. Enhanced rate limiting protection
 * 5. Detailed logging for debugging
 */

interface ProjectData {
  name: string;
  developer_name: string | null;
  location: string | null;
  url: string;
  image_urls: string[];
  bedrooms: string | null;
  price_from: number | null;
  price_text: string | null;
  payment_plan: string | null;
  handover_display: string | null;
  property_type_label: string | null;
  status_label: string | null;
  description: string | null;
  amenities: string[] | null;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// Validation rules
const VALIDATION_RULES = {
  minNameLength: 3,
  minDescriptionLength: 20,
  validImagePattern: /cloudfront\.net.*\.(jpg|jpeg|png|webp)/i,
  excludeImagePatterns: [/logo/i, /icon/i, /banner/i, /brochure/i, /floor/i, /payment/i],
};

/**
 * Sleep with jitter for rate limiting
 */
async function sleep(ms: number, jitter = 0.2): Promise<void> {
  const jitterMs = ms * jitter * Math.random();
  return new Promise(r => setTimeout(r, ms + jitterMs));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries = RETRY_CONFIG.maxRetries
): Promise<T | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      console.warn(`[${context}] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms...`);
      
      if (attempt < maxRetries) {
        await sleep(delay);
      }
    }
  }
  
  console.error(`[${context}] All ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
  return null;
}

/**
 * Validate extracted project data
 */
function validateProjectData(data: ProjectData): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Required fields
  if (!data.name || data.name.length < VALIDATION_RULES.minNameLength) {
    issues.push("Invalid or missing name");
  }
  
  // Validate images
  const validImages = (data.image_urls || []).filter(url => {
    if (!VALIDATION_RULES.validImagePattern.test(url)) return false;
    return !VALIDATION_RULES.excludeImagePatterns.some(p => p.test(url));
  });
  
  if (validImages.length === 0) {
    issues.push("No valid images found");
  }
  
  // Validate price if present
  if (data.price_from !== null && (data.price_from < 100000 || data.price_from > 500000000)) {
    issues.push(`Suspicious price value: ${data.price_from}`);
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Sanitize and clean extracted data
 */
function sanitizeProjectData(data: ProjectData): ProjectData {
  // Clean name - remove excess whitespace
  const cleanName = data.name?.trim().replace(/\s+/g, ' ') || '';
  
  // Clean description
  const cleanDescription = data.description?.trim().replace(/\s+/g, ' ').substring(0, 1000) || null;
  
  // Filter and deduplicate images
  const uniqueImages = [...new Set(data.image_urls)]
    .filter(url => {
      if (!VALIDATION_RULES.validImagePattern.test(url)) return false;
      return !VALIDATION_RULES.excludeImagePatterns.some(p => p.test(url));
    })
    .map(url => url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"))
    .slice(0, 8);
  
  // Clean location
  const cleanLocation = data.location?.trim() || null;
  
  return {
    ...data,
    name: cleanName,
    description: cleanDescription,
    image_urls: uniqueImages,
    location: cleanLocation,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey) {
    console.error("Missing API key: FIRECRAWL_API_KEY");
    return new Response(JSON.stringify({ error: "Missing API keys", code: "MISSING_FIRECRAWL_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const {
      page = 1,
      testMode = false,
      force = false,
      testProject = null,
      linksOnly = false,
      startIndex: rawStartIndex = 0,
      batchSize: rawBatchSize = undefined,
      validateOnly = false,
    } = await req.json().catch(() => ({}));

    const startIndex = Math.max(0, Number(rawStartIndex) || 0);
    const batchSize = Math.max(1, Math.min(Number(rawBatchSize ?? (testMode ? 1 : 3)), 10));

    console.log(`[Page ${page}] Starting ENHANCED sync v3 (startIndex=${startIndex}, batchSize=${batchSize})...`);
    
    // Get developers for matching with caching
    const { data: developers, error: devError } = await supabase.from("uae_developers").select("id, name, slug");
    
    if (devError) {
      console.error("Failed to fetch developers:", devError);
      return new Response(JSON.stringify({ error: "Failed to fetch developers", details: devError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const devList = developers || [];
    console.log(`[Page ${page}] Loaded ${devList.length} developers for matching`);

    // Build enhanced developer lookup
    const devMap = buildDeveloperMap(devList);

    // Single project test mode
    if (testProject) {
      if (!lovableKey) {
        return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY for AI extraction" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Test] Scraping single project with retry: ${testProject}`);
      
      const projectData = await withRetry(
        () => scrapeProjectDetailPage(testProject, firecrawlKey, lovableKey),
        `Test:${testProject}`
      );
      
      if (projectData) {
        const sanitized = sanitizeProjectData(projectData);
        const validation = validateProjectData(sanitized);
        const dev = matchDeveloper(sanitized.developer_name, devMap);
        
        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          project: sanitized,
          developer_matched: dev ? dev.name : null,
          validation,
          duration_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: "Failed to scrape project after retries",
        url: testProject,
        duration_ms: Date.now() - startTime
      }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Get project URLs from listing page with retry
    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const listingUrl = `https://providentestate.com/new-projects/${pageSlug}`;
    
    console.log(`[Page ${page}] Step 1: Getting project URLs from ${listingUrl}...`);
    
    const projectUrls = await withRetry(async () => {
      const listRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({ 
          url: listingUrl, 
          formats: ["links"],
          waitFor: 10000,
          timeout: 90000,
        }),
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        throw new Error(`Listing scrape failed: ${listRes.status} - ${errText.substring(0, 200)}`);
      }

      const listData = await listRes.json();
      const links = listData.data?.links || [];
      
      // Filter to get project detail page URLs
      const urls = [...new Set(
        links
          .filter((l: string) => 
            l.includes("/new-projects/") && 
            !l.includes("page/") &&
            !l.includes("developed-by-") &&
            l !== "https://providentestate.com/new-projects/" &&
            l !== listingUrl
          )
          .map((l: string) => l.replace(/\/$/, ""))
      )] as string[];
      
      if (urls.length === 0) {
        throw new Error("No project URLs found on page");
      }
      
      return urls;
    }, `Page${page}:ListingFetch`);

    if (!projectUrls || projectUrls.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No projects found on this page (may be end of listings)", 
        page,
        duration_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Page ${page}] Found ${projectUrls.length} project URLs`);

    // Links-only mode
    if (linksOnly) {
      return new Response(
        JSON.stringify({
          success: true,
          page,
          listing_url: listingUrl,
          total_urls: projectUrls.length,
          project_urls: projectUrls,
          duration_ms: Date.now() - startTime,
          mode: "links_only",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY for AI extraction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Process projects in batches with enhanced error handling
    const batchEnd = Math.min(projectUrls.length, startIndex + batchSize);
    const projectsToProcess = projectUrls.slice(startIndex, batchEnd);
    
    console.log(`[Page ${page}] Step 2: Processing ${projectsToProcess.length} projects (${startIndex} to ${batchEnd - 1})...`);
    
    const stats = {
      total: projectUrls.length,
      processed: 0,
      queued: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      images: 0,
      validation_failures: 0,
      retry_successes: 0,
    };

    const errors: Array<{ url: string; error: string }> = [];
    const CONCURRENCY = testMode ? 1 : 2;

    const processOne = async (projectUrl: string) => {
      const result = {
        processed: 0,
        queued: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        images: 0,
        validation_failures: 0,
        retry_successes: 0,
        errorDetail: null as { url: string; error: string } | null,
      };

      try {
        console.log(`[Page ${page}] Scraping: ${projectUrl}`);

        // Scrape with retry
        const projectData = await withRetry(
          () => scrapeProjectDetailPage(projectUrl, firecrawlKey, lovableKey),
          `Page${page}:Project`
        );

        if (!projectData || !projectData.name) {
          console.log(`[Page ${page}] No data extracted for ${projectUrl}`);
          result.errors++;
          result.errorDetail = { url: projectUrl, error: "No data extracted" };
          return result;
        }

        // Sanitize and validate
        const sanitized = sanitizeProjectData(projectData);
        const validation = validateProjectData(sanitized);
        
        if (!validation.valid) {
          console.warn(`[Page ${page}] Validation issues for ${projectUrl}: ${validation.issues.join(', ')}`);
          result.validation_failures++;
          // Continue anyway - log but don't skip
        }

        result.processed++;

        // Match developer
        const dev = matchDeveloper(sanitized.developer_name, devMap);

        // Create slug
        const baseName = sanitized.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50);
        const slug = dev ? `${baseName}-${dev.slug}`.substring(0, 80) : baseName;

        // Check if already exists in projects
        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existingProject && !force) {
          console.log(`[Page ${page}] Skipping ${sanitized.name} - already exists in projects`);
          result.skipped++;
          return result;
        }

        // Check if already exists in queue
        const { data: existingQueueAny } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .eq("slug", slug)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Prepare images payload
        const imagesPayload = sanitized.image_urls.map((url, i) => ({
          url,
          alt_text: `${sanitized.name} - Image ${i + 1}`,
          display_order: i,
        }));

        // Insert to approval queue
        const insertPayload: Record<string, unknown> = {
          name: sanitized.name,
          slug,
          developer_name: sanitized.developer_name || null,
          location: sanitized.location || null,
          emirate: "Dubai",
          price_from: sanitized.price_from,
          bedrooms_min: parseBedrooms(sanitized.bedrooms)?.min || null,
          bedrooms_max: parseBedrooms(sanitized.bedrooms)?.max || null,
          handover_date: sanitized.handover_display || null,
          payment_plan: sanitized.payment_plan || null,
          source_url: projectUrl,
          property_type_label: sanitized.property_type_label || null,
          status_label: sanitized.status_label || null,
          description: sanitized.description || null,
          amenities: sanitized.amenities || null,
          images: imagesPayload,
          is_new_project: !existingQueueAny,
          status: "pending",
        };

        if (dev?.id) {
          insertPayload.developer_id = dev.id;
        }

        // Insert or update queue
        if (existingQueueAny?.id) {
          if (force || existingQueueAny.status === "pending") {
            const { error: updateErr } = await supabase
              .from("pending_project_imports")
              .update({
                ...insertPayload,
                status: "pending",
                reviewed_at: null,
                reviewed_by: null,
                review_notes: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingQueueAny.id);

            if (updateErr) {
              console.error(`[Page ${page}] Update failed for ${sanitized.name}:`, updateErr);
              result.errors++;
              result.errorDetail = { url: projectUrl, error: updateErr.message };
            } else {
              console.log(`[Page ${page}] ↻ Updated: ${sanitized.name} (${sanitized.image_urls.length} images)`);
              result.updated++;
              result.images += sanitized.image_urls.length;
            }
          } else {
            console.log(`[Page ${page}] Skipping ${sanitized.name} - already queued (status=${existingQueueAny.status})`);
            result.skipped++;
          }
        } else {
          const { error: queueErr } = await supabase
            .from("pending_project_imports")
            .insert(insertPayload);

          if (queueErr) {
            console.error(`[Page ${page}] Insert failed for ${sanitized.name}:`, queueErr);
            result.errors++;
            result.errorDetail = { url: projectUrl, error: queueErr.message };
          } else {
            console.log(`[Page ${page}] ✓ Queued: ${sanitized.name} (${sanitized.image_urls.length} images, ${sanitized.location})`);
            result.queued++;
            result.images += sanitized.image_urls.length;
          }
        }
      } catch (projErr) {
        console.error(`[Page ${page}] Error processing ${projectUrl}:`, projErr);
        result.errors++;
        result.errorDetail = { 
          url: projectUrl, 
          error: projErr instanceof Error ? projErr.message : "Unknown error" 
        };
      }

      return result;
    };

    // Process with concurrency control
    for (let i = 0; i < projectsToProcess.length; i += CONCURRENCY) {
      const chunk = projectsToProcess.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map(processOne));

      for (const r of results) {
        stats.processed += r.processed;
        stats.queued += r.queued;
        stats.updated += r.updated;
        stats.skipped += r.skipped;
        stats.errors += r.errors;
        stats.images += r.images;
        stats.validation_failures += r.validation_failures;
        stats.retry_successes += r.retry_successes;
        
        if (r.errorDetail) {
          errors.push(r.errorDetail);
        }
      }

      // Rate limiting between batches
      if (i + CONCURRENCY < projectsToProcess.length) {
        await sleep(800);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Page ${page}] Complete in ${duration}ms: ${stats.queued} queued, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.errors} errors`);

    const nextStartIndex = startIndex + projectsToProcess.length;
    const remainingUrls = Math.max(0, projectUrls.length - nextStartIndex);

    // UI-friendly response
    const uiStats = {
      page,
      extracted: stats.processed,
      created: stats.queued,
      updated: stats.updated,
      skipped: stats.skipped,
      images: stats.images,
    };

    return new Response(JSON.stringify({ 
      success: true, 
      page,
      stats: uiStats,
      debug: {
        ...stats,
        errors_list: errors.slice(0, 5), // Only first 5 errors
      },
      total_urls: projectUrls.length,
      batch_start_index: startIndex,
      batch_size: batchSize,
      next_start_index: nextStartIndex,
      remaining_urls: remainingUrls,
      mode: "approval_queue",
      extraction_method: "enterprise-v3",
      duration_ms: duration 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration_ms: Date.now() - startTime,
    }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Build enhanced developer lookup map
 */
function buildDeveloperMap(devList: Array<{ id: string; name: string; slug: string }>) {
  const devMap = new Map<string, { id: string; name: string; slug: string }>();
  
  for (const d of devList) {
    if (!d.name) continue;
    
    // Normalized full name
    devMap.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ""), d);
    
    // Individual words
    const words = d.name.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 3) devMap.set(w, d);
    }
    
    // Common developer variations
    const nameLower = d.name.toLowerCase();
    const knownDevelopers = [
      "sobha", "emaar", "damac", "nakheel", "meraas", "binghatti", 
      "azizi", "omniyat", "ellington", "danube", "select", "deyaar",
      "mag", "aldar", "reportage", "samana", "imtiaz", "object one"
    ];
    
    for (const known of knownDevelopers) {
      if (nameLower.includes(known)) {
        devMap.set(known, d);
      }
    }
  }
  
  return devMap;
}

/**
 * Scrape a single project detail page with enhanced extraction
 */
async function scrapeProjectDetailPage(
  url: string, 
  firecrawlKey: string, 
  lovableKey: string
): Promise<ProjectData | null> {
  const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({ 
      url, 
      formats: ["markdown", "links"],
      waitFor: 6000,
      timeout: 45000,
      onlyMainContent: false,
    }),
  });

  if (!scrapeRes.ok) {
    const errText = await scrapeRes.text();
    throw new Error(`Scrape failed: ${scrapeRes.status} - ${errText.substring(0, 100)}`);
  }

  const scrapeData = await scrapeRes.json();
  const markdown = scrapeData.data?.markdown || "";
  const links = scrapeData.data?.links || [];

  if (markdown.length < 200) {
    throw new Error(`Insufficient content: ${markdown.length} chars`);
  }

  // Extract images from links
  const imageUrls = links.filter((l: string) => 
    l.includes("cloudfront.net") && 
    /\.(jpg|jpeg|png|webp)/i.test(l)
  );

  // AI extraction with detailed prompt
  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lovableKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { 
          role: "system", 
          content: "You are an expert real estate data extractor. Extract EXACT data from Provident Estate pages. Return ONLY valid JSON, no markdown formatting." 
        },
        {
          role: "user",
          content: `Extract ALL project details from this Provident Estate project page. Mirror the EXACT information shown.

PAGE CONTENT:
${markdown.substring(0, 28000)}

IMAGES FOUND:
${imageUrls.slice(0, 25).join("\n")}

Return a JSON object with these EXACT fields:
{
  "name": "EXACT project title (e.g., Maybach, Vista Ridge, The Opus)",
  "developer_name": "EXACT developer name from 'by [Developer]' or 'Developed by' text",
  "location": "EXACT specific area (e.g., Business Bay, Dubai Marina, Meydan) - NOT just Dubai",
  "bedrooms": "EXACT bedroom configuration as shown (e.g., Studio, 1, 2 & 3 BR or 4-6 Bedrooms)",
  "price_from": 1500000,
  "price_text": "EXACT original price text as displayed (e.g., EUR 295K or AED 3.18M)",
  "payment_plan": "EXACT payment plan text (e.g., 70/30, 60/40, 20/80)",
  "handover_display": "EXACT handover text (e.g., 2028, Q2 2029, Ready)",
  "property_type_label": "Property type(s) from bedrooms/units section (Apartment|Villa|Townhouse|Penthouse|Sky-Villa|Studio)",
  "status_label": "EXACT status badge text if shown (Future Launch|New Phase|New Launch|Coming Soon|Sold Out) or null",
  "description": "First 2-3 sentences from 'About the project' section - EXACT text",
  "amenities": ["array of amenities listed in Amenities section"],
  "image_urls": ["3-8 UNIQUE gallery cloudfront image URLs - NO floor plans, NO brochures, NO logos"]
}

CRITICAL RULES - MIRROR EXACTLY:
1. Copy ALL text fields EXACTLY as shown on the page
2. Do NOT modify, summarize, or rephrase any content
3. price_from: Convert to AED number (EUR×4.0, K=1000, M=1000000)
4. image_urls: Only include unique cloudfront gallery images, exclude floor plans/brochures/logos
5. Return valid JSON only - no markdown code blocks`
        }
      ],
      temperature: 0.05, // Very low for accuracy
      max_tokens: 3000,
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    throw new Error(`AI extraction failed: ${aiRes.status} - ${errText.substring(0, 100)}`);
  }

  const aiData = await aiRes.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  
  // Robust JSON parsing
  let jsonStr = content;
  
  // Strip markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }
  
  // Extract JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error(`No JSON found in AI response`);
  }

  // Clean and parse JSON
  let cleanedJson = jsonMatch[0]
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '');

  let data;
  try {
    data = JSON.parse(cleanedJson);
  } catch (parseErr) {
    // Try more aggressive cleanup
    const lastBrace = cleanedJson.lastIndexOf('}');
    if (lastBrace > 0) {
      cleanedJson = cleanedJson.substring(0, lastBrace + 1);
    }
    data = JSON.parse(cleanedJson);
  }
  
  return {
    name: data.name || "",
    developer_name: data.developer_name || null,
    location: data.location || null,
    url,
    image_urls: Array.isArray(data.image_urls) ? data.image_urls : imageUrls.slice(0, 8),
    bedrooms: data.bedrooms || null,
    price_from: data.price_from ? Math.round(data.price_from) : null,
    price_text: data.price_text || null,
    payment_plan: data.payment_plan || null,
    handover_display: data.handover_display || null,
    property_type_label: data.property_type_label || null,
    status_label: data.status_label || null,
    description: data.description || null,
    amenities: Array.isArray(data.amenities) ? data.amenities : null,
  };
}

/**
 * Match developer name to database
 */
function matchDeveloper(
  developerName: string | null, 
  devMap: Map<string, { id: string; name: string; slug: string }>
): { id: string; name: string; slug: string } | undefined {
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

/**
 * Parse bedroom string to min/max
 */
function parseBedrooms(bedroomStr: string | null): { min: number | null; max: number | null } | null {
  if (!bedroomStr) return null;
  
  const matches = bedroomStr.match(/(\d+)/g);
  if (!matches || matches.length === 0) return null;
  
  const nums = matches.map(m => parseInt(m));
  return {
    min: nums[0],
    max: nums.length > 1 ? nums[nums.length - 1] : nums[0]
  };
}
