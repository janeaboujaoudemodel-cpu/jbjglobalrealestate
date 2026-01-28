import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * APPROVAL QUEUE MODE:
 * This function NO LONGER inserts directly into `projects` table.
 * All extracted projects go to `pending_project_imports` with status='pending'.
 * An admin must review and approve each project via the Listing Admin panel.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey || !lovableKey) {
    console.error("Missing API keys - FIRECRAWL:", !!firecrawlKey, "LOVABLE:", !!lovableKey);
    return new Response(JSON.stringify({ error: "Missing API keys", firecrawl: !!firecrawlKey, lovable: !!lovableKey }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { page = 1 } = await req.json().catch(() => ({}));
    console.log(`[Page ${page}] Starting sync (APPROVAL QUEUE MODE)...`);
    
    // Get developers for matching from uae_developers table
    const { data: developers, error: devError } = await supabase.from("uae_developers").select("id, name, slug");
    
    if (devError) {
      console.error("Developer fetch error:", devError);
    }
    
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
      }
    }

    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const url = `https://providentestate.com/new-projects/${pageSlug}`;

    console.log(`[Page ${page}] Scraping: ${url}`);

    // Scrape with Firecrawl
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url, 
        formats: ["markdown", "links", "rawHtml"],
        waitFor: 15000,
        timeout: 90000,
        onlyMainContent: false,
        actions: [
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down", amount: 2000 },
          { type: "wait", milliseconds: 2000 },
        ]
      }),
    });

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error(`[Page ${page}] Scrape failed:`, scrapeRes.status, errText.substring(0, 200));
      return new Response(JSON.stringify({ error: "Scrape failed", status: scrapeRes.status, details: errText.substring(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const html = scrapeData.data?.rawHtml || "";

    console.log(`[Page ${page}] Scraped: ${markdown.length} chars markdown, ${links.length} links, ${html.length} chars HTML`);

    // If content is too short, try Gatsby page-data
    if (markdown.length < 500) {
      console.log(`[Page ${page}] Trying Gatsby page-data fallback...`);
      
      try {
        const pageDataUrl = page === 1 
          ? "https://providentestate.com/page-data/new-projects/page-data.json"
          : `https://providentestate.com/page-data/new-projects/page/${page}/page-data.json`;
        
        const pageDataRes = await fetch(pageDataUrl);
        if (pageDataRes.ok) {
          const pageData = await pageDataRes.json();
          const projects = pageData?.result?.data?.allWpProject?.nodes || [];
          
          if (projects.length > 0) {
            console.log(`[Page ${page}] Got ${projects.length} projects from page-data.json`);
            
            const stats = { extracted: projects.length, queued: 0, skipped: 0 };
            
            for (const p of projects) {
              const projectName = p.title || p.projectDetails?.projectName;
              const developerName = p.projectDetails?.developer?.title || p.projectDetails?.developerName;
              
              if (!projectName) {
                stats.skipped++;
                continue;
              }

              // Match developer
              let dev: { id: string; name: string; slug: string } | undefined;
              if (developerName) {
                const norm = developerName.toLowerCase().replace(/[^a-z0-9]/g, "");
                dev = devMap.get(norm);
                
                if (!dev) {
                  for (const w of developerName.toLowerCase().split(/\s+/)) {
                    if (w.length > 3 && devMap.has(w)) { 
                      dev = devMap.get(w); 
                      break; 
                    }
                  }
                }
              }

              // Create slug
              const baseName = projectName.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .substring(0, 50);
              const slug = dev ? `${baseName}-${dev.slug}`.substring(0, 80) : baseName;
              
              // Get price and other details
              const priceText = p.projectDetails?.price || p.projectDetails?.priceFrom;
              let priceAed: number | null = null;
              if (priceText) {
                const priceMatch = priceText.match(/[\d,\.]+/);
                if (priceMatch) {
                  let val = parseFloat(priceMatch[0].replace(/,/g, ""));
                  if (priceText.toLowerCase().includes("eur")) {
                    val = Math.round(val * 4.0);
                  }
                  if (priceText.toLowerCase().includes("k")) val *= 1000;
                  if (priceText.toLowerCase().includes("m")) val *= 1000000;
                  priceAed = Math.round(val);
                }
              }
              
              const handover = p.projectDetails?.handover || p.projectDetails?.completionDate;
              const location = p.projectDetails?.location || p.projectDetails?.area;
              
              // Get images
              const images: string[] = [];
              if (p.featuredImage?.node?.sourceUrl) {
                images.push(p.featuredImage.node.sourceUrl);
              }
              if (p.projectDetails?.galleryImages) {
                for (const img of p.projectDetails.galleryImages) {
                  if (img?.sourceUrl) images.push(img.sourceUrl);
                }
              }
              
              // Check if already in queue or exists in projects
              const { data: existingQueue } = await supabase
                .from("pending_project_imports")
                .select("id")
                .eq("slug", slug)
                .eq("status", "pending")
                .maybeSingle();

              const { data: existingProject } = await supabase
                .from("projects")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();

              if (existingQueue || existingProject) {
                console.log(`[Page ${page}] Skipping ${projectName} - already exists`);
                stats.skipped++;
                continue;
              }

              // INSERT TO APPROVAL QUEUE - NOT PROJECTS TABLE
              try {
                // Build insert payload - exclude developer_id if null to avoid FK constraint
                const insertPayload: Record<string, any> = {
                  name: projectName,
                  slug,
                  developer_name: developerName || null,
                  location,
                  emirate: "Dubai",
                  price_from: priceAed,
                  handover_date: handover,
                  source_url: `https://providentestate.com/new-projects/${p.slug}/`,
                  images: JSON.stringify(images.slice(0, 20).map((url, i) => ({
                    url: url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"),
                    alt_text: `${projectName} - Image ${i + 1}`,
                    display_order: i
                  }))),
                  is_new_project: true,
                  status: "pending",
                };
                
                // Only include developer_id if we have a valid match
                if (dev?.id) {
                  insertPayload.developer_id = dev.id;
                }

                const { error: queueErr } = await supabase
                  .from("pending_project_imports")
                  .insert(insertPayload);

                if (queueErr) {
                  console.error(`[Page ${page}] Queue insert failed for ${projectName}:`, queueErr);
                  stats.skipped++;
                } else {
                  stats.queued++;
                }
              } catch (dbErr) {
                console.error(`[Page ${page}] DB error for ${projectName}:`, dbErr);
                stats.skipped++;
              }
            }

            const duration = Date.now() - startTime;
            console.log(`[Page ${page}] Complete via page-data in ${duration}ms: ${stats.queued} queued for review`);

            return new Response(JSON.stringify({ 
              success: true, 
              page, 
              stats,
              mode: "approval_queue",
              extraction_method: "gatsby-page-data",
              duration_ms: duration 
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (pdErr) {
        console.error(`[Page ${page}] page-data fallback failed:`, pdErr);
      }
    }

    if (markdown.length < 300) {
      console.warn(`[Page ${page}] Insufficient content`);
      return new Response(JSON.stringify({ success: true, message: "No content or last page", page }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract image URLs from HTML using regex
    const imagePattern = /https:\/\/[a-z0-9]+\.cloudfront\.net\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi;
    const wpImagePattern = /https?:\/\/[^\s"'<>]+wp-content[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi;
    const allImageUrls = [...new Set([
      ...(markdown.match(imagePattern) || []),
      ...(html.match(imagePattern) || []),
      ...(markdown.match(wpImagePattern) || []),
      ...(html.match(wpImagePattern) || []),
      ...links.filter((l: string) => /\.(jpg|jpeg|png|webp)/i.test(l))
    ])].filter(url => !url.includes("logo") && !url.includes("icon"));

    console.log(`[Page ${page}] Found ${allImageUrls.length} total images`);

    // AI extraction
    console.log(`[Page ${page}] Starting AI extraction...`);
    
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
            content: "You are a real estate data extractor. Extract ALL projects visible on the page. Return ONLY a valid JSON array, no markdown formatting." 
          },
          {
            role: "user",
            content: `Extract every project from this Provident Estate page ${page}. 

PAGE CONTENT:
${markdown.substring(0, 50000)}

ALL IMAGE URLs FOUND:
${allImageUrls.slice(0, 100).join("\n")}

PROJECT LINKS:
${links.filter((l: string) => l.includes("/new-projects/") && !l.includes("page/")).slice(0, 50).join("\n")}

REQUIRED OUTPUT - JSON array of objects with these exact fields:
[{
  "name": "Full project name",
  "developer_name": "Developer company name",
  "location": "Area/community name",
  "url": "Full project detail URL",
  "image_urls": ["array of cloudfront image URLs for THIS specific project"],
  "bedrooms": "bedroom configuration like 1, 2, 3 BR or Studio",
  "price_text": "Original price text like AED 1.5M",
  "price_from": 1500000,
  "handover_display": "handover date like Q2 2029 or Ready",
  "property_type_label": "Apartment|Villa|Sky-Villa|Studio|Townhouse|Penthouse",
  "status_label": "Future Launch|New Phase|New Launch|Coming Soon|Sold Out or null"
}]

CRITICAL RULES:
1. Extract ALL ~15-20 projects on this page
2. Match image URLs to specific projects based on project names in the URL
3. price_from must be a NUMBER in AED
4. Include 3-6 image URLs per project
5. Return ONLY the JSON array, no explanation`
          }
        ],
        temperature: 0.1,
        max_tokens: 30000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error(`[Page ${page}] AI failed:`, aiRes.status, errText.substring(0, 300));
      return new Response(JSON.stringify({ 
        error: "AI extraction failed", 
        status: aiRes.status,
        details: errText.substring(0, 300),
        page 
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error(`[Page ${page}] No JSON found in AI response:`, content.substring(0, 500));
      return new Response(JSON.stringify({ error: "No JSON in AI response", page, preview: content.substring(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let projects: any[] = [];
    try {
      projects = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error(`[Page ${page}] JSON parse error:`, parseErr);
      return new Response(JSON.stringify({ error: "JSON parse failed", page }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Page ${page}] AI extracted ${projects.length} projects`);

    const stats = { extracted: projects.length, queued: 0, skipped: 0 };

    for (const p of projects) {
      if (!p.name) { 
        stats.skipped++; 
        continue; 
      }

      // Match developer with fuzzy matching
      let dev: { id: string; name: string; slug: string } | undefined;
      if (p.developer_name) {
        const norm = p.developer_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        dev = devMap.get(norm);
        
        if (!dev) {
          for (const w of p.developer_name.toLowerCase().split(/\s+/)) {
            if (w.length > 3 && devMap.has(w)) { 
              dev = devMap.get(w); 
              break; 
            }
          }
        }
      }

      // Create unique slug
      const baseName = p.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      const slug = dev ? `${baseName}-${dev.slug}`.substring(0, 80) : baseName;
      
      const priceAed = p.price_from ? Math.round(p.price_from) : null;
      
      // Parse bedrooms
      const brMatches = p.bedrooms?.match(/(\d+)/g) || [];
      const brMin = brMatches[0] ? parseInt(brMatches[0]) : null;
      const brMax = brMatches.length > 1 ? parseInt(brMatches[brMatches.length - 1]) : brMin;

      // Check if already in queue or exists
      const { data: existingQueue } = await supabase
        .from("pending_project_imports")
        .select("id")
        .eq("slug", slug)
        .eq("status", "pending")
        .maybeSingle();

      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingQueue || existingProject) {
        console.log(`[Page ${page}] Skipping ${p.name} - already exists`);
        stats.skipped++;
        continue;
      }

      try {
        // Prepare images for queue
        const validImages = (p.image_urls || [])
          .filter((u: string) => 
            u && 
            typeof u === 'string' && 
            !u.toLowerCase().includes("logo") &&
            !u.toLowerCase().includes("icon")
          )
          .map((u: string) => u.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"))
          .filter((u: string, i: number, arr: string[]) => arr.indexOf(u) === i)
          .slice(0, 20);

        // INSERT TO APPROVAL QUEUE - NOT PROJECTS TABLE
        // Build insert payload - exclude developer_id if null to avoid FK constraint
        const insertPayload: Record<string, any> = {
          name: p.name,
          slug,
          developer_name: p.developer_name || null,
          location: p.location || null,
          emirate: "Dubai",
          price_from: priceAed,
          bedrooms_min: brMin,
          bedrooms_max: brMax,
          handover_date: p.handover_display || null,
          source_url: p.url || null,
          property_type_label: p.property_type_label || null,
          status_label: p.status_label || null,
          images: JSON.stringify(validImages.map((url: string, i: number) => ({
            url,
            alt_text: `${p.name} - Image ${i + 1}`,
            display_order: i
          }))),
          is_new_project: true,
          status: "pending",
        };
        
        // Only include developer_id if we have a valid match
        if (dev?.id) {
          insertPayload.developer_id = dev.id;
        }

        const { error: queueErr } = await supabase
          .from("pending_project_imports")
          .insert(insertPayload);

        if (queueErr) {
          console.error(`[Page ${page}] Queue insert failed for ${p.name}:`, queueErr);
          stats.skipped++;
        } else {
          stats.queued++;
        }
      } catch (dbErr) {
        console.error(`[Page ${page}] DB error for ${p.name}:`, dbErr);
        stats.skipped++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Page ${page}] Complete in ${duration}ms: ${stats.queued} queued for admin review`);

    return new Response(JSON.stringify({ 
      success: true, 
      page, 
      stats,
      mode: "approval_queue",
      extraction_method: "firecrawl-ai",
      duration_ms: duration 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
