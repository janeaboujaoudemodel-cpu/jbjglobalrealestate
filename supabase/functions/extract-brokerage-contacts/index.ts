// Extract broker contacts (name + phone/WhatsApp) from uploaded screenshots using Lovable AI vision.
// Owner-only. Reads images from the private "brokerage-contact-photos" bucket via signed URLs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtractedContact {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: string | null;
  source_image: string;
}

async function extractFromImage(
  signedUrl: string,
  storagePath: string,
  apiKey: string,
): Promise<ExtractedContact[]> {
  const prompt = `You are reading a screenshot of a phone contact list, WhatsApp group member list, or an agency directory.
Extract every distinct broker / real-estate agent contact you can see.

Return STRICT JSON of the form: { "contacts": [ { "name": string|null, "phone": string|null, "whatsapp": string|null, "role": string|null } ] }

Rules:
- If the name is missing, unreadable, or obviously not a person's name, set "name" to null (the client will treat null as "Unknown").
- Always normalize phone numbers to international format starting with "+" when a country code is visible (e.g. "+9715…"). Strip spaces and dashes.
- Use "whatsapp" only when the source clearly indicates WhatsApp (green icon, WhatsApp UI). Otherwise leave it null.
- Skip rows that are obviously yourself, group titles, business pages, broadcast lists, or duplicate of an earlier row.
- If no contacts visible, return { "contacts": [] }.
- Do not include any commentary outside the JSON.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: signedUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("AI extract failed", resp.status, txt);
    return [];
  }
  const json = await resp.json();
  const raw = json?.choices?.[0]?.message?.content ?? "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }
  const list = Array.isArray(parsed?.contacts) ? parsed.contacts : [];
  return list.map((c: any) => ({
    name: c?.name ?? null,
    phone: c?.phone ?? null,
    whatsapp: c?.whatsapp ?? null,
    role: c?.role ?? null,
    source_image: storagePath,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Owner role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { paths } = await req.json();
    if (!Array.isArray(paths) || paths.length === 0) {
      return new Response(JSON.stringify({ error: "paths required (string[])" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (paths.length > 300) {
      return new Response(JSON.stringify({ error: "Maximum 300 photos per batch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use a service-role client for signed URLs so RLS doesn't block storage reads.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Process in batches of 5 in parallel
    const batchSize = 5;
    const all: ExtractedContact[] = [];
    for (let i = 0; i < paths.length; i += batchSize) {
      const slice: string[] = paths.slice(i, i + batchSize);
      const settled = await Promise.all(
        slice.map(async (p) => {
          if (!p.startsWith(`${user.id}/`)) return [];
          const { data: signed, error: sErr } = await admin
            .storage.from("brokerage-contact-photos")
            .createSignedUrl(p, 60 * 10);
          if (sErr || !signed?.signedUrl) {
            console.error("sign url failed", p, sErr);
            return [];
          }
          try {
            return await extractFromImage(signed.signedUrl, p, LOVABLE_API_KEY);
          } catch (err) {
            console.error("extract failed", p, err);
            return [];
          }
        }),
      );
      for (const arr of settled) all.push(...arr);
    }

    // Deduplicate on (normalized phone) — keep first occurrence
    const seen = new Set<string>();
    const dedup: ExtractedContact[] = [];
    for (const c of all) {
      const key = (c.phone || c.whatsapp || `${c.name}-${dedup.length}`)
        .replace(/[^\d+]/g, "");
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      dedup.push(c);
    }

    return new Response(
      JSON.stringify({ contacts: dedup, processed: paths.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
