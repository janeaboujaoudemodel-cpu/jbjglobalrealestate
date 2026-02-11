import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAND_PATTERNS = /provident|reelly|bayut|dubizzle|property finder/gi;

function cleanDescription(text: string): string {
  return text
    .replace(BRAND_PATTERNS, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;
    const offset = body.offset || 0;

    // Get areas missing descriptions
    const { data: areas, error: fetchErr } = await supabase
      .from("areas")
      .select("id, name, slug, emirate, description, provident_url")
      .or("description.is.null,description.eq.")
      .eq("is_active", true)
      .range(offset, offset + batchSize - 1);

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No areas need descriptions", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count } = await supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .or("description.is.null,description.eq.")
      .eq("is_active", true);

    const results: { area: string; source: string; status: string }[] = [];

    for (const area of areas) {
      let description: string | null = null;
      let source = "none";

      try {
        // Step 1: Try scraping Provident area guide
        if (firecrawlKey) {
          const providentSlug = area.slug;
          const providentUrl = `https://www.provident.ae/areas/${providentSlug}`;

          const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: providentUrl,
              formats: ["markdown"],
              onlyMainContent: true,
              waitFor: 3000,
              timeout: 15000,
            }),
          });

          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            const markdown = scrapeData.data?.markdown || "";

            // Extract description-like paragraphs (skip navigation, links)
            if (markdown.length > 100) {
              const paragraphs = markdown
                .split(/\n\n+/)
                .filter((p: string) => p.length > 80 && !p.startsWith("#") && !p.startsWith("[") && !p.startsWith("*"))
                .slice(0, 3);

              if (paragraphs.length > 0) {
                description = cleanDescription(paragraphs.join(" ").slice(0, 500));
                source = "provident";
              }
            }
          }

          await new Promise(r => setTimeout(r, 2000));
        }

        // Step 2: If no description found, generate with AI
        if (!description && lovableKey) {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${lovableKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [{
                role: "user",
                content: `Write a 2-3 sentence factual description of "${area.name}" in ${area.emirate || "Dubai"}, UAE. Focus on what the area is known for, its character, and key attractions. Do NOT mention any real estate agencies or brands. Write in third person, professional tone.`
              }],
              temperature: 0.3,
              max_tokens: 300,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const text = aiData.choices?.[0]?.message?.content?.trim();
            if (text && text.length > 50) {
              description = cleanDescription(text);
              source = "ai";
            }
          }
        }

        if (description) {
          const { error: updateErr } = await supabase
            .from("areas")
            .update({
              description,
              updated_at: new Date().toISOString(),
            })
            .eq("id", area.id);

          results.push({
            area: area.name,
            source,
            status: updateErr ? `error: ${updateErr.message}` : "updated",
          });
        } else {
          results.push({ area: area.name, source: "none", status: "no_description_found" });
        }
      } catch (err) {
        results.push({
          area: area.name,
          source: "error",
          status: `error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated: results.filter(r => r.status === "updated").length,
        remaining: (count || 0) - results.filter(r => r.status === "updated").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
