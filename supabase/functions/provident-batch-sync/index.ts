import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDENT_BASE = "https://providentestate.com";

interface ScrapedProject {
  name: string;
  slug: string;
  url: string;
  location: string;
  type: string;
  bedrooms: string;
  price: string;
  handover: string;
  description: string;
  images: string[];
}

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey || !lovableKey) {
    return new Response(JSON.stringify({ error: "Missing API keys" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { developerSlug, limit = 10 } = body;

    if (!developerSlug) {
      return new Response(JSON.stringify({ error: "developerSlug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get developer from database
    const { data: developer } = await supabase
      .from("developers")
      .select("*")
      .eq("slug", developerSlug)
      .maybeSingle();

    if (!developer) {
      return new Response(JSON.stringify({ error: `Developer ${developerSlug} not found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert developer name to Provident URL slug format
    const providentSlug = developer.name.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    const developerUrl = `${PROVIDENT_BASE}/new-projects/developed-by-${providentSlug}/`;
    console.log(`[ApprovalQueue] Scraping developer page: ${developerUrl}`);

    // Scrape the developer listing page
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: developerUrl,
        formats: ["markdown", "links"],
        waitFor: 5000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape developer page", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    console.log(`Scraped ${links.length} links from developer page`);

    // Extract project URLs from links
    const projectUrls = links.filter((link: string) => 
      link.startsWith(`${PROVIDENT_BASE}/new-projects/`) &&
      !link.includes("/developed-by-") &&
      !link.includes("/page/")
    ).slice(0, limit);

    console.log(`Found ${projectUrls.length} project URLs`);

    // Use AI to extract project data from the developer page
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
            content: `You are a real estate data extraction specialist for UAE properties.
Extract ALL project listings from the developer page content.
Return valid JSON only - no markdown formatting.`
          },
          {
            role: "user",
            content: `Extract all property projects from this Provident Estate developer page:

Developer: ${developer.name}

Content:
${markdown.substring(0, 50000)}

Links found:
${projectUrls.join("\n")}

Return JSON array of projects:
{
  "projects": [
    {
      "name": "Project Name",
      "url": "https://providentestate.com/new-projects/project-slug/",
      "location": "Area Name",
      "type": "apartment/villa/townhouse",
      "bedrooms": "1, 2, 3",
      "handover": "2029",
      "price": "EUR 294K",
      "description": "Short description",
      "images": ["https://d3h330vgpwpjr8.cloudfront.net/..."]
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    let extractedProjects: ScrapedProject[] = [];

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedProjects = parsed.projects || [];
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    }

    console.log(`Extracted ${extractedProjects.length} projects via AI`);

    // Process each project - INSERT TO APPROVAL QUEUE, NOT PROJECTS
    let queued = 0;
    let skipped = 0;

    for (const proj of extractedProjects) {
      const projectSlug = proj.url
        .replace(`${PROVIDENT_BASE}/new-projects/`, "")
        .replace(/\/$/, "")
        .toLowerCase();

      // Check if already in queue or exists
      const { data: existingQueue } = await supabase
        .from("pending_project_imports")
        .select("id")
        .eq("slug", projectSlug)
        .eq("status", "pending")
        .maybeSingle();

      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", projectSlug)
        .maybeSingle();

      if (existingQueue || existingProject) {
        skipped++;
        continue;
      }

      // Parse price (convert EUR to AED: 1 EUR ≈ 4 AED)
      let priceFrom: number | null = null;
      if (proj.price) {
        const priceMatch = proj.price.match(/([\d,.]+)\s*(K|M)?/i);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ""));
          if (priceMatch[2]?.toUpperCase() === "K") price *= 1000;
          if (priceMatch[2]?.toUpperCase() === "M") price *= 1000000;
          if (proj.price.includes("EUR")) {
            price *= 4;
          }
          priceFrom = Math.round(price);
        }
      }

      // Parse bedrooms
      let bedroomsMin: number | null = null;
      let bedroomsMax: number | null = null;
      if (proj.bedrooms) {
        const bedMatch = proj.bedrooms.match(/(\d+)/g);
        if (bedMatch) {
          bedroomsMin = parseInt(bedMatch[0]);
          bedroomsMax = parseInt(bedMatch[bedMatch.length - 1] || bedMatch[0]);
        }
      }

      // Prepare images - CRITICAL: Do NOT upscale to 1200x800 (causes 403 errors)
      // Use 464x312 which is known to work on Provident's CDN
      const validImages = (proj.images || [])
        .filter((url: string) => url && typeof url === 'string' && !url.includes("logo"))
        .map((url: string) => url.replace(/\/x\/\d+x\d+\//, "/x/464x312/"))
        .slice(0, 15);

      // INSERT TO APPROVAL QUEUE - NOT PROJECTS TABLE
      const { error: queueErr } = await supabase
        .from("pending_project_imports")
        .insert({
          name: proj.name,
          slug: projectSlug,
          developer_id: developer.id,
          developer_name: developer.name,
          location: proj.location || null,
          emirate: "Dubai",
          description: proj.description || null,
          price_from: priceFrom,
          bedrooms_min: bedroomsMin,
          bedrooms_max: bedroomsMax,
          handover_date: proj.handover || null,
          property_type_label: proj.type || null,
          source_url: proj.url || null,
          images: JSON.stringify(validImages.map((url: string, i: number) => ({
            url,
            alt_text: `${proj.name} - Image ${i + 1}`,
            display_order: i
          }))),
          is_new_project: true,
          status: "pending",
        });

      if (queueErr) {
        console.error(`Queue insert failed for ${proj.name}:`, queueErr);
        skipped++;
      } else {
        queued++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "approval_queue",
      developer: developer.name,
      projects_found: extractedProjects.length,
      stats: { queued, skipped },
      projects: extractedProjects.map(p => ({ name: p.name, images: p.images?.length || 0 })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Batch sync error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
