// Enrich a brokerage's missing fields from the open web (Firecrawl + Lovable AI).
// Body: { brokerage_ids: string[] } OR { limit: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");

async function searchWeb(q: string) {
  if (!FIRECRAWL_KEY) return [];
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: q, limit: 5 }),
    });
    const j = await r.json();
    return j?.data || j?.web?.results || [];
  } catch {
    return [];
  }
}

async function scrape(url: string): Promise<string> {
  if (!FIRECRAWL_KEY || !url) return "";
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    const j = await r.json();
    return j?.markdown || j?.data?.markdown || "";
  } catch {
    return "";
  }
}

async function extractWithAI(name: string, context: string) {
  if (!LOVABLE_KEY) return {};
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Extract real-estate agency contact info from web text. Return STRICT JSON only with keys: website, phone, email, instagram_url, office_address, logo_url. Use null if unknown. Phone must be E.164 if possible.",
        },
        {
          role: "user",
          content: `Agency: ${name}\n\nWeb text:\n${context.slice(0, 8000)}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const j = await r.json();
  try {
    return JSON.parse(j?.choices?.[0]?.message?.content || "{}");
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    let q = supabase
      .from("crm_brokerages")
      .select("id, company_name, website, phone, email, instagram_url, office_address, logo_url, enrichment_attempts")
      .lt("enrichment_attempts", 3);

    if (Array.isArray(body.brokerage_ids) && body.brokerage_ids.length) {
      q = q.in("id", body.brokerage_ids);
    } else {
      q = q.eq("enrichment_status", "pending").limit(body.limit || 25);
    }
    const { data: agencies, error } = await q;
    if (error) throw error;

    let enriched = 0;
    for (const a of agencies || []) {
      try {
        const missing =
          !a.website || !a.phone || !a.email || !a.office_address;
        if (!missing) {
          await supabase
            .from("crm_brokerages")
            .update({ enrichment_status: "enriched", enrichment_last_run_at: new Date().toISOString() })
            .eq("id", a.id);
          continue;
        }

        const results = await searchWeb(
          `"${a.company_name}" Dubai real estate broker contact`,
        );
        const top = results.slice(0, 2).map((r: any) => r.url).filter(Boolean);
        const targets = a.website ? [a.website, ...top] : top;
        let blob = "";
        for (const u of targets.slice(0, 2)) {
          blob += "\n\n=== " + u + " ===\n" + (await scrape(u));
        }
        const ext = await extractWithAI(a.company_name, blob);

        const patch: any = {
          enrichment_status: "enriched",
          enrichment_attempts: (a.enrichment_attempts || 0) + 1,
          enrichment_last_run_at: new Date().toISOString(),
        };
        if (!a.website && ext.website) patch.website = ext.website;
        if (!a.phone && ext.phone) patch.phone = String(ext.phone).replace(/[^\d+]/g, "");
        if (!a.email && ext.email) patch.email = String(ext.email).toLowerCase();
        if (!a.instagram_url && ext.instagram_url) patch.instagram_url = ext.instagram_url;
        if (!a.office_address && ext.office_address) patch.office_address = ext.office_address;
        if (!a.logo_url && ext.logo_url) patch.logo_url = ext.logo_url;

        await supabase.from("crm_brokerages").update(patch).eq("id", a.id);
        enriched++;
      } catch (e) {
        await supabase
          .from("crm_brokerages")
          .update({
            enrichment_status: "failed",
            enrichment_attempts: (a.enrichment_attempts || 0) + 1,
            enrichment_last_run_at: new Date().toISOString(),
          })
          .eq("id", a.id);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: agencies?.length || 0, enriched }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
