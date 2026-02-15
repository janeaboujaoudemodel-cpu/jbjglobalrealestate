import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { offset = 0 } = await req.json().catch(() => ({}));

    // Get ONE developer missing a logo
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null)
      .order("name")
      .range(offset, offset);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, done: true, message: "No more developers to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dev = devs[0];
    console.log(`Processing: ${dev.name} (offset ${offset})`);

    // Use Firecrawl search to find the developer website
    const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `"${dev.name}" Dubai real estate developer official site`,
        limit: 3,
        scrapeOptions: { formats: ["branding"] },
      }),
    });

    if (!searchResp.ok) {
      return new Response(JSON.stringify({ success: false, name: dev.name, error: `Search: ${searchResp.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchResp.json();
    const results = searchData.data || [];

    // Exclude social/directory sites
    const excludeDomains = ["linkedin.com", "facebook.com", "instagram.com", "twitter.com", "crunchbase.com", "bayut.com", "propertyfinder.ae", "dubizzle.com", "wikipedia.org"];

    let logoUrl: string | null = null;
    let sourceUrl = "";

    for (const result of results) {
      try {
        const domain = new URL(result.url).hostname;
        if (excludeDomains.some(d => domain.includes(d))) continue;

        // Check branding data from search scrape
        const branding = result.branding;
        if (branding?.logo) {
          logoUrl = branding.logo;
          sourceUrl = result.url;
          break;
        }
        if (branding?.images?.logo) {
          logoUrl = branding.images.logo;
          sourceUrl = result.url;
          break;
        }
      } catch {}
    }

    // If no branding logo, try scraping the top result for HTML logo extraction
    if (!logoUrl && results.length > 0) {
      const bestUrl = results.find((r: any) => {
        try {
          const d = new URL(r.url).hostname;
          return !excludeDomains.some(ex => d.includes(ex));
        } catch { return false; }
      })?.url;

      if (bestUrl) {
        sourceUrl = bestUrl;
        try {
          const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: bestUrl, formats: ["branding"], waitFor: 3000 }),
          });

          if (scrapeResp.ok) {
            const scrapeData = await scrapeResp.json();
            const b = scrapeData.data?.branding || scrapeData.branding;
            logoUrl = b?.logo || b?.images?.logo || null;
          }
        } catch {}
      }
    }

    if (logoUrl) {
      // Make absolute
      if (logoUrl.startsWith("/") && sourceUrl) {
        try {
          const base = new URL(sourceUrl);
          logoUrl = `${base.origin}${logoUrl}`;
        } catch {}
      }

      const { error } = await supabase
        .from("developers")
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq("id", dev.id);

      console.log(error ? `❌ DB error: ${error.message}` : `✅ Logo saved: ${dev.name} -> ${logoUrl}`);

      return new Response(JSON.stringify({
        success: !error,
        name: dev.name,
        logo_url: logoUrl,
        source: sourceUrl,
        next_offset: offset + 1,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`❌ No logo found for: ${dev.name}`);
    return new Response(JSON.stringify({
      success: false,
      name: dev.name,
      error: "No logo found",
      next_offset: offset + 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
