import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log(`Scraping developer page: ${developerUrl}`);

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

    // Process each project
    let created = 0;
    let updated = 0;
    let imagesAdded = 0;

    for (const proj of extractedProjects) {
      const projectSlug = proj.url
        .replace(`${PROVIDENT_BASE}/new-projects/`, "")
        .replace(/\/$/, "")
        .toLowerCase();

      // Check if project exists
      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("slug", projectSlug)
        .maybeSingle();

      // Parse price (convert EUR to AED: 1 EUR ≈ 4 AED)
      let priceFrom: number | null = null;
      if (proj.price) {
        const priceMatch = proj.price.match(/([\d,.]+)\s*(K|M)?/i);
        if (priceMatch) {
          let price = parseFloat(priceMatch[1].replace(/,/g, ""));
          if (priceMatch[2]?.toUpperCase() === "K") price *= 1000;
          if (priceMatch[2]?.toUpperCase() === "M") price *= 1000000;
          // Convert EUR to AED
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

      // Determine status based on handover year
      const handoverYear = parseInt(proj.handover?.match(/\d{4}/)?.[0] || "0");
      const status = handoverYear <= 2024 ? "Ready" : "Under Construction";

      const projectData = {
        name: proj.name,
        slug: projectSlug,
        developer_id: developer.id,
        location: proj.location,
        emirate: "Dubai",
        status,
        price_from: priceFrom,
        bedrooms_min: bedroomsMin,
        bedrooms_max: bedroomsMax,
        handover_date: proj.handover || null,
        description: proj.description,
        is_offplan: status === "Under Construction",
        is_developer_direct: true,
        source_url: proj.url,
        updated_at: new Date().toISOString(),
      };

      let projectId: string;

      if (existing) {
        await supabase
          .from("projects")
          .update(projectData)
          .eq("id", existing.id);
        projectId = existing.id;
        updated++;
      } else {
        const { data: newProject } = await supabase
          .from("projects")
          .insert(projectData)
          .select("id")
          .single();
        projectId = newProject?.id;
        created++;
      }

      // Insert images if we have them and project exists
      if (projectId && proj.images && proj.images.length > 0) {
        // Delete old images for this project
        await supabase
          .from("project_images")
          .delete()
          .eq("project_id", projectId);

        // Filter for valid cloudfront images
        const validImages = proj.images.filter((url: string) => 
          url.includes("d3h330vgpwpjr8.cloudfront.net") &&
          /\.(jpg|jpeg|png|webp|gif)/i.test(url)
        );

        // Insert new images
        if (validImages.length > 0) {
          const imageRecords = validImages.slice(0, 15).map((url: string, index: number) => ({
            project_id: projectId,
            image_url: url,
            alt_text: `${proj.name} - Image ${index + 1}`,
            display_order: index,
          }));

          await supabase.from("project_images").insert(imageRecords);
          imagesAdded += imageRecords.length;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      developer: developer.name,
      projects_found: extractedProjects.length,
      created,
      updated,
      images_added: imagesAdded,
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
