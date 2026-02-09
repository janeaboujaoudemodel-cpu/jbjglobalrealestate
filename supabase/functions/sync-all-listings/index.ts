import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedProject {
  name: string;
  developer_name: string;
  location: string;
  url: string;
  image_urls: string[];
  bedrooms: string;
  price_text: string;
  price_from: number | null;
  handover_year: string;
  handover_display: string;
  status: string;
  description: string;
  property_type_label: string;
  status_label: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey || !lovableKey) {
    return new Response(JSON.stringify({ 
      error: "Missing API keys" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { startPage = 1, endPage = 70 } = await req.json().catch(() => ({}));
    
    // Get all developers for matching
    const { data: developers } = await supabase
      .from("developers")
      .select("id, name, slug");
    
    if (!developers || developers.length === 0) {
      return new Response(JSON.stringify({ error: "No developers found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create developer lookup
    const developerMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const dev of developers) {
      const normalized = dev.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      developerMap.set(normalized, dev);
      
      const words = dev.name.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) developerMap.set(word, dev);
      }
      
      // Common developer name shortcuts
      if (dev.name.toLowerCase().includes("emaar")) developerMap.set("emaar", dev);
      if (dev.name.toLowerCase().includes("damac")) developerMap.set("damac", dev);
      if (dev.name.toLowerCase().includes("sobha")) developerMap.set("sobha", dev);
      if (dev.name.toLowerCase().includes("binghatti")) developerMap.set("binghatti", dev);
      if (dev.name.toLowerCase().includes("omniyat")) developerMap.set("omniyat", dev);
      if (dev.name.toLowerCase().includes("meraas")) developerMap.set("meraas", dev);
      if (dev.name.toLowerCase().includes("nakheel")) developerMap.set("nakheel", dev);
      if (dev.name.toLowerCase().includes("azizi")) developerMap.set("azizi", dev);
    }

    const stats = {
      pages_scraped: 0,
      total_extracted: 0,
      matched: 0,
      created: 0,
      updated: 0,
      images_added: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process pages
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const pageSlug = pageNum === 1 ? "" : `page/${pageNum}/`;
      const url = `https://providentestate.com/new-projects/${pageSlug}`;
      
      console.log(`Scraping page ${pageNum}: ${url}`);

      try {
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url,
            formats: ["markdown", "links"],
            waitFor: 6000,
          }),
        });

        if (!scrapeResponse.ok) {
          stats.errors.push(`Page ${pageNum}: scrape failed`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || "";
        const links = scrapeData.data?.links || [];

        if (markdown.length < 1000) {
          console.log(`Page ${pageNum}: No more content, stopping.`);
          break;
        }

        stats.pages_scraped++;

        // AI extraction
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: "Extract ALL project listings from Provident Estate pages. Return ONLY valid JSON array."
              },
              {
                role: "user",
                content: `Extract EVERY project from this page:

${markdown.substring(0, 80000)}

Links:
${links.filter((l: string) => l.includes("new-projects") || l.includes("cloudfront")).slice(0, 200).join("\n")}

Return JSON array:
[{
  "name": "Project Name",
  "developer_name": "Developer Name",
  "location": "Area",
  "url": "project URL",
  "image_urls": ["cloudfront URLs"],
  "bedrooms": "1, 2, 3 BR",
  "price_text": "EUR 294K",
  "price_from": 294000,
  "handover_year": "2029",
  "handover_display": "Q2 2029",
  "status": "Under Construction",
  "description": "Brief description",
  "property_type_label": "Apartment, Sky-Villa",
  "status_label": "Future Launch"
}]

RULES:
- Extract ALL ~20 projects per page
- property_type_label: exactly as shown (Apartment, Villa, Sky-Villa, Studio, Townhouse)
- status_label: Future Launch, New Phase, New Launch, Coming Soon, or empty
- handover_display: Q2 2029, Ready, etc.
- Parse EUR prices (EUR 294K = 294000, EUR 1.51M = 1510000)`
              }
            ],
            temperature: 0.1,
            max_tokens: 32000,
          }),
        });

        if (!aiResponse.ok) continue;

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        let projects: ExtractedProject[] = [];
        try {
          projects = JSON.parse(jsonMatch[0]);
          stats.total_extracted += projects.length;
          console.log(`Page ${pageNum}: ${projects.length} projects`);
        } catch {
          continue;
        }

        // Process projects
        for (const proj of projects) {
          if (!proj.name) continue;

          // Match developer
          let matchedDev: { id: string; name: string; slug: string } | undefined;
          
          if (proj.developer_name) {
            const norm = proj.developer_name.toLowerCase().replace(/[^a-z0-9]/g, "");
            matchedDev = developerMap.get(norm);
            
            if (!matchedDev) {
              for (const word of proj.developer_name.toLowerCase().split(/\s+/)) {
                if (word.length > 3 && developerMap.has(word)) {
                  matchedDev = developerMap.get(word);
                  break;
                }
              }
            }
          }

          if (!matchedDev) {
            stats.skipped++;
            continue;
          }

          stats.matched++;

          const slug = `${proj.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 50)}-${matchedDev.slug}`.substring(0, 80);
          const priceAed = proj.price_from ? Math.round(proj.price_from * 4.0) : null;
          const year = parseInt(proj.handover_year) || new Date().getFullYear() + 2;
          const status = proj.status?.toLowerCase().includes("ready") || year <= new Date().getFullYear() ? "Ready" : "Under Construction";
          
          const bedrooms = proj.bedrooms?.match(/(\d+)/g) || [];
          const bedroomsMin = bedrooms[0] ? parseInt(bedrooms[0]) : null;
          const bedroomsMax = bedrooms.length > 1 ? parseInt(bedrooms[bedrooms.length - 1]) : bedroomsMin;

          try {
            const { data: existing } = await supabase
              .from("projects")
              .select("id")
              .eq("slug", slug)
              .maybeSingle();

            let projectId: string;

            if (existing) {
              await supabase.from("projects").update({
                location: proj.location || undefined,
                status,
                price_from: priceAed || undefined,
                bedrooms_min: bedroomsMin || undefined,
                bedrooms_max: bedroomsMax || undefined,
                handover_date: proj.handover_display || `Q4 ${proj.handover_year}`,
                description: proj.description || undefined,
                source_url: proj.url || undefined,
                is_offplan: status === "Under Construction",
                is_developer_direct: true,
                property_type_label: proj.property_type_label || undefined,
                status_label: proj.status_label || undefined,
                updated_at: new Date().toISOString(),
              }).eq("id", existing.id);
              
              projectId = existing.id;
              stats.updated++;
            } else {
              const { data: newProj } = await supabase.from("projects").insert({
                name: proj.name,
                slug,
                developer_id: matchedDev.id,
                location: proj.location,
                emirate: "Dubai",
                status,
                price_from: priceAed,
                bedrooms_min: bedroomsMin,
                bedrooms_max: bedroomsMax,
                handover_date: proj.handover_display || `Q4 ${proj.handover_year}`,
                description: proj.description,
                source_url: proj.url,
                is_offplan: status === "Under Construction",
                is_developer_direct: true,
                property_type_label: proj.property_type_label || null,
                status_label: proj.status_label || null,
              }).select("id").single();

              if (!newProj) continue;
              projectId = newProj.id;
              stats.created++;
            }

            // Handle images
            if (proj.image_urls?.length > 0) {
              const validImages = proj.image_urls
                .filter((u: string) => u.includes("cloudfront.net") && !u.includes("logo"))
                .map((u: string) => u.replace(/\/x\/\d+x\d+\//, "/x/800x600/"))
                .filter((u: string, i: number, a: string[]) => a.indexOf(u) === i)
                .slice(0, 8);

              if (validImages.length > 0) {
                await supabase.from("project_images").delete().eq("project_id", projectId);
                await supabase.from("project_images").insert(
                  validImages.map((url: string, i: number) => ({
                    project_id: projectId,
                    image_url: url,
                    alt_text: `${proj.name} - ${i + 1}`,
                    display_order: i,
                  }))
                );
                stats.images_added += validImages.length;
              }
            }
          } catch (e) {
            stats.errors.push(`${proj.name}: ${e instanceof Error ? e.message : "error"}`);
          }
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 2500));
        
      } catch (e) {
        stats.errors.push(`Page ${pageNum}: ${e instanceof Error ? e.message : "error"}`);
      }
    }

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
