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
    const { page = 1 } = await req.json().catch(() => ({}));
    
    // Get developers for matching
    const { data: developers } = await supabase.from("developers").select("id, name, slug");
    
    if (!developers?.length) {
      return new Response(JSON.stringify({ error: "No developers" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build developer lookup
    const devMap = new Map<string, { id: string; name: string; slug: string }>();
    for (const d of developers) {
      devMap.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ""), d);
      const words = d.name.toLowerCase().split(/\s+/);
      for (const w of words) if (w.length > 3) devMap.set(w, d);
    }

    const pageSlug = page === 1 ? "" : `page/${page}/`;
    const url = `https://providentestate.com/new-projects/${pageSlug}`;

    console.log(`Scraping: ${url}`);

    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown", "links"], waitFor: 5000 }),
    });

    if (!scrapeRes.ok) {
      return new Response(JSON.stringify({ error: "Scrape failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    if (markdown.length < 500) {
      return new Response(JSON.stringify({ success: true, message: "No content", page }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI extraction
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract ALL projects from page. Return ONLY JSON array." },
          {
            role: "user",
            content: `Extract ALL projects from page ${page}:

${markdown.substring(0, 60000)}

Links:
${links.filter((l: string) => l.includes("new-projects") || l.includes("cloudfront")).slice(0, 150).join("\n")}

Return JSON:
[{
  "name": "Project Name",
  "developer_name": "Developer Name",
  "location": "Area",
  "url": "project URL",
  "image_urls": ["cloudfront URLs"],
  "bedrooms": "1, 2, 3 BR",
  "price_text": "EUR 294K",
  "price_from": 294000,
  "handover_display": "Q2 2029",
  "property_type_label": "Apartment",
  "status_label": "Future Launch"
}]

RULES:
- Extract ALL ~20 projects
- property_type_label: Apartment, Villa, Sky-Villa, Studio, Townhouse
- status_label: Future Launch, New Phase, New Launch, Coming Soon, or empty
- Parse EUR: EUR 294K = 294000, EUR 1.51M = 1510000`
          }
        ],
        temperature: 0.1,
        max_tokens: 20000,
      }),
    });

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: "AI failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "No JSON in response", page }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let projects: any[] = [];
    try {
      projects = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "JSON parse failed", page }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = { extracted: projects.length, created: 0, updated: 0, skipped: 0, images: 0 };

    for (const p of projects) {
      if (!p.name) { stats.skipped++; continue; }

      // Match developer
      let dev: { id: string; name: string; slug: string } | undefined;
      if (p.developer_name) {
        const norm = p.developer_name.toLowerCase().replace(/[^a-z0-9]/g, "");
        dev = devMap.get(norm);
        if (!dev) {
          for (const w of p.developer_name.toLowerCase().split(/\s+/)) {
            if (w.length > 3 && devMap.has(w)) { dev = devMap.get(w); break; }
          }
        }
      }

      if (!dev) { stats.skipped++; continue; }

      const slug = `${p.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").substring(0, 50)}-${dev.slug}`.substring(0, 80);
      const priceAed = p.price_from ? Math.round(p.price_from * 4.0) : null;
      const year = parseInt(p.handover_display?.match(/\d{4}/)?.[0] || "") || new Date().getFullYear() + 2;
      const status = p.handover_display?.toLowerCase().includes("ready") || year <= new Date().getFullYear() ? "Ready" : "Under Construction";
      
      const brs = p.bedrooms?.match(/(\d+)/g) || [];
      const brMin = brs[0] ? parseInt(brs[0]) : null;
      const brMax = brs.length > 1 ? parseInt(brs[brs.length - 1]) : brMin;

      try {
        const { data: existing } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
        let projectId: string;

        if (existing) {
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
          const { data: np } = await supabase.from("projects").insert({
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

          if (!np) continue;
          projectId = np.id;
          stats.created++;
        }

        // Images
        if (p.image_urls?.length > 0) {
          const imgs = p.image_urls
            .filter((u: string) => u.includes("cloudfront.net") && !u.includes("logo"))
            .map((u: string) => u.replace(/\/x\/\d+x\d+\//, "/x/800x600/"))
            .filter((u: string, i: number, a: string[]) => a.indexOf(u) === i)
            .slice(0, 6);

          if (imgs.length > 0) {
            await supabase.from("project_images").delete().eq("project_id", projectId);
            await supabase.from("project_images").insert(
              imgs.map((url: string, i: number) => ({
                project_id: projectId,
                image_url: url,
                alt_text: `${p.name} - ${i + 1}`,
                display_order: i,
              }))
            );
            stats.images += imgs.length;
          }
        }
      } catch (e) {
        console.error(`Error: ${p.name}`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, page, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
