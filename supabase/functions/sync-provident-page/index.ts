import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * IMPROVED EXTRACTION v2:
 * 1. Scrape listing page to get project URLs
 * 2. Scrape EACH project detail page for accurate data
 * 3. Extract developer, location, price, bedrooms, handover from detail pages
 * 4. Deduplicate images properly (max 8 per project)
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
    return new Response(JSON.stringify({ error: "Missing API keys" }), {
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
    } = await req.json().catch(() => ({}));

    const startIndex = Math.max(0, Number(rawStartIndex) || 0);
    // Keep batches small by default to avoid timeouts; UI can loop until remaining_urls === 0.
    const batchSize = Math.max(1, Math.min(Number(rawBatchSize ?? (testMode ? 1 : 3)), 10));

    console.log(`[Page ${page}] Starting IMPROVED sync v2...`);
    
    // Get developers for matching
    const { data: developers } = await supabase.from("uae_developers").select("id, name, slug");
    const devList = developers || [];
    console.log(`[Page ${page}] Found ${devList.length} developers`);

    // Build developer lookup with multiple matching strategies
    const devMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const d of devList) {
      if (d.name) {
        devMap.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ""), d);
        const words = d.name.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length > 3) devMap.set(w, d);
        }
        // Add common variations
        if (d.name.toLowerCase().includes("sobha")) devMap.set("sobha", d);
        if (d.name.toLowerCase().includes("emaar")) devMap.set("emaar", d);
        if (d.name.toLowerCase().includes("damac")) devMap.set("damac", d);
        if (d.name.toLowerCase().includes("nakheel")) devMap.set("nakheel", d);
        if (d.name.toLowerCase().includes("meraas")) devMap.set("meraas", d);
        if (d.name.toLowerCase().includes("binghatti")) devMap.set("binghatti", d);
        if (d.name.toLowerCase().includes("azizi")) devMap.set("azizi", d);
        if (d.name.toLowerCase().includes("omniyat")) devMap.set("omniyat", d);
        if (d.name.toLowerCase().includes("ellington")) devMap.set("ellington", d);
        if (d.name.toLowerCase().includes("danube")) devMap.set("danube", d);
      }
    }

    // If testProject specified, scrape that specific project detail page
    if (testProject) {
      if (!lovableKey) {
        console.error("Missing API key: LOVABLE_API_KEY");
        return new Response(JSON.stringify({ error: "Missing API keys" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Test] Scraping single project: ${testProject}`);
      const projectData = await scrapeProjectDetailPage(testProject, firecrawlKey, lovableKey);
      
      if (projectData) {
        const dev = matchDeveloper(projectData.developer_name, devMap);
        return new Response(JSON.stringify({
          success: true,
          testMode: true,
          project: projectData,
          developer_matched: dev ? dev.name : null,
          duration_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to scrape project" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Get project URLs from listing page
    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const listingUrl = `https://providentestate.com/new-projects/${pageSlug}`;
    
    console.log(`[Page ${page}] Step 1: Getting project URLs from listing page...`);
    
    const listRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url: listingUrl, 
        formats: ["links"],
        waitFor: 8000,
        timeout: 60000,
      }),
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error(`[Page ${page}] Listing scrape failed:`, listRes.status);
      return new Response(JSON.stringify({ error: "Listing scrape failed", details: errText.substring(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listData = await listRes.json();
    const links = listData.data?.links || [];
    
    // Filter to get project detail page URLs
    const projectUrls = [...new Set(
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

    console.log(`[Page ${page}] Found ${projectUrls.length} project URLs`);
    
    if (projectUrls.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No projects found on this page", page }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Links-only mode: return URLs so the admin UI can show the full page list immediately.
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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!lovableKey) {
      console.error("Missing API key: LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "Missing API keys" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Scrape each project detail page in small batches.
    // The UI can call repeatedly with startIndex/batchSize until remaining_urls === 0.
    const batchEnd = Math.min(projectUrls.length, startIndex + batchSize);
    const projectsToProcess = projectUrls.slice(startIndex, batchEnd);
    
    console.log(`[Page ${page}] Step 2: Scraping ${projectsToProcess.length} project detail pages (startIndex=${startIndex}, batchSize=${batchSize})...`);
    
    const stats = {
      total: projectUrls.length,
      processed: 0,
      queued: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      images: 0,
    };
    
    const CONCURRENCY = testMode ? 1 : 2;

    const processOne = async (projectUrl: string) => {
      const result = {
        processed: 0,
        queued: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        images: 0,
      };

      try {
        console.log(`[Page ${page}] Scraping: ${projectUrl}`);

        const projectData = await scrapeProjectDetailPage(projectUrl, firecrawlKey, lovableKey);

        if (!projectData || !projectData.name) {
          console.log(`[Page ${page}] No data extracted for ${projectUrl}`);
          result.errors++;
          return result;
        }

        result.processed++;

        // Match developer
        const dev = matchDeveloper(projectData.developer_name, devMap);

        // Create slug
        const baseName = projectData.name.toLowerCase()
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

        if (existingProject) {
          console.log(`[Page ${page}] Skipping ${projectData.name} - already exists in projects`);
          result.skipped++;
          return result;
        }

        // Check if already exists in queue (any status)
        const { data: existingQueueAny } = await supabase
          .from("pending_project_imports")
          .select("id, status")
          .eq("slug", slug)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Prepare unique images (max 8)
        const uniqueImages = [...new Set(projectData.image_urls)]
          .filter(url =>
            url.includes("cloudfront.net") &&
            !url.toLowerCase().includes("logo") &&
            !url.toLowerCase().includes("icon") &&
            !url.toLowerCase().includes("banner") &&
            !url.toLowerCase().includes("brochure") &&
            !url.toLowerCase().includes("floor") &&
            !url.toLowerCase().includes("payment")
          )
          .slice(0, 8);

        const imagesPayload = uniqueImages.map((url, i) => ({
          url: url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"),
          alt_text: `${projectData.name} - Image ${i + 1}`,
          display_order: i,
        }));

        // Insert to approval queue
        const insertPayload: Record<string, any> = {
          name: projectData.name,
          slug,
          developer_name: projectData.developer_name || null,
          location: projectData.location || null,
          emirate: "Dubai",
          price_from: projectData.price_from,
          bedrooms_min: parseBedrooms(projectData.bedrooms)?.min || null,
          bedrooms_max: parseBedrooms(projectData.bedrooms)?.max || null,
          handover_date: projectData.handover_display || null,
          payment_plan: projectData.payment_plan || null,
          source_url: projectUrl,
          property_type_label: projectData.property_type_label || null,
          status_label: projectData.status_label || null,
          description: projectData.description?.substring(0, 1000) || null,
          amenities: projectData.amenities || null,
          images: imagesPayload,
          is_new_project: true,
          status: "pending",
        };

        if (dev?.id) {
          insertPayload.developer_id = dev.id;
        }

        // Insert/update approval queue
        if (existingQueueAny?.id) {
          if (force) {
            const { error: updateErr } = await supabase
              .from("pending_project_imports")
              .update({
                ...insertPayload,
                // Force should re-queue for review
                status: "pending",
                reviewed_at: null,
                reviewed_by: null,
                review_notes: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingQueueAny.id);

            if (updateErr) {
              console.error(`[Page ${page}] Update failed for ${projectData.name}:`, updateErr);
              result.errors++;
            } else {
              console.log(`[Page ${page}] ↻ Updated queued item: ${projectData.name} (${uniqueImages.length} images, ${projectData.location})`);
              result.updated++;
              result.images += uniqueImages.length;
            }
          } else {
            // If it's already pending, it should remain visible in the queue; otherwise require force to re-queue.
            console.log(`[Page ${page}] Skipping ${projectData.name} - already queued (status=${existingQueueAny.status})`);
            result.skipped++;
          }
        } else {
          const { error: queueErr } = await supabase
            .from("pending_project_imports")
            .insert(insertPayload);

          if (queueErr) {
            console.error(`[Page ${page}] Insert failed for ${projectData.name}:`, queueErr);
            result.errors++;
          } else {
            console.log(`[Page ${page}] ✓ Queued: ${projectData.name} (${uniqueImages.length} images, ${projectData.location})`);
            result.queued++;
            result.images += uniqueImages.length;
          }
        }
      } catch (projErr) {
        console.error(`[Page ${page}] Error processing ${projectUrl}:`, projErr);
        result.errors++;
      }

      return result;
    };

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
      }

      // Light throttle between concurrency batches
      if (i + CONCURRENCY < projectsToProcess.length) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Page ${page}] Complete in ${duration}ms: ${stats.queued} queued, ${stats.skipped} skipped, ${stats.errors} errors`);

    const nextStartIndex = startIndex + projectsToProcess.length;
    const remainingUrls = Math.max(0, projectUrls.length - nextStartIndex);

    // Provide BOTH: UI-friendly stats + debug stats
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
      debug: stats,
      total_urls: projectUrls.length,
      batch_start_index: startIndex,
      batch_size: batchSize,
      next_start_index: nextStartIndex,
      remaining_urls: remainingUrls,
      mode: "approval_queue",
      extraction_method: "detail-page-scraping-v2",
      duration_ms: duration 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Scrape a single project detail page to extract accurate data
 */
async function scrapeProjectDetailPage(
  url: string, 
  firecrawlKey: string, 
  lovableKey: string
): Promise<ProjectData | null> {
  try {
    // Scrape the project detail page
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url, 
        formats: ["markdown", "links"],
        waitFor: 5000,
        timeout: 30000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeRes.ok) {
      console.error(`Scrape failed for ${url}:`, scrapeRes.status);
      return null;
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    if (markdown.length < 200) {
      console.log(`Insufficient content for ${url}`);
      return null;
    }

    // Extract images from links
    const imageUrls = links.filter((l: string) => 
      l.includes("cloudfront.net") && 
      /\.(jpg|jpeg|png|webp)/i.test(l)
    );

    // Use AI to extract structured data from the detail page
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
            content: "You extract real estate project details from Provident Estate pages. Return ONLY valid JSON, no markdown." 
          },
          {
            role: "user",
            content: `Extract project details from this Provident Estate project page:

${markdown.substring(0, 25000)}

IMAGES FOUND:
${imageUrls.slice(0, 20).join("\n")}

Return a JSON object with these exact fields:
{
  "name": "EXACT project title from page (e.g., Maybach, Vista Ridge)",
  "developer_name": "Developer name from 'by [Developer]' text",
  "location": "Specific area (e.g., Meydan, Dubai Harbour, not just Dubai)",
  "bedrooms": "Bedroom config like Studio, 1, 2 and 3-bedroom apartments OR 4-6 BR",
  "price_from": 1500000,
  "price_text": "EXACT original price text like EUR 295K or AED 3.18M",
  "payment_plan": "Payment plan like 70/30 or 60/40 or null if not shown",
  "handover_display": "Year or quarter like 2028 or Q2 2029",
  "property_type_label": "Apartment, Studio|Villa|Townhouse|Penthouse|Sky-Villa (from bedrooms description)",
  "status_label": "Future Launch|New Phase|New Launch|Coming Soon|Sold Out or null (look for badge text)",
  "description": "First 2-3 sentences of About the project section",
  "amenities": ["array of amenities from Amenities section"],
  "image_urls": ["array of 3-8 UNIQUE gallery images from cloudfront, no floor plans/brochures"]
}

CRITICAL EXTRACTION RULES:
1. name: Use the EXACT title from the page (e.g., "Maybach" not "Maybach Mercedes-Benz Places")
2. developer_name: Look for "by [Developer Name]" near the title
3. location: Extract specific area (Meydan, Palm Jumeirah, etc.), NOT just "Dubai"
4. price_from: Convert to AED number (EUR * 4.0, K = 1000, M = 1000000)
5. price_text: Keep the EXACT original text shown on page (e.g., "EUR 295K")
6. payment_plan: Look for "Payment Plan" section, extract exactly like "70/30"
7. property_type_label: Derive from bedrooms text (e.g., "studio, 1, 2 and 3-bedroom apartments" -> "Apartment, Studio")
8. status_label: Look for badges like "Future Launch", "New Phase", "Coming Soon" 
9. image_urls: Only include 3-8 UNIQUE cloudfront images from Gallery section, NO floor plans or brochure images`
          }
        ],
        temperature: 0.1,
        max_tokens: 2500,
      }),
    });

    if (!aiRes.ok) {
      console.error(`AI extraction failed for ${url}`);
      return null;
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response with robust error handling
    let jsonStr = content;
    
    // Strip markdown code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Extract JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error(`No JSON in AI response for ${url}. Raw content: ${content.substring(0, 200)}`);
      return null;
    }

    // Clean the JSON string to handle common issues
    let cleanedJson = jsonMatch[0]
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([\]}])/g, '$1')
      // Remove any control characters
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // Fix unescaped newlines in strings (common AI issue)
      .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')
      // Remove any BOM or zero-width characters
      .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '');

    let data;
    try {
      data = JSON.parse(cleanedJson);
    } catch (parseErr) {
      // Try more aggressive cleanup
      try {
        // Remove everything after the last valid closing brace
        const lastBrace = cleanedJson.lastIndexOf('}');
        if (lastBrace > 0) {
          cleanedJson = cleanedJson.substring(0, lastBrace + 1);
        }
        data = JSON.parse(cleanedJson);
      } catch (retryErr) {
        console.error(`JSON parse failed for ${url}. Error: ${parseErr}. Raw: ${jsonMatch[0].substring(0, 300)}`);
        return null;
      }
    }
    
    return {
      name: data.name || "",
      developer_name: data.developer_name || null,
      location: data.location || null,
      url,
      image_urls: Array.isArray(data.image_urls) ? data.image_urls : [],
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
    
  } catch (err) {
    console.error(`Error scraping ${url}:`, err);
    return null;
  }
}

/**
 * Match developer name to our database
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
