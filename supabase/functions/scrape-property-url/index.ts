import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // ── Step 1: Scrape with Firecrawl ─────────────────────────────────────────
    let markdown = "";
    let pageImages: string[] = [];
    let pageTitle = "";

    if (FIRECRAWL_API_KEY) {
      console.log("Scraping with Firecrawl:", url);
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown", "links"],
          onlyMainContent: true,
          waitFor: 3000,
          timeout: 30000,
        }),
      });

      if (fcRes.ok) {
        const fcData = await fcRes.json();
        markdown = fcData.data?.markdown || fcData.markdown || "";
        pageTitle = fcData.data?.metadata?.title || fcData.metadata?.title || "";

        // Extract image URLs from links that look like property photos
        const allLinks: string[] = fcData.data?.links || fcData.links || [];
        pageImages = allLinks.filter((l: string) =>
          /\.(jpg|jpeg|png|webp)/i.test(l) &&
          !/(logo|icon|avatar|sprite|thumbnail.*thumb|badge)/i.test(l)
        ).slice(0, 12);

        // Also extract markdown images
        const mdImageMatches = markdown.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
        for (const m of mdImageMatches) {
          const imgUrl = m[1];
          if (
            !pageImages.includes(imgUrl) &&
            !/logo|icon|avatar|sprite|badge/i.test(imgUrl)
          ) {
            pageImages.push(imgUrl);
          }
        }
        pageImages = pageImages.slice(0, 10);
        console.log(`Firecrawl: ${markdown.length} chars, ${pageImages.length} images`);
      } else {
        const errText = await fcRes.text();
        console.error("Firecrawl error:", fcRes.status, errText);
      }
    } else {
      console.warn("FIRECRAWL_API_KEY not set — falling back to meta-only extraction");
    }

    // ── Step 2: AI extraction of structured property data ─────────────────────
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const extractionPrompt = markdown
      ? `You are a real estate data extraction AI. Extract structured property data from the following scraped webpage content.

URL: ${url}
Page title: ${pageTitle}

Scraped content:
${markdown.slice(0, 6000)}

Extract and return ONLY valid JSON with this exact structure (no markdown, no commentary):
{
  "name": "property/project name",
  "developer": "developer or agency name",
  "location": "area/neighborhood",
  "city": "city name",
  "country": "country",
  "price_text": "formatted price as shown (e.g. 'AED 2.5M' or 'from AED 1.2M')",
  "price_from_aed": null or number,
  "price_to_aed": null or number,
  "bedrooms": "e.g. '2-4 BR' or 'Studio' or '3 BR'",
  "property_type": "Apartment/Villa/Townhouse/etc",
  "description": "2-3 sentence property description for the video ad",
  "amenities": ["amenity1", "amenity2"],
  "payment_plan": "payment plan details if mentioned",
  "completion_date": "completion date if mentioned"
}`
      : `Extract property data from this URL: ${url}
Return JSON with: name, developer, location, city, country, price_text, price_from_aed, price_to_aed, bedrooms, property_type, description, amenities, payment_plan, completion_date`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a real estate data extraction AI. Always respond with valid JSON only. No markdown code blocks, no explanation.",
          },
          { role: "user", content: extractionPrompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) throw new Error("AI rate limit reached — please try again in a moment");
      if (aiRes.status === 402) throw new Error("AI credits exhausted — please add credits in Settings");
      throw new Error(`AI extraction failed: ${errText}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content?.trim() || "{}";

    // Parse AI JSON — strip markdown fences if present
    let propertyData: Record<string, unknown> = {};
    try {
      const clean = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      propertyData = JSON.parse(clean);
    } catch {
      console.error("Failed to parse AI JSON:", rawContent.slice(0, 200));
      propertyData = {
        name: pageTitle || "Property Listing",
        description: "Premium property available. Contact us for details.",
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        property: propertyData,
        images: pageImages,
        sourceUrl: url,
        pageTitle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[scrape-property-url] error:", err);
    const message = err instanceof Error ? err.message : "Failed to scrape property";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
