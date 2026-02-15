import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { batch_size = 5, offset = 0 } = await req.json().catch(() => ({}));

    const { data: developers, error } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null)
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (error) throw error;
    if (!developers?.length) {
      return json({ success: true, message: "Done", processed: 0 });
    }

    console.log(`Batch ${offset}: ${developers.length} devs`);
    const results: any[] = [];

    for (const dev of developers) {
      try {
        // Use Firecrawl search to find their website and scrape branding
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `"${dev.name}" Dubai real estate developer official website`,
            limit: 3,
            scrapeOptions: { formats: ["html"] },
          }),
        });

        if (!searchRes.ok) {
          results.push({ id: dev.id, name: dev.name, success: false, error: `Search ${searchRes.status}` });
          continue;
        }

        const searchData = await searchRes.json();
        const searchResults = searchData.data || [];

        let foundLogo: string | null = null;
        let source = "";

        // Listing aggregator domains to skip (their logos aren't the developer's)
        const SKIP_DOMAINS = ["pcrealestate.ae","lazudi.com","thefirstpoint.ae","offplanbazaar.ae","bayut.com","propertyfinder.ae","dubizzle.com","rightmove.co.uk","zillow.com","realtor.com","99.co"];

        // Prioritize the developer's own website (not aggregators)
        const ownSiteResults = searchResults.filter((r: any) => {
          try {
            const host = new URL(r.url).hostname.replace(/^www\./, "");
            return !SKIP_DOMAINS.some(s => host.includes(s));
          } catch { return true; }
        });
        const orderedResults = [...ownSiteResults, ...searchResults.filter((r: any) => !ownSiteResults.includes(r))];

        for (const result of orderedResults) {
          const html = result.html || "";
          const url = result.url || "";
          let host = "";
          try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
          if (SKIP_DOMAINS.some(s => host.includes(s))) continue;

          // Try extracting logo from the page HTML
          const logo = extractLogoFromHtml(html, url);
          if (logo) {
            // Make sure the logo isn't from a skip domain either
            try {
              const logoHost = new URL(logo).hostname.replace(/^www\./, "");
              if (SKIP_DOMAINS.some(s => logoHost.includes(s))) continue;
            } catch {}
            try {
              const check = await fetch(logo, { method: "HEAD", redirect: "follow" });
              if (check.ok) {
                const ct = check.headers.get("content-type") || "";
                if (ct.includes("image") || logo.match(/\.(png|jpg|jpeg|svg|webp|ico)(\?|$)/i)) {
                  foundLogo = logo;
                  source = `search:${url}`;
                  break;
                }
              }
            } catch {}
          }

          // Fallback: try Clearbit with the result domain
          if (!foundLogo && url && host) {
            const clearbitUrl = `https://logo.clearbit.com/${host}?size=200&format=png`;
            try {
              const r = await fetch(clearbitUrl, { method: "HEAD" });
              if (r.ok) { foundLogo = clearbitUrl; source = `clearbit:${host}`; break; }
            } catch {}
          }
        }

        // Fallback: OG image from own site results only
        if (!foundLogo) {
          for (const result of ownSiteResults) {
            const html = result.html || "";
            const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
                           html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
            if (ogMatch?.[1] && ogMatch[1].startsWith("http")) {
              try {
                const check = await fetch(ogMatch[1], { method: "HEAD" });
                if (check.ok) { foundLogo = ogMatch[1]; source = `og:${result.url}`; break; }
              } catch {}
            }
          }
        }

        if (foundLogo) {
          await supabase.from("developers").update({ logo_url: foundLogo }).eq("id", dev.id);
          console.log(`✅ ${dev.name} → ${source}`);
          results.push({ id: dev.id, name: dev.name, success: true, logo_url: foundLogo, source });
        } else {
          console.log(`❌ ${dev.name}`);
          results.push({ id: dev.id, name: dev.name, success: false });
        }

        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        results.push({ id: dev.id, name: dev.name, success: false, error: String(err) });
      }
    }

    const ok = results.filter(r => r.success).length;
    return json({ success: true, processed: ok, failed: developers.length - ok, results, next_offset: offset + batch_size });
  } catch (error) {
    return json({ success: false, error: String(error) }, 500);
  }

  function json(data: any, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function extractLogoFromHtml(html: string, pageUrl: string): string | null {
  const patterns = [
    /<img[^>]+class="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+src="([^"]+)"[^>]+class="[^"]*logo[^"]*"/i,
    /<img[^>]+alt="[^"]*logo[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+src="([^"]+)"[^>]+alt="[^"]*logo[^"]*"/i,
    /<img[^>]+class="[^"]*brand[^"]*"[^>]+src="([^"]+)"/i,
    /<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="([^"]+)"/i,
    /<link[^>]+href="([^"]+)"[^>]+rel="[^"]*icon[^"]*"/i,
  ];

  let baseUrl = "";
  try { baseUrl = new URL(pageUrl).origin; } catch {}

  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) {
      let url = m[1];
      if (url.startsWith("//")) url = "https:" + url;
      else if (url.startsWith("/")) url = baseUrl + url;
      if (url.startsWith("http")) return url;
    }
  }
  return null;
}
