// news-extract-from-link — Owner-only. Takes a URL, returns an editable draft.
// Uses Firecrawl scrape + summary; never writes to the DB.
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { firecrawlScrape } from "../_shared/firecrawl.ts";
import { isPublicHttpUrl } from "../_shared/ssrf-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !isPublicHttpUrl(url)) {
      return new Response(JSON.stringify({ error: "Valid url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        author: { type: "string" },
        published_at: { type: "string", description: "ISO 8601 date" },
        hero_image_url: { type: "string" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
      },
    };

    const result = await firecrawlScrape(url, {
      formats: ["markdown", "summary", { type: "json", schema }],
      onlyMainContent: true,
    });
    const doc = result?.data ?? result;
    const json = doc?.json ?? {};
    const meta = doc?.metadata ?? {};

    const draft = {
      source_url: url,
      title: json.title || meta.title || meta.ogTitle || "",
      excerpt: doc?.summary || meta.description || "",
      content: doc?.markdown || doc?.html || "",
      author: json.author || meta.author || null,
      published_at: json.published_at || meta.publishedTime || null,
      hero_image_url: json.hero_image_url || meta.ogImage || null,
      category: json.category || "Market Update",
      tags: json.tags || [],
      source: (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })(),
    };

    return new Response(JSON.stringify({ draft, raw: { metadata: meta } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
