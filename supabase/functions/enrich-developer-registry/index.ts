import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

function detectEmirate(text?: string | null): string | null {
  if (!text) return null;
  const t = text.toLowerCase();
  for (const e of EMIRATES) if (t.includes(e.toLowerCase())) return e;
  return null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function domainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function perplexityResearch(name: string, key: string): Promise<{
  data: any;
  citation?: string;
} | null> {
  const schema = {
    type: "object",
    properties: {
      hq_emirate: { type: ["string", "null"] },
      phone: { type: ["string", "null"] },
      sales_email: { type: ["string", "null"] },
      website: { type: ["string", "null"] },
      contact_name: { type: ["string", "null"] },
      contact_role: { type: ["string", "null"] },
    },
    required: ["hq_emirate", "phone", "sales_email", "website", "contact_name", "contact_role"],
  };
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You research UAE real estate developers. Return only verifiable facts from the developer's official website, DLD/RERA, or LinkedIn. Use null for unknown values. Never fabricate.",
        },
        {
          role: "user",
          content: `Research the UAE real estate developer "${name}". Return JSON: { hq_emirate (one of Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain), phone (HQ landline with international format), sales_email, website, contact_name (head of sales / partnership manager if known), contact_role }.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "developer_facts", schema },
      },
      search_domain_filter: ["-reddit.com", "-twitter.com"],
      temperature: 0.1,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("Perplexity error", resp.status, t);
    return null;
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  let parsed: any = null;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    return null;
  }
  return { data: parsed, citation: json?.citations?.[0] };
}

async function firecrawlScrape(url: string, key: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.markdown ?? data?.data?.markdown ?? null;
  } catch (e) {
    console.error("Firecrawl error", e);
    return null;
  }
}

async function aiExtractContact(markdown: string, key: string): Promise<{
  phone?: string | null;
  email?: string | null;
}> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Extract the primary corporate phone and email from this contact page markdown. Return strict JSON {phone, email} with null for unknown.",
          },
          { role: "user", content: markdown.slice(0, 8000) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_contact",
              parameters: {
                type: "object",
                properties: {
                  phone: { type: ["string", "null"] },
                  email: { type: ["string", "null"] },
                },
                required: ["phone", "email"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_contact" } },
      }),
    });
    if (!resp.ok) return {};
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return {};
    return JSON.parse(args);
  } catch (e) {
    console.error("AI extract error", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;
    const useWeb: boolean = body.useWeb !== false;
    // Hard-capped to keep us well under the 150s edge-function idle timeout.
    // Each row can spend ~10–25s across Perplexity + Firecrawl + AI extract.
    const batchSize: number = Math.min(Math.max(body.batchSize ?? 3, 1), 5);
    const startedAt = Date.now();
    const TIME_BUDGET_MS = 120_000; // stop starting new rows after 2 min

    // Fetch target rows
    let query = admin
      .from("crm_developer_registry")
      .select(
        "id, owner_id, developer_name, developer_slug, phone, developer_email, emirate, website, developer_contact, field_sources",
      )
      .eq("owner_id", userId);

    if (ids && ids.length > 0) {
      query = query.in("id", ids);
    } else {
      query = query
        .or(
          "phone.is.null,developer_email.is.null,emirate.is.null,website.is.null,developer_contact.is.null",
        )
        .order("created_at", { ascending: true })
        .limit(batchSize);
    }

    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) throw rowsErr;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, results: [], message: "Nothing to enrich" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Master catalog lookup
    const slugs = rows.map((r) => (r.developer_slug || "").toLowerCase()).filter(Boolean);
    const { data: masters } = await admin
      .from("developers")
      .select("slug, headquarters, website_url")
      .in("slug", slugs);
    const masterBySlug = new Map<string, any>();
    (masters || []).forEach((m: any) => masterBySlug.set((m.slug || "").toLowerCase(), m));

    const results: any[] = [];

    let timedOut = false;
    for (const r of rows) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        timedOut = true;
        break;
      }
      const filled: string[] = [];
      const updates: Record<string, any> = {};
      const sources: Record<string, any> = { ...(r.field_sources || {}) };

      // 1. Master catalog
      const master = masterBySlug.get((r.developer_slug || "").toLowerCase());
      if (master) {
        if (!r.website && master.website_url) {
          updates.website = master.website_url;
          sources.website = { source: "master_catalog", fetched_at: nowIso() };
          filled.push("website");
        }
        if (!r.emirate) {
          const em = detectEmirate(master.headquarters);
          if (em) {
            updates.emirate = em;
            sources.emirate = { source: "master_catalog", fetched_at: nowIso() };
            filled.push("emirate");
          }
        }
      }

      // 2. Perplexity
      if (useWeb && PERPLEXITY_API_KEY) {
        try {
          const research = await perplexityResearch(r.developer_name, PERPLEXITY_API_KEY);
          if (research?.data) {
            const d = research.data;
            const cite = research.citation;
            const meta = (extra: Record<string, any> = {}) => ({
              source: "perplexity",
              ...(cite ? { url: cite } : {}),
              fetched_at: nowIso(),
              ...extra,
            });

            if (!updates.website && !r.website && d.website) {
              updates.website = d.website;
              sources.website = meta();
              filled.push("website");
            }
            if (!updates.emirate && !r.emirate && d.hq_emirate && EMIRATES.includes(d.hq_emirate)) {
              updates.emirate = d.hq_emirate;
              sources.emirate = meta();
              filled.push("emirate");
            }
            if (!r.phone && d.phone) {
              updates.phone = d.phone;
              sources.phone = meta();
              filled.push("phone");
            }
            if (!r.developer_email && d.sales_email) {
              updates.developer_email = d.sales_email;
              sources.developer_email = meta();
              filled.push("developer_email");
            }
            const existingContact = r.developer_contact || {};
            const hasContact =
              existingContact.name || existingContact.email || existingContact.phone;
            if (!hasContact && (d.contact_name || d.contact_role)) {
              updates.developer_contact = {
                name: d.contact_name || null,
                role: d.contact_role || null,
                phone: null,
                email: null,
              };
              sources.developer_contact = meta();
              filled.push("developer_contact");
            }
          }
        } catch (e) {
          console.error("Perplexity step failed for", r.developer_name, e);
        }
        // small delay between rows for rate limiting
        await new Promise((res) => setTimeout(res, 1200));
      }

      // 3. Firecrawl fallback for phone/email
      const websiteForScrape = updates.website || r.website;
      const stillMissingPhone = !updates.phone && !r.phone;
      const stillMissingEmail = !updates.developer_email && !r.developer_email;
      if (
        useWeb &&
        FIRECRAWL_API_KEY &&
        websiteForScrape &&
        (stillMissingPhone || stillMissingEmail)
      ) {
        const base = websiteForScrape.startsWith("http")
          ? websiteForScrape
          : `https://${websiteForScrape}`;
        const tryUrl = base.replace(/\/+$/, "") + "/contact";
        const md =
          (await firecrawlScrape(tryUrl, FIRECRAWL_API_KEY)) ||
          (await firecrawlScrape(base, FIRECRAWL_API_KEY));
        if (md) {
          const ext = await aiExtractContact(md, LOVABLE_API_KEY);
          const meta = {
            source: "firecrawl",
            url: tryUrl,
            fetched_at: nowIso(),
          };
          if (stillMissingPhone && ext.phone) {
            updates.phone = ext.phone;
            sources.phone = meta;
            filled.push("phone");
          }
          if (stillMissingEmail && ext.email) {
            updates.developer_email = ext.email;
            sources.developer_email = meta;
            filled.push("developer_email");
          }
        }
      }

      // 4. AI inference last resort for email
      if (
        !updates.developer_email &&
        !r.developer_email &&
        (updates.website || r.website)
      ) {
        const dom = domainFromUrl(updates.website || r.website);
        if (dom) {
          updates.developer_email = `info@${dom}`;
          sources.developer_email = {
            source: "ai_inference",
            fetched_at: nowIso(),
          };
          filled.push("developer_email");
        }
      }

      if (filled.length > 0) {
        updates.field_sources = sources;
        const { error: upErr } = await admin
          .from("crm_developer_registry")
          .update(updates)
          .eq("id", r.id)
          .eq("owner_id", userId);
        if (upErr) {
          console.error("Update failed", r.id, upErr);
          results.push({ id: r.id, name: r.developer_name, error: upErr.message });
          continue;
        }
      }

      results.push({ id: r.id, name: r.developer_name, filled });
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("enrich-developer-registry error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
