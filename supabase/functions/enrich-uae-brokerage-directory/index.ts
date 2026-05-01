// Enriches public.crm_brokerages with phone / email / website / office address
// for rows that are missing those fields, plus re-verifies "low" / "medium" confidence rows.
// Strategy mirrors enrich-developer-registry: Perplexity sonar for grounded research,
// Firecrawl scrape of the brokerage's own website if discovered, and Lovable AI
// (Gemini 3 flash) to extract phone/email from the contact page markdown.
//
// Auth: caller must be a JBJ owner. Idempotent — only fills blanks unless ?reverify=true.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMIRATES = ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"];

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const d = p.replace(/[^0-9+]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("0")) return "+971" + d.slice(1);
  if (!d.startsWith("+")) return "+" + d;
  return d;
}

function normalizeWebsite(w?: string | null): string | null {
  if (!w) return null;
  const t = w.trim();
  if (!t) return null;
  return t.startsWith("http") ? t : "https://" + t.replace(/^\/+/, "");
}

async function perplexityResearch(
  name: string,
  emirate: string | null,
  rera: string | null,
  key: string,
): Promise<{
  phone: string | null;
  email: string | null;
  website: string | null;
  office_address: string | null;
  hq_emirate: string | null;
  rera_license: string | null;
  citation?: string;
} | null> {
  const schema = {
    type: "object",
    properties: {
      phone: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      website: { type: ["string", "null"] },
      office_address: { type: ["string", "null"] },
      hq_emirate: { type: ["string", "null"] },
      rera_license: { type: ["string", "null"] },
    },
    required: ["phone", "email", "website", "office_address", "hq_emirate", "rera_license"],
  };

  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You research UAE real-estate brokerage offices. Return verifiable facts only — from the firm's own website, the DLD/RERA broker registry, the Abu Dhabi DMT, or the relevant emirate municipality. Use null for unknowns. Never fabricate.",
        },
        {
          role: "user",
          content: `Research the UAE real estate brokerage "${name}"${emirate ? ` in ${emirate}` : ""}${rera ? ` (RERA license ${rera})` : ""}. Return JSON: phone (international format with +971), email (sales/info), website, office_address (full street + area + emirate), hq_emirate (one of ${EMIRATES.join(", ")}), rera_license (DLD or DMT broker registration number).`,
        },
      ],
      response_format: { type: "json_schema", json_schema: { name: "brokerage_facts", schema } },
      search_domain_filter: ["-reddit.com", "-twitter.com", "-x.com"],
      temperature: 0.0,
    }),
  });

  if (!resp.ok) {
    console.error("perplexity err", resp.status);
    return null;
  }
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content;
  let parsed: any = null;
  try { parsed = typeof content === "string" ? JSON.parse(content) : content; } catch { return null; }
  if (!parsed) return null;
  return { ...parsed, citation: json?.citations?.[0] };
}

async function firecrawlScrape(url: string, key: string): Promise<string | null> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.markdown ?? data?.data?.markdown ?? null;
  } catch (e) {
    console.error("firecrawl err", e);
    return null;
  }
}

async function aiExtractContact(markdown: string, key: string): Promise<{ phone?: string | null; email?: string | null }> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Extract the primary corporate phone and email from this brokerage's contact page markdown. Return strict JSON {phone, email} with null for unknown." },
          { role: "user", content: markdown.slice(0, 8000) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_contact",
            parameters: {
              type: "object",
              properties: { phone: { type: ["string", "null"] }, email: { type: ["string", "null"] } },
              required: ["phone", "email"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_contact" } },
      }),
    });
    if (!resp.ok) return {};
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    return args ? JSON.parse(args) : {};
  } catch (e) {
    console.error("ai extract err", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
    const PPLX = Deno.env.get("PERPLEXITY_API_KEY");
    const FIRE = Deno.env.get("FIRECRAWL_API_KEY");
    if (!LOVABLE) throw new Error("LOVABLE_API_KEY not configured");

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = u.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isOwner } = await admin.rpc("is_jbj_owner", { _user_id: userId });
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = body.ids;
    const reverify: boolean = !!body.reverify;
    const batchSize = Math.min(Math.max(Number(body.batchSize) || 3, 1), 5);
    const TIME_BUDGET_MS = 120_000;
    const startedAt = Date.now();

    let query = admin
      .from("crm_brokerages")
      .select("id, owner_id, company_name, rera_license, phone, email, website, office_address, emirate, confidence, field_sources")
      .eq("owner_id", userId);

    if (ids?.length) {
      query = query.in("id", ids);
    } else {
      // Missing OR low/medium confidence
      const filter = reverify
        ? "phone.is.null,email.is.null,website.is.null,office_address.is.null,confidence.eq.low,confidence.eq.medium"
        : "phone.is.null,email.is.null,website.is.null,office_address.is.null";
      query = query.or(filter).order("created_at", { ascending: true }).limit(batchSize);
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Nothing to enrich" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: any[] = [];
    let timedOut = false;
    for (const r of rows) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) { timedOut = true; break; }

      const patch: Record<string, unknown> = {};
      const sourceUpdates: Record<string, { source: string; url?: string; fetched_at: string }> = {};
      const fetchedAt = new Date().toISOString();

      // 1. Perplexity research
      if (PPLX) {
        const facts = await perplexityResearch(r.company_name, r.emirate, r.rera_license, PPLX);
        if (facts) {
          const phone = normalizePhone(facts.phone);
          const website = normalizeWebsite(facts.website);
          if (!r.phone && phone) { patch.phone = phone; sourceUpdates.phone = { source: "perplexity", url: facts.citation, fetched_at: fetchedAt }; }
          if (!r.email && facts.email) { patch.email = facts.email.toLowerCase(); sourceUpdates.email = { source: "perplexity", url: facts.citation, fetched_at: fetchedAt }; }
          if (!r.website && website) { patch.website = website; sourceUpdates.website = { source: "perplexity", url: facts.citation, fetched_at: fetchedAt }; }
          if (!r.office_address && facts.office_address) {
            patch.office_address = facts.office_address;
            patch.office_location = facts.office_address;
            sourceUpdates.office_address = { source: "perplexity", url: facts.citation, fetched_at: fetchedAt };
          }
          if (!r.emirate && facts.hq_emirate) patch.emirate = facts.hq_emirate;
          if (!r.rera_license && facts.rera_license) {
            patch.rera_license = facts.rera_license;
            sourceUpdates.rera_license = { source: "perplexity", url: facts.citation, fetched_at: fetchedAt };
          }
        }
      }

      // 2. Firecrawl + AI on the discovered website (only if we still need phone or email)
      const siteUrl = (patch.website as string | undefined) ?? r.website;
      const stillNeedContact = (!r.phone && !patch.phone) || (!r.email && !patch.email);
      if (FIRE && siteUrl && stillNeedContact) {
        const contactUrls = [siteUrl, siteUrl.replace(/\/$/, "") + "/contact", siteUrl.replace(/\/$/, "") + "/contact-us"];
        for (const url of contactUrls) {
          const md = await firecrawlScrape(url, FIRE);
          if (!md) continue;
          const ext = await aiExtractContact(md, LOVABLE);
          if (!r.phone && !patch.phone && ext.phone) {
            patch.phone = normalizePhone(ext.phone);
            sourceUpdates.phone = { source: "firecrawl", url, fetched_at: fetchedAt };
          }
          if (!r.email && !patch.email && ext.email) {
            patch.email = ext.email.toLowerCase();
            sourceUpdates.email = { source: "firecrawl", url, fetched_at: fetchedAt };
          }
          if (patch.phone && patch.email) break;
        }
      }

      if (Object.keys(patch).length) {
        const merged = { ...((r as any).field_sources ?? {}), ...sourceUpdates };
        const filled = Number(!!(patch.phone || r.phone)) + Number(!!(patch.email || r.email)) + Number(!!(patch.website || r.website)) + Number(!!(patch.office_address || r.office_address));
        patch.field_sources = merged;
        patch.last_verified_at = fetchedAt;
        patch.confidence = filled >= 3 ? "high" : filled >= 1 ? "medium" : "low";
        const { error: upErr } = await admin.from("crm_brokerages").update(patch).eq("id", r.id);
        if (upErr) console.error("update err", r.id, upErr.message);
        results.push({ id: r.id, name: r.company_name, filled: Object.keys(patch).filter(k => !["field_sources","last_verified_at","confidence","office_location"].includes(k)) });
      } else {
        results.push({ id: r.id, name: r.company_name, filled: [] });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, timedOut, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("enrich-uae-brokerage-directory error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
