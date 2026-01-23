import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapedProjectDetail {
  name: string;
  description: string;
  location: string;
  emirate: string;
  status: string;
  bedrooms: string;
  price_from: number | null;
  price_to: number | null;
  handover_date: string;
  payment_plan: string;
  amenities: string[];
  image_urls: string[];
  brochure_url: string | null;
  floor_plan_urls: string[];
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
    const { projectUrl, projectId, projectName } = await req.json();

    if (!projectUrl || !projectId) {
      return new Response(JSON.stringify({ error: "projectUrl and projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping project detail: ${projectName} from ${projectUrl}`);

    // Scrape the project page with Firecrawl
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: projectUrl,
        formats: ["markdown", "links", "html"],
        waitFor: 5000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape project page" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    console.log(`Scraped content length: ${markdown.length}, links: ${links.length}`);

    // Extract image URLs from scraped links
    const imageLinks = links.filter((link: string) =>
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(link) &&
      !link.includes("logo") &&
      !link.includes("icon") &&
      !link.includes("placeholder")
    );

    // Extract PDF/brochure links
    const pdfLinks = links.filter((link: string) =>
      /\.pdf(\?|$)/i.test(link)
    );

    console.log(`Found ${imageLinks.length} images, ${pdfLinks.length} PDFs`);

    // Use AI to extract structured data
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
Extract COMPLETE project details from the provided content.
Return valid JSON only, no markdown formatting.`
          },
          {
            role: "user",
            content: `Extract project details from this Provident Estate project page:

Project Name: ${projectName}
URL: ${projectUrl}

Content:
${markdown.substring(0, 40000)}

Links found:
${links.slice(0, 100).join("\n")}

Return JSON:
{
  "description": "Full detailed project description (2-4 paragraphs)",
  "location": "Area, Community name",
  "emirate": "Dubai/Abu Dhabi/etc",
  "status": "Ready OR Under Construction",
  "bedrooms": "1-4 BR",
  "price_from": 1500000,
  "price_to": 5000000,
  "handover_date": "Q4 2026",
  "payment_plan": "60/40 or details",
  "amenities": ["Pool", "Gym", "Spa", "etc"],
  "image_urls": ["ONLY real project image URLs from the page - no placeholders"],
  "brochure_url": "PDF brochure download URL if available",
  "floor_plan_urls": ["Floor plan PDF URLs if available"]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    let extractedData: Partial<ScrapedProjectDetail> = {};

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    }

    // Merge AI-extracted images with scraped image links
    const allImageUrls = [
      ...(extractedData.image_urls || []),
      ...imageLinks
    ].filter((url, index, arr) => arr.indexOf(url) === index); // Deduplicate

    // Update project with extracted data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (extractedData.description) updateData.description = extractedData.description;
    if (extractedData.location) updateData.location = extractedData.location;
    if (extractedData.emirate) updateData.emirate = extractedData.emirate;
    if (extractedData.status) {
      updateData.status = extractedData.status.toLowerCase().includes("ready") ? "Ready" : "Under Construction";
    }
    if (extractedData.price_from) updateData.price_from = extractedData.price_from;
    if (extractedData.price_to) updateData.price_to = extractedData.price_to;
    if (extractedData.handover_date) updateData.handover_date = extractedData.handover_date;
    if (extractedData.payment_plan) updateData.payment_plan = extractedData.payment_plan;
    if (extractedData.amenities && extractedData.amenities.length > 0) {
      updateData.amenities = extractedData.amenities;
    }
    if (extractedData.bedrooms) {
      const bedroomMatch = extractedData.bedrooms.match(/(\d+)/g);
      if (bedroomMatch) {
        updateData.bedrooms_min = parseInt(bedroomMatch[0]);
        updateData.bedrooms_max = parseInt(bedroomMatch[bedroomMatch.length - 1] || bedroomMatch[0]);
      }
    }

    await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    // Clear existing images and insert new ones (only if we found real images)
    if (allImageUrls.length > 0) {
      // Delete old images
      await supabase
        .from("project_images")
        .delete()
        .eq("project_id", projectId);

      // Insert new images (limit to 20)
      const imageRecords = allImageUrls.slice(0, 20).map((url, index) => ({
        project_id: projectId,
        image_url: url,
        alt_text: `${projectName} - Image ${index + 1}`,
        display_order: index,
      }));

      await supabase.from("project_images").insert(imageRecords);
    }

    // Insert brochure if found
    const brochureUrl = extractedData.brochure_url || 
      pdfLinks.find((l: string) => l.toLowerCase().includes("brochure")) ||
      pdfLinks[0];

    if (brochureUrl) {
      // Check if brochure already exists
      const { data: existingDoc } = await supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("document_type", "brochure")
        .maybeSingle();

      if (existingDoc) {
        await supabase
          .from("project_documents")
          .update({ file_url: brochureUrl })
          .eq("id", existingDoc.id);
      } else {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          document_type: "brochure",
          file_url: brochureUrl,
          file_name: `${projectName} Brochure.pdf`,
        });
      }
    }

    // Insert floor plans if found
    const floorPlanUrls = extractedData.floor_plan_urls || 
      pdfLinks.filter((l: string) => l.toLowerCase().includes("floor"));

    for (const fpUrl of floorPlanUrls) {
      const { data: existingFP } = await supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("file_url", fpUrl)
        .maybeSingle();

      if (!existingFP) {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          document_type: "floor_plan",
          file_url: fpUrl,
          file_name: `${projectName} Floor Plan.pdf`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      project: projectName,
      images_found: allImageUrls.length,
      brochure_found: !!brochureUrl,
      floor_plans_found: floorPlanUrls.length,
      status: extractedData.status || "unknown",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
