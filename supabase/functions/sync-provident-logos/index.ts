import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(name: string): string {
  return name.toLowerCase()
    .replace(/\b(properties|developments|developers|development|group|real estate|realty|llc|pjsc|psc|fzco|fze|fz-llc|construction|and|&|the|company|international|holding|limited|ltd|inc|corp|corporation)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Step 1: Scrape Provident Estate developers page
    console.log("Scraping Provident Estate developers page...");
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://providentestate.com/developers/",
        formats: ["html"],
        waitFor: 5000,
      }),
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Scrape failed: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || scrapeData.html || "";
    console.log(`Got ${html.length} chars of HTML`);

    // Parse developer cards: extract name + logo URL
    const developerLogos: { name: string; logo_url: string }[] = [];

    // Pattern: <span>Developer Name</span> preceded by logo-section with img src
    const cardRegex = /<div class="developer-card">[\s\S]*?<div class="logo-section"><img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g;
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const logoUrl = match[1];
      const devName = match[2].trim();
      if (logoUrl && devName && logoUrl.includes("cloudfront.net")) {
        developerLogos.push({ name: devName, logo_url: logoUrl });
      }
    }

    // Also try alternate pattern where img comes after span
    const altRegex = /<a class="name"[^>]*><span>([^<]+)<\/span>[\s\S]*?<div class="logo-section"><img[^>]*src="([^"]+)"/g;
    while ((match = altRegex.exec(html)) !== null) {
      const devName = match[1].trim();
      const logoUrl = match[2];
      if (logoUrl && devName && logoUrl.includes("cloudfront.net")) {
        developerLogos.push({ name: devName, logo_url: logoUrl });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueLogos = developerLogos.filter(d => {
      const key = normalize(d.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Extracted ${uniqueLogos.length} developer logos from Provident`);

    // Step 2: Get our developers missing logos
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, message: "All developers have logos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build matching map for our developers
    const devMap = new Map<string, typeof devs[0]>();
    for (const dev of devs) {
      devMap.set(normalize(dev.name), dev);
    }

    let updated = 0;
    const matched: string[] = [];
    const unmatched: string[] = [];

    // Match Provident logos to our developers
    for (const pDev of uniqueLogos) {
      const norm = normalize(pDev.name);
      const ourDev = devMap.get(norm);

      if (ourDev) {
        // Upgrade to higher quality URL
        const logoUrl = pDev.logo_url.replace(/\/x\/\d+x\d*\//, "/x/296x/");
        
        const { error } = await supabase
          .from("developers")
          .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
          .eq("id", ourDev.id);

        if (!error) {
          updated++;
          matched.push(`${ourDev.name} -> ${pDev.name}`);
          console.log(`✅ Matched: ${ourDev.name}`);
        }
      } else {
        unmatched.push(pDev.name);
      }
    }

    const { count } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .is("logo_url", null);

    return new Response(JSON.stringify({
      success: true,
      provident_logos_found: uniqueLogos.length,
      matched_and_updated: updated,
      still_missing: count || 0,
      matched_developers: matched,
      unmatched_provident: unmatched,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
