// developer-enrich: fills missing logo_url, ceo_name, license_number,
// headquarters, and social handles on the developers table using
// Lovable AI Gateway. Owner-only; never overwrites existing values.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TARGET_FIELDS = [
  "logo_url",
  "ceo_name",
  "license_number",
  "headquarters",
  "instagram_url",
  "linkedin_url",
  "website_url",
] as const;

type Target = typeof TARGET_FIELDS[number];

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function callAI(name: string): Promise<Record<string, string | null>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const prompt =
    `Research the UAE real-estate developer "${name}". Return ONLY a strict JSON object with these keys (use null when unknown, never invent):
{
  "logo_url": "https URL of the official logo (PNG/SVG/JPG) or null",
  "ceo_name": "Full name of the current CEO/Chairman or null",
  "license_number": "Trade license number issued in the UAE or null",
  "headquarters": "Headquarters address (city, country at minimum) or null",
  "instagram_url": "https URL of official Instagram profile or null",
  "linkedin_url": "https URL of official LinkedIn company page or null",
  "website_url": "https URL of official website or null"
}
No markdown, no commentary, just the JSON.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function isLiveImage(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!r.ok) return false;
    const ct = r.headers.get("content-type") ?? "";
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 25);
    const dryRun = !!body.dry_run;
    const ids: string[] | undefined = Array.isArray(body.developer_ids)
      ? body.developer_ids
      : undefined;

    const sb = admin();

    let q = sb
      .from("developers")
      .select(
        "id, name, logo_url, ceo_name, license_number, headquarters, instagram_url, linkedin_url, website_url",
      )
      .or(
        "logo_url.is.null,ceo_name.is.null,license_number.is.null,headquarters.is.null,instagram_url.is.null,linkedin_url.is.null,website_url.is.null",
      )
      .order("rank", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (ids?.length) q = q.in("id", ids);

    const { data: devs, error } = await q;
    if (error) throw error;
    if (!devs?.length) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: "Nothing to enrich" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];
    for (const dev of devs) {
      try {
        const ai = await callAI(dev.name);
        const updates: Record<string, string> = {};

        for (const field of TARGET_FIELDS) {
          if ((dev as any)[field]) continue; // never overwrite human edits
          const value = ai?.[field];
          if (typeof value !== "string" || !value.trim()) continue;
          if (field === "logo_url") {
            if (!(await isLiveImage(value))) continue;
          }
          if (
            (field.endsWith("_url") || field === "logo_url") &&
            !value.startsWith("http")
          ) continue;
          updates[field] = value.trim();
        }

        if (!dryRun && Object.keys(updates).length) {
          await sb.from("developers").update(updates).eq("id", dev.id);
          await sb.from("developer_enrichment_log").insert({
            developer_id: dev.id,
            source_urls: [],
            fields_filled: updates,
            model: "google/gemini-3-flash-preview",
          });
        }

        results.push({ id: dev.id, name: dev.name, filled: Object.keys(updates), updates });
      } catch (e) {
        results.push({
          id: dev.id,
          name: dev.name,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed: results.length, dry_run: dryRun, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
