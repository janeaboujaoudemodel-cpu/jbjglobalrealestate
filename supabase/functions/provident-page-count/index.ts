import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Provident Page Count
 * Lightweight helper used by the admin Sync Dashboard.
 * Detects total /new-projects/page/{n}/ pages via link discovery.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ success: false, error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = "https://providentestate.com/new-projects/";

    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["links"],
        waitFor: 8000,
        timeout: 60000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ success: false, error: `Failed to detect pages (${res.status})`, details: text.slice(0, 250) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const links: string[] = data?.data?.links || data?.links || [];

    let maxPage = 1;
    for (const l of links) {
      const m = l.match(/\/new-projects\/page\/(\d+)\/?$/i);
      if (m?.[1]) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > maxPage) maxPage = n;
      }
    }

    // The source uses JS pagination, so pagination links may not be discoverable.
    // If we can't reliably detect, fall back to the known admin default.
    const totalPages = maxPage > 1 ? maxPage : 89;
    const estimatedListings = totalPages * 15;

    return new Response(JSON.stringify({ success: true, total_pages: totalPages, estimated_listings: estimatedListings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
