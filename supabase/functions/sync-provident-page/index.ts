import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    console.log(`[Page ${page}] Starting sync...`);
    
    // Get developers for matching
    const { data: developers, error: devError } = await supabase.from("developers").select("id, name, slug");
    
    if (devError || !developers?.length) {
      console.error("Developer fetch error:", devError);
      return new Response(JSON.stringify({ error: "No developers found", details: devError?.message }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Page ${page}] Found ${developers.length} developers`);

    // Build developer lookup with multiple matching strategies
    const devMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const d of developers) {
      // Full normalized name
      devMap.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ""), d);
      // Individual words (for partial matching)
      const words = d.name.toLowerCase().split(/\s+/);
      for (const w of words) {
        if (w.length > 3) devMap.set(w, d);
      }
    }

    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const url = `https://providentestate.com/new-projects/${pageSlug}`;

    console.log(`[Page ${page}] Scraping: ${url}`);

    // Scrape with Firecrawl - LONGER wait for JS rendering
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url, 
        formats: ["markdown", "links", "rawHtml"],
        waitFor: 15000, // Wait 15 seconds for Gatsby JS to render
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
            
            // Process projects from page-data
            const stats = { extracted: projects.length, created: 0, updated: 0, skipped: 0, images: 0 };
            
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

              if (!dev) { 
                console.warn(`[Page ${page}] No developer match for: ${developerName}`);
                stats.skipped++; 
                continue; 
              }

              // Create slug
              const baseName = projectName.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .substring(0, 50);
              const slug = `${baseName}-${dev.slug}`.substring(0, 80);
              
              // Get price and other details
              const priceText = p.projectDetails?.price || p.projectDetails?.priceFrom;
              let priceAed: number | null = null;
              if (priceText) {
                const priceMatch = priceText.match(/[\d,\.]+/);
                if (priceMatch) {
                  let val = parseFloat(priceMatch[0].replace(/,/g, ""));
                  // Convert EUR to AED if needed
                  if (priceText.toLowerCase().includes("eur")) {
                    val = Math.round(val * 4.0);
                  }
                  // Handle K/M suffixes
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
              
              // Upsert project
              try {
                const { data: existing } = await supabase
                  .from("projects")
                  .select("id")
                  .eq("slug", slug)
                  .maybeSingle();
                  
                let projectId: string;

                if (existing) {
                  await supabase.from("projects").update({
                    location: location || undefined,
                    price_from: priceAed || undefined,
                    handover_date: handover || undefined,
                    source_url: `https://providentestate.com/new-projects/${p.slug}/`,
                    updated_at: new Date().toISOString(),
                  }).eq("id", existing.id);
                  
                  projectId = existing.id;
                  stats.updated++;
                } else {
                  const yearMatch = handover?.match(/\d{4}/);
                  const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() + 2;
                  const isReady = handover?.toLowerCase().includes("ready") || year <= new Date().getFullYear();
                  const status = isReady ? "Ready" : "Under Construction";
                  
                  const { data: newProj, error: insertErr } = await supabase.from("projects").insert({
                    name: projectName,
                    slug,
                    developer_id: dev.id,
                    location,
                    emirate: "Dubai",
                    status,
                    price_from: priceAed,
                    handover_date: handover,
                    source_url: `https://providentestate.com/new-projects/${p.slug}/`,
                    is_offplan: status === "Under Construction",
                    is_developer_direct: true,
                  }).select("id").single();

                  if (insertErr || !newProj) {
                    console.error(`[Page ${page}] Insert failed for ${projectName}:`, insertErr);
                    stats.skipped++;
                    continue;
                  }
                  
                  projectId = newProj.id;
                  stats.created++;
                }

                // Handle images
                if (images.length > 0) {
                  await supabase.from("project_images").delete().eq("project_id", projectId);
                  
                  const imageRecords = images.slice(0, 20).map((url, i) => ({
                    project_id: projectId,
                    image_url: url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"),
                    alt_text: `${projectName} - Image ${i + 1}`,
                    display_order: i,
                  }));
                  
                  await supabase.from("project_images").insert(imageRecords);
                  stats.images += imageRecords.length;
                }
              } catch (dbErr) {
                console.error(`[Page ${page}] DB error for ${projectName}:`, dbErr);
                stats.skipped++;
              }
            }

            const duration = Date.now() - startTime;
            console.log(`[Page ${page}] Complete via page-data in ${duration}ms: ${stats.created} created, ${stats.updated} updated, ${stats.images} images`);

            return new Response(JSON.stringify({ 
              success: true, 
              page, 
              stats,
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

    // Extract image URLs from HTML using regex (more reliable than markdown)
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

    // AI extraction with improved prompt
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
    
    // Extract JSON from response (handle markdown code blocks)
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

    const stats = { extracted: projects.length, created: 0, updated: 0, skipped: 0, images: 0 };

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
        
        // Try word-by-word matching
        if (!dev) {
          for (const w of p.developer_name.toLowerCase().split(/\s+/)) {
            if (w.length > 3 && devMap.has(w)) { 
              dev = devMap.get(w); 
              break; 
            }
          }
        }
      }

      if (!dev) { 
        console.warn(`[Page ${page}] No developer match for: ${p.developer_name}`);
        stats.skipped++; 
        continue; 
      }

      // Create unique slug
      const baseName = p.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      const slug = `${baseName}-${dev.slug}`.substring(0, 80);
      
      // Price should already be in AED from the prompt
      const priceAed = p.price_from ? Math.round(p.price_from) : null;
      
      // Parse handover year for status
      const yearMatch = p.handover_display?.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() + 2;
      const isReady = p.handover_display?.toLowerCase().includes("ready") || year <= new Date().getFullYear();
      const status = isReady ? "Ready" : "Under Construction";
      
      // Parse bedrooms
      const brMatches = p.bedrooms?.match(/(\d+)/g) || [];
      const brMin = brMatches[0] ? parseInt(brMatches[0]) : null;
      const brMax = brMatches.length > 1 ? parseInt(brMatches[brMatches.length - 1]) : brMin;

      try {
        // Check if project exists
        const { data: existing } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
          
        let projectId: string;

        if (existing) {
          // Update existing project
          await supabase.from("projects").update({
            location: p.location || undefined,
            status,
            price_from: priceAed || undefined,
            bedrooms_min: brMin || undefined,
            bedrooms_max: brMax || undefined,
            handover_date: p.handover_display || undefined,
            source_url: p.url || undefined,
            is_offplan: status === "Under Construction",
            is_developer_direct: true,
            property_type_label: p.property_type_label || undefined,
            status_label: p.status_label || undefined,
            updated_at: new Date().toISOString(),
          }).eq("id", existing.id);
          
          projectId = existing.id;
          stats.updated++;
        } else {
          // Create new project
          const { data: newProj, error: insertErr } = await supabase.from("projects").insert({
            name: p.name,
            slug,
            developer_id: dev.id,
            location: p.location,
            emirate: "Dubai",
            status,
            price_from: priceAed,
            bedrooms_min: brMin,
            bedrooms_max: brMax,
            handover_date: p.handover_display,
            source_url: p.url,
            is_offplan: status === "Under Construction",
            is_developer_direct: true,
            property_type_label: p.property_type_label || null,
            status_label: p.status_label || null,
          }).select("id").single();

          if (insertErr || !newProj) {
            console.error(`[Page ${page}] Insert failed for ${p.name}:`, insertErr);
            stats.skipped++;
            continue;
          }
          
          projectId = newProj.id;
          stats.created++;
        }

        // Handle images - get high-res versions
        if (p.image_urls?.length > 0) {
          const validImages = p.image_urls
            .filter((u: string) => 
              u && 
              typeof u === 'string' && 
              !u.toLowerCase().includes("logo") &&
              !u.toLowerCase().includes("icon")
            )
            .map((u: string) => {
              // Convert to high-res version
              return u.replace(/\/x\/\d+x\d+\//, "/x/1200x800/");
            })
            .filter((u: string, i: number, arr: string[]) => arr.indexOf(u) === i) // Unique
            .slice(0, 20); // Max 20 images

          if (validImages.length > 0) {
            // Delete existing images first
            await supabase.from("project_images").delete().eq("project_id", projectId);
            
            // Insert new images
            const { error: imgErr } = await supabase.from("project_images").insert(
              validImages.map((url: string, i: number) => ({
                project_id: projectId,
                image_url: url,
                alt_text: `${p.name} - Image ${i + 1}`,
                display_order: i,
              }))
            );
            
            if (imgErr) {
              console.error(`[Page ${page}] Image insert failed for ${p.name}:`, imgErr);
            } else {
              stats.images += validImages.length;
            }
          }
        }
      } catch (dbErr) {
        console.error(`[Page ${page}] DB error for ${p.name}:`, dbErr);
        stats.skipped++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Page ${page}] Complete in ${duration}ms: ${stats.created} created, ${stats.updated} updated, ${stats.images} images`);

    return new Response(JSON.stringify({ 
      success: true, 
      page, 
      stats,
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
